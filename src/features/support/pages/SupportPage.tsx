import {
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Forward,
  ImagePlus,
  MessageSquareText,
  RotateCcw,
  Search,
  SendHorizontal,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clientsStore, fullName, initialsOf, type Client } from '@/entities/clients/clients'
import { useAdmin } from '@/entities/session/session'
import {
  chatsStore,
  lastMessageOf,
  OPERATORS,
  type Chat,
  type ChatMessage,
} from '@/entities/support/chats'
import { repliesStore } from '@/entities/support/replies'
import { clientPath, ROUTES } from '@/shared/config/routes'
import {
  brandClientPath,
  brandPath,
  WORKSPACE_INFO,
  type Workspace,
} from '@/shared/config/workspaces'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { addDays, sameDay } from '@/shared/lib/dates'
import { formatDate } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { usePopover } from '@/shared/lib/usePopover'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Listbox, SelectChevron } from '@/shared/ui/Listbox'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { logAction } from '@/entities/audit/audit'
import { loanClientsStore, type LoanClient } from '@/entities/microloans/loanClients'
import { VoiceMessage, voiceClock } from '../components/VoiceMessage'

type Box = 'queue' | 'mine' | 'open' | 'closed'
const BOXES: Box[] = ['queue', 'mine', 'open', 'closed']
const now = () => new Date()
/** Who wrote: a Birzum client or a brand's, in the few fields the chat shows. */
type Person = { name: string; initials: string; photoUrl?: string; phone: string; href: string }
const fromClient = (client: Client): Person => ({
  name: fullName(client),
  initials: initialsOf(client),
  photoUrl: client.photoUrl,
  phone: client.phone,
  href: clientPath(client.id),
})
const fromLoanClient = (client: LoanClient): Person => ({
  name: client.name,
  initials: client.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join(''),
  phone: client.phone,
  href: brandClientPath(client.brand, client.id),
})

const clock = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

/**
 * Where support staff answer chats from an app: Birzum's client app, or a microloan brand's
 * (`app`), laid out like Telegram: the chats on the left (waiting in the queue, mine, all open,
 * closed) and the conversation on the right with a reply or an internal note. The client's name
 * in the chat header opens their client page.
 */
export function SupportPage({ app = 'birzum' }: { app?: Workspace }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const me = admin?.name ?? OPERATORS[0]
  const chats = chatsStore.useAll().filter((chat) => chat.app === app)
  const clients = clientsStore.useAll()
  const loanClients = loanClientsStore.useAll()
  const [params, setParams] = useSearchParams()
  const [box, setBox] = useState<Box>('queue')
  const [query, setQuery] = useState('')
  const [today] = useState(now)

  const inBox = (chat: Chat, which: Box) =>
    which === 'closed'
      ? chat.status === 'closed'
      : chat.status === 'open' &&
        (which === 'open' || (which === 'queue' ? !chat.assignee : chat.assignee === me))
  const needle = query.trim().toLowerCase()
  const clientOf = (chat: Chat) => clients.find((client) => client.id === chat.clientId)
  const loanClientOf = (chat: Chat) => loanClients.find((client) => client.id === chat.clientId)
  const personOf = (chat: Chat) => {
    if (app === 'birzum') {
      const client = clientOf(chat)
      return client && fromClient(client)
    }
    const client = loanClientOf(chat)
    return client && fromLoanClient(client)
  }
  const list = chats
    .filter((chat) => inBox(chat, box))
    .filter((chat) => {
      const person = personOf(chat)
      return (
        needle === '' ||
        (!!person &&
          (person.name.toLowerCase().includes(needle) || person.phone.includes(needle))) ||
        chat.messages.some((m) => m.text.toLowerCase().includes(needle))
      )
    })
    .sort((a, b) => lastMessageOf(b).at.getTime() - lastMessageOf(a).at.getTime())

  const openId = params.get('chat')
  const current = chats.find((chat) => chat.id === openId)
  const open = (id: string) => setParams({ chat: id }, { replace: true })

  // Reading a chat clears its unread count
  useEffect(() => {
    if (current?.unread) chatsStore.update(current.id, { unread: 0 })
  }, [current])

  const when = (date: Date) =>
    sameDay(date, today)
      ? clock(date)
      : sameDay(date, addDays(today, -1))
        ? t('support.yesterday')
        : formatDate(date).slice(0, 5)

  return (
    <div className="flex h-full min-h-0">
      {/* Chats */}
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col border-r border-line bg-canvas lg:w-[380px]',
          current && 'hidden lg:flex',
        )}
      >
        <div className="flex flex-col gap-3 px-4 pt-5">
          <div className="flex flex-col">
            {app !== 'birzum' && (
              <span className="text-xs font-semibold text-ink-muted">
                {WORKSPACE_INFO[app].name}
              </span>
            )}
            <h1 className="text-xl font-bold">{t('nav.support')}</h1>
          </div>
          <label className="flex h-10 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('support.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('support.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <UnderlineTabs
            label={t('nav.support')}
            options={BOXES.map((value) => ({
              value,
              label: t(`support.box.${value}`),
              // Counts only where they ask for action: the queue and my chats
              count:
                value === 'queue' || value === 'mine'
                  ? chats.filter((chat) => inBox(chat, value)).length
                  : undefined,
            }))}
            value={box}
            onChange={setBox}
          />
        </div>
        {list.length === 0 ? (
          <div className="flex-1">
            <EmptyState title={t(`support.empty.${box}`)} />
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {list.map((chat) => {
              const person = personOf(chat)
              const last = lastMessageOf(chat)
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => open(chat.id)}
                    aria-current={chat.id === openId || undefined}
                    className={cn(
                      'flex w-full gap-3 rounded-control p-3 text-left transition-colors',
                      chat.id === openId ? 'bg-green-200' : 'hover:bg-surface',
                    )}
                  >
                    <Avatar initials={person?.initials ?? '?'} photoUrl={person?.photoUrl} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'flex-1 truncate',
                            chat.unread ? 'font-bold' : 'font-semibold',
                          )}
                        >
                          {person?.name ?? '—'}
                        </span>
                        <span className="shrink-0 text-xs text-ink-subtle tabular-nums">
                          {when(last.at)}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex-1 truncate text-sm',
                            chat.unread ? 'text-ink' : 'text-ink-muted',
                          )}
                        >
                          {last.from === 'operator' && `${t('support.you')}: `}
                          {last.text ||
                            (last.voice
                              ? t('support.voice', { time: voiceClock(last.voice) })
                              : last.image
                                ? t('support.photo')
                                : '')}
                        </span>
                        {chat.unread > 0 && (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary">
                            {chat.unread}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 pt-1 text-xs text-ink-subtle">
                        <span className="rounded-full bg-surface px-2 py-0.5 text-ink-muted">
                          {t(`support.topic.${chat.topic}`)}
                        </span>
                        {chat.status === 'open' &&
                          (chat.assignee ? (
                            <span className="truncate">{chat.assignee}</span>
                          ) : (
                            <span className="font-semibold text-warning">
                              {t('support.waiting')}
                            </span>
                          ))}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {current ? (
        <Conversation
          key={current.id}
          chat={current}
          person={personOf(current)}
          me={me}
          onBack={() => setParams({}, { replace: true })}
        />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-surface text-ink-muted lg:flex">
          <MessageSquareText size={40} className="text-ink-subtle" />
          <p>{t('support.pick')}</p>
        </div>
      )}
    </div>
  )
}

/** One chat: header with who answers it, the messages, and the reply box. */
function Conversation({
  chat,
  person,
  me,
  onBack,
}: {
  chat: Chat
  person?: Person
  me: string
  onBack: () => void
}) {
  const { t, lang } = useI18n()
  const [mode, setMode] = useState<'reply' | 'note'>('reply')
  const [draft, setDraft] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const { open: quickOpen, setOpen: setQuickOpen, ref: quickRef } = usePopover()
  const [today] = useState(now)
  const operators = OPERATORS.includes(me) ? OPERATORS : [me, ...OPERATORS]
  const [replyLang, setReplyLang] = useState<Lang>(lang)
  // Answers for this chat's topic first, then the general ones, then the rest
  const rank = (topic: string) => (topic === chat.topic ? 0 : topic === 'any' ? 1 : 2)
  const replies = repliesStore
    .useAll()
    .filter((reply) => reply.app === chat.app)
    .sort((a, b) => rank(a.topic) - rank(b.topic))

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [chat.messages.length])

  // Search inside this chat: newest match first, Enter / arrows move between matches
  const [searching, setSearching] = useState(false)
  const [find, setFind] = useState('')
  const [hit, setHit] = useState(0)
  const needle = searching ? find.trim().toLowerCase() : ''
  const hits = needle
    ? chat.messages
        .filter((m) => m.from !== 'system' && m.text.toLowerCase().includes(needle))
        .map((m) => m.id)
        .reverse()
    : []
  const step = (by: number) =>
    hits.length && setHit((value) => (value + by + hits.length) % hits.length)
  const closeSearch = () => {
    setSearching(false)
    setFind('')
    setHit(0)
  }
  const target = hits[hit]
  useEffect(() => {
    if (target) document.getElementById(`msg-${target}`)?.scrollIntoView({ block: 'center' })
  }, [target])

  const line = (from: ChatMessage['from'], text: string, extra: Partial<ChatMessage> = {}) => ({
    id: newId(),
    from,
    text,
    at: now(),
    author: me,
    ...extra,
  })
  const save = (patch: Partial<Chat>, ...messages: ChatMessage[]) =>
    chatsStore.update(chat.id, { ...patch, messages: [...chat.messages, ...messages] })

  const take = () => save({ assignee: me }, line('system', t('support.sys.took', { name: me })))
  const assign = (name: string) =>
    name !== chat.assignee &&
    save(
      { assignee: name },
      line(
        'system',
        name === me
          ? t('support.sys.took', { name: me })
          : t('support.sys.handed', { name: me, to: name }),
      ),
    )
  const close = () => {
    save({ status: 'closed' }, line('system', t('support.sys.closed', { name: me })))
    toast(t('support.closed'))
    logAction({
      section: chat.app === 'birzum' ? 'support' : 'mlSupport',
      kind: 'update',
      action: chat.app === 'birzum' ? 'audit.a.chatClosed' : 'audit.a.loanChatClosed',
      params: chat.app === 'birzum' ? undefined : { brand: WORKSPACE_INFO[chat.app].name },
      target: person?.name,
      href: person?.href,
    })
  }
  const reopen = () =>
    save({ status: 'open' }, line('system', t('support.sys.reopened', { name: me })))

  const send = (text: string, image?: string) => {
    const clean = text.trim()
    if (!clean && !image) return
    const message = line(mode === 'note' ? 'note' : 'operator', clean, { image })
    // Answering a chat from the queue takes it
    const takes = !chat.assignee && mode === 'reply'
    save(
      { assignee: takes ? me : chat.assignee, status: 'open' },
      ...(takes ? [line('system', t('support.sys.took', { name: me }))] : []),
      message,
    )
    setDraft('')
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }

  // Day headers between messages from different days
  const dayLabel = (date: Date) =>
    sameDay(date, today)
      ? t('support.today')
      : sameDay(date, addDays(today, -1))
        ? t('support.yesterday')
        : formatDate(date)

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-surface">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas px-4 py-3 lg:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          className="grid size-9 place-items-center rounded-full hover:bg-surface lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        {person ? (
          <Link
            to={person.href}
            title={t('support.openClient')}
            className="group flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar initials={person.initials} photoUrl={person.photoUrl} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-bold group-hover:text-brand group-hover:underline">
                {person.name}
              </span>
              <span className="truncate text-sm text-ink-muted">
                {t(`support.topic.${chat.topic}`)} · {formatPhone(person.phone)}
              </span>
            </span>
          </Link>
        ) : (
          <span className="flex-1 font-bold">—</span>
        )}
        <button
          type="button"
          onClick={() => (searching ? closeSearch() : setSearching(true))}
          aria-label={t('support.find')}
          aria-pressed={searching}
          title={t('support.find')}
          className={cn(
            'grid size-10 place-items-center rounded-full text-ink-muted hover:bg-surface',
            searching && 'bg-surface text-ink',
          )}
        >
          <Search size={20} />
        </button>
        {chat.status === 'open' ? (
          <>
            {!chat.assignee && (
              <Button size="sm" variant="secondary" onClick={take}>
                <UserRound size={18} />
                {t('support.take')}
              </Button>
            )}
            {/* Pass the chat to another operator (or give one from the queue) */}
            <Listbox
              options={operators.map((name) => ({ value: name, label: name }))}
              value={chat.assignee ?? ''}
              onChange={assign}
              ariaLabel={t('support.transfer')}
              fit
              triggerClassName="flex h-10 items-center gap-2 rounded-control border border-line bg-canvas px-3 text-sm hover:border-navy-400"
              trigger={({ open, selected }) => (
                <>
                  <Forward size={16} className="text-ink-muted" />
                  {selected ? selected.label : t('support.transfer')}
                  <SelectChevron open={open} />
                </>
              )}
            />
            <Button size="sm" onClick={close}>
              <CheckCheck size={18} />
              {t('support.close')}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={reopen}>
            <RotateCcw size={18} />
            {t('support.reopen')}
          </Button>
        )}
      </header>

      {searching && (
        <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2 lg:px-5">
          <label className="flex h-9 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={16} className="shrink-0" />
            <span className="sr-only">{t('support.find')}</span>
            <input
              autoFocus
              value={find}
              onChange={(e) => {
                setFind(e.target.value)
                setHit(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') step(e.shiftKey ? -1 : 1)
                if (e.key === 'Escape') closeSearch()
              }}
              placeholder={t('support.find.placeholder')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <span className="min-w-14 text-center text-sm text-ink-muted tabular-nums">
            {needle ? (hits.length ? `${hit + 1} / ${hits.length}` : t('support.find.none')) : ''}
          </span>
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={hits.length < 2}
            aria-label={t('support.find.prev')}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-40"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={hits.length < 2}
            aria-label={t('support.find.next')}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-40"
          >
            <ChevronDown size={18} />
          </button>
          <button
            type="button"
            onClick={closeSearch}
            aria-label={t('common.close')}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 lg:px-6">
        {chat.messages.map((message, i) => {
          const newDay = i === 0 || !sameDay(message.at, chat.messages[i - 1].at)
          return (
            <div
              key={message.id}
              id={`msg-${message.id}`}
              className="flex scroll-mt-4 flex-col gap-3"
            >
              {newDay && (
                <span className="self-center rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink-muted shadow-sm">
                  {dayLabel(message.at)}
                </span>
              )}
              <Bubble
                message={message}
                person={person}
                find={needle}
                current={target === message.id}
              />
            </div>
          )
        })}
        <div ref={end} />
      </div>

      <form
        onSubmit={submit}
        className={cn(
          'flex flex-col gap-2 border-t border-line p-3 lg:px-5',
          mode === 'note' ? 'bg-warning-soft' : 'bg-canvas',
        )}
      >
        <div className="flex items-center gap-1">
          {(['reply', 'note'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={cn(
                'h-8 rounded-full px-3 text-sm font-semibold',
                mode === value ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-surface',
              )}
            >
              {t(`support.mode.${value}`)}
            </button>
          ))}
          <span className="ml-2 truncate text-xs text-ink-muted">
            {t(`support.mode.${mode}.hint`)}
          </span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter breaks the line
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(draft)
            }
          }}
          rows={2}
          placeholder={t(
            mode === 'note' ? 'support.placeholder.note' : 'support.placeholder.reply',
          )}
          className="max-h-40 min-h-12 resize-none rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none placeholder:text-ink-subtle focus:border-primary"
        />
        <div className="flex items-center gap-1">
          <div ref={quickRef} className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen(!quickOpen)}
              aria-expanded={quickOpen}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand hover:bg-surface"
            >
              <MessageSquareText size={18} />
              {t('support.quick')}
            </button>
            {quickOpen && (
              <div className="popover absolute bottom-full left-0 z-30 mb-1.5 flex w-96 flex-col rounded-card border border-line bg-canvas p-1.5 shadow-[0_12px_32px_-12px_rgb(7_42_60/0.35)]">
                <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="text-xs text-ink-muted">{t('replies.insertIn')}</span>
                  <div className="flex gap-0.5 rounded-full bg-surface p-0.5">
                    {LANGS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReplyLang(value)}
                        aria-pressed={replyLang === value}
                        className={cn(
                          'h-7 rounded-full px-2.5 text-xs font-bold uppercase',
                          replyLang === value ? 'bg-raised text-ink shadow-sm' : 'text-ink-muted',
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="flex max-h-72 flex-col overflow-y-auto">
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(reply.text[replyLang])
                          setMode('reply')
                          setQuickOpen(false)
                        }}
                        className="flex w-full flex-col gap-0.5 rounded-control px-3 py-2 text-left hover:bg-surface"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {reply.title[replyLang]}
                          {reply.topic === chat.topic && (
                            <span className="rounded-full bg-green-200 px-2 py-0.5 text-[11px] font-semibold">
                              {t(`support.topic.${chat.topic}`)}
                            </span>
                          )}
                        </span>
                        <span className="line-clamp-1 text-xs text-ink-muted">
                          {reply.text[replyLang]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Link
                  to={
                    chat.app === 'birzum'
                      ? ROUTES.quickReplies
                      : brandPath(chat.app, 'quick-replies')
                  }
                  className="mt-1 flex items-center justify-between rounded-control border-t border-line px-3 pt-2.5 pb-1.5 text-sm font-semibold text-brand hover:bg-surface"
                >
                  {t('replies.manage')}
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => picker.current?.click()}
            aria-label={t('support.attach')}
            title={t('support.attach')}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface"
          >
            <ImagePlus size={18} />
          </button>
          {/* Hidden: the button above is what people see */}
          <input
            ref={picker}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) send(draft, URL.createObjectURL(file))
              e.target.value = ''
            }}
          />
          <Button size="sm" type="submit" className="ml-auto" disabled={!draft.trim()}>
            <SendHorizontal size={18} />
            {t(mode === 'note' ? 'support.send.note' : 'support.send')}
          </Button>
        </div>
      </form>
    </section>
  )
}

/** One line of the chat: the shopper on the left, admins on the right, events in the middle. */
function Bubble({
  message,
  person,
  find = '',
  current = false,
}: {
  message: ChatMessage
  person?: Person
  /** Search words to mark in the text. */
  find?: string
  /** The match the search is on now. */
  current?: boolean
}) {
  const { t } = useI18n()
  if (message.from === 'system')
    return (
      <p className="self-center text-center text-xs text-ink-subtle">
        {message.text} · {clock(message.at)}
      </p>
    )
  const mine = message.from !== 'client'
  return (
    <div className={cn('flex max-w-[78%] gap-2', mine && 'self-end')}>
      {!mine && (
        <span className="mt-auto">
          <Avatar size="sm" initials={person?.initials ?? '?'} photoUrl={person?.photoUrl} />
        </span>
      )}
      <div className={cn('flex flex-col gap-1', mine && 'items-end')}>
        <div
          className={cn(
            'flex flex-col gap-2 rounded-[18px] px-3.5 py-2.5 text-sm',
            message.from === 'client' && 'rounded-bl-md border border-line bg-canvas',
            message.from === 'operator' && 'rounded-br-md bg-primary text-on-primary',
            message.from === 'note' && 'rounded-br-md border border-warning/30 bg-warning-soft',
          )}
        >
          {message.from === 'note' && (
            <span className="text-xs font-semibold text-warning">{t('support.mode.note')}</span>
          )}
          {message.image && (
            <img src={message.image} alt="" className="max-h-56 rounded-control object-cover" />
          )}
          {message.voice && (
            <VoiceMessage duration={message.voice} seed={Number(message.id.slice(1)) || 1} />
          )}
          {message.text && (
            <p className="whitespace-pre-line">
              <Marked text={message.text} find={find} current={current} />
            </p>
          )}
        </div>
        <span className="px-1 text-xs text-ink-subtle tabular-nums">
          {mine && message.author ? `${message.author} · ` : ''}
          {clock(message.at)}
          {message.from === 'operator' && (
            <CheckCheck size={14} aria-hidden className="ml-1 inline align-[-2px] text-brand" />
          )}
        </span>
      </div>
    </div>
  )
}

/** The text with each search match marked; the current match stands out. */
function Marked({ text, find, current }: { text: string; find: string; current: boolean }) {
  if (!find) return text
  const parts: ReactNode[] = []
  const lower = text.toLowerCase()
  let from = 0
  let at = lower.indexOf(find)
  while (at !== -1) {
    parts.push(text.slice(from, at))
    parts.push(
      <mark
        key={at}
        className={cn('rounded-sm text-ink', current ? 'bg-warning' : 'bg-warning-soft')}
      >
        {text.slice(at, at + find.length)}
      </mark>,
    )
    from = at + find.length
    at = lower.indexOf(find, from)
  }
  parts.push(text.slice(from))
  return parts
}
