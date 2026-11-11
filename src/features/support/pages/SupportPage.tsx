import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  ImagePlus,
  MessageSquareText,
  RotateCcw,
  Search,
  SendHorizontal,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  assignChat,
  closeChat,
  loadChat,
  loadChats,
  loadOperators,
  loadTopics,
  markChatRead,
  reopenChat,
  sendChatMessage,
  takeChat,
  type ChatBox,
  type ChatDetail,
  type ChatLine,
  type ChatRow,
} from '@/entities/support/chatsApi'
import { repliesApi } from '@/entities/support/repliesApi'
import { attempt } from '@/shared/api/createRemoteStore'
import { toastError } from '@/shared/api/errors'
import { uploadFile } from '@/shared/api/upload'
import { useChatEvents } from '@/entities/support/chatSocket'
import { useResource } from '@/shared/api/useResource'
import { ROUTES } from '@/shared/config/routes'
import { brandPath, WORKSPACE_INFO, type Workspace } from '@/shared/config/workspaces'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
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

const BOXES: ChatBox[] = ['queue', 'mine', 'open', 'closed']
const now = () => new Date()
const clock = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
const initialsOf = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase() || '?'

/**
 * Calls `reload` every few seconds while the tab is visible. With the live socket up the page
 * hears every change, so this is only a slow safety net.
 */
function usePoll(reload: () => void, ms: number) {
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) reload()
    }, ms)
    return () => clearInterval(id)
  }, [reload, ms])
}

/**
 * Where support staff answer chats from an app (admin doc 5.15a): the chats on the left (queue,
 * mine, all open, closed; the server says who sees which), the conversation in the middle with a
 * reply or an internal note, and who the client is on the right. A socket says which chat changed
 * and the page reads it again; while the socket is down the list is polled every 10 seconds and
 * an open chat every 5.
 */
export function SupportPage({ app = 'birzum' }: { app?: Workspace }) {
  const { t, tl } = useI18n()
  const [params, setParams] = useSearchParams()
  const [box, setBox] = useState<ChatBox>('queue')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [today] = useState(now)

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(id)
  }, [query])

  const list = useResource(
    () => loadChats(app, { box, q: search }),
    JSON.stringify([app, box, search]),
  )
  const openId = params.get('chat')
  // A signal for the open chat bumps `signal`, which makes Conversation read it again
  const [signal, setSignal] = useState(0)
  const pendingList = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const live = useChatEvents(app, (event) => {
    if (event.type === 'reconnected' || event.chatId === openId) setSignal((n) => n + 1)
    // Several signals in a burst read the list once
    clearTimeout(pendingList.current)
    pendingList.current = setTimeout(list.reload, 300)
  })
  useEffect(() => () => clearTimeout(pendingList.current), [])
  usePoll(list.reload, live ? 60_000 : 10_000)
  const topics = useResource(() => loadTopics(app), app)
  const rows = list.data?.items ?? []
  const counts = list.data?.counts

  const topicName = (code: string) => {
    const found = topics.data?.find((topic) => topic.code === code)
    return found ? tl(found.label) : code
  }
  const open = (id: string) => setParams({ chat: id }, { replace: true })

  const when = (date: Date) =>
    sameDay(date, today)
      ? clock(date)
      : sameDay(date, addDays(today, -1))
        ? t('support.yesterday')
        : formatDate(date).slice(0, 5)

  return (
    <div className="flex h-full min-h-0">
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col border-r border-line bg-canvas lg:w-[380px]',
          openId && 'hidden lg:flex',
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
              count: value === 'queue' || value === 'mine' ? counts?.[value] : undefined,
            }))}
            value={box}
            onChange={setBox}
          />
        </div>
        {list.loading && !list.data ? (
          <div className="flex-1">
            <EmptyState title={t('common.loading')} />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1">
            <EmptyState title={t(`support.empty.${box}`)} />
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {rows.map((chat) => (
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
                  <Avatar initials={initialsOf(chat.client.name)} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'flex-1 truncate',
                          chat.unread ? 'font-bold' : 'font-semibold',
                        )}
                      >
                        {chat.client.name ||
                          formatPhone(chat.client.phone.replace('+998', '')) ||
                          '—'}
                      </span>
                      <span className="shrink-0 text-xs text-ink-subtle tabular-nums">
                        {when(chat.lastMessage?.at ?? chat.updatedAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex-1 truncate text-sm',
                          chat.unread ? 'text-ink' : 'text-ink-muted',
                        )}
                      >
                        {chat.lastMessage?.from === 'operator' && `${t('support.you')}: `}
                        {chat.lastMessage?.hasImage && !chat.lastMessage.text
                          ? t('support.photo')
                          : chat.lastMessage?.text}
                      </span>
                      {chat.unread > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary">
                          {chat.unread}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 pt-1 text-xs text-ink-subtle">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-ink-muted">
                        {topicName(chat.topic)}
                      </span>
                      {chat.status === 'open' &&
                        (chat.assignee ? (
                          <span className="truncate">{chat.assignee.name}</span>
                        ) : (
                          <span className="font-semibold text-warning">{t('support.waiting')}</span>
                        ))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {openId ? (
        <Conversation
          key={openId}
          app={app}
          id={openId}
          topicName={topicName}
          live={live}
          signal={signal}
          onChanged={list.reload}
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
  app,
  id,
  topicName,
  live,
  signal,
  onChanged,
  onBack,
}: {
  app: Workspace
  id: string
  topicName: (code: string) => string
  /** The socket is up: polling slows down. */
  live: boolean
  /** Goes up when the socket says this chat changed. */
  signal: number
  /** The list should be read again (a chat moved box or its count changed). */
  onChanged: () => void
  onBack: () => void
}) {
  const { t, lang } = useI18n()
  const chatRes = useResource(() => loadChat(app, id), `${app}/${id}`)
  usePoll(chatRes.reload, live ? 30_000 : 5000)
  const reloadChat = chatRes.reload
  useEffect(() => {
    if (signal) reloadChat()
  }, [signal, reloadChat])
  const chat = chatRes.data
  const operators = useResource(() => loadOperators(app).catch(() => []), app).data ?? []
  const [mode, setMode] = useState<'reply' | 'note'>('reply')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const { open: quickOpen, setOpen: setQuickOpen, ref: quickRef } = usePopover()
  const [today] = useState(now)
  const [replyLang, setReplyLang] = useState<Lang>(lang)
  const rank = (topic: string) => (topic === chat?.topic ? 0 : topic === 'any' ? 1 : 2)
  const replies = [...repliesApi.storeOf(app).useAll()].sort(
    (a, b) => rank(a.topic) - rank(b.topic),
  )

  // Reading a chat clears its unread count on the server
  const unread = chat?.unread ?? 0
  useEffect(() => {
    if (unread > 0) markChatRead(app, id).then(onChanged, () => {})
  }, [unread, app, id, onChanged])

  const count = chat?.messages.length ?? 0
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [count])

  if (!chat)
    return (
      <section className="flex min-w-0 flex-1 flex-col bg-surface">
        <EmptyState title={t(chatRes.loading ? 'common.loading' : 'support.pick')} />
      </section>
    )

  // After any change: this chat and the list are read again
  const done = () => {
    chatRes.reload()
    onChanged()
  }
  const take = async () => {
    // Two operators taking at once: the loser gets chat_taken and sees the chat as it is now
    await attempt(() => takeChat(app, id))
    done()
  }
  const assign = async (staffId: string) => {
    if (staffId === chat.assignee?.id) return
    await attempt(() => assignChat(app, id, staffId))
    done()
  }
  const close = async () => {
    await attempt(
      () => closeChat(app, id),
      () => toast(t('support.closed')),
    )
    done()
  }
  const reopen = async () => {
    await attempt(() => reopenChat(app, id))
    done()
  }

  const send = async (text: string, files: File[] = []) => {
    const clean = text.trim()
    if (!clean && files.length === 0) return
    setSending(true)
    try {
      // Pictures go up first, then their URLs go with the message
      const images: string[] = []
      for (const file of files) images.push((await uploadFile(file, 'image')).url)
      await sendChatMessage(app, id, { kind: mode, text: clean, images })
      setDraft('')
    } catch (e) {
      toastError(e)
    }
    setSending(false)
    done()
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void send(draft)
  }

  const sysText = (line: ChatLine) => {
    const name = line.author?.name ?? chat.client.name
    if (line.key === 'took') return t('support.sys.took', { name })
    if (line.key === 'handed') return t('support.sys.handed', { name, to: line.targetName ?? '' })
    if (line.key === 'closed') return t('support.sys.closed', { name })
    return t('support.sys.reopened', { name })
  }
  const dayLabel = (date: Date) =>
    sameDay(date, today)
      ? t('support.today')
      : sameDay(date, addDays(today, -1))
        ? t('support.yesterday')
        : formatDate(date)

  return (
    <>
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
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-bold">{chat.client.name || '—'}</span>
            <span className="text-sm text-ink-muted">
              {topicName(chat.topic)}
              {chat.client.phone && ` · ${formatPhone(chat.client.phone.replace('+998', ''))}`}
            </span>
          </div>
          {chat.status === 'open' ? (
            <>
              {chat.assignee ? (
                <Listbox
                  options={(operators.some((o) => o.id === chat.assignee?.id)
                    ? operators
                    : [chat.assignee, ...operators]
                  ).map((operator) => ({ value: operator.id, label: operator.name }))}
                  value={chat.assignee.id}
                  onChange={(staffId) => void assign(staffId)}
                  ariaLabel={t('support.assignee')}
                  fit
                  triggerClassName="flex h-10 items-center gap-2 rounded-control border border-line bg-canvas px-3 text-sm hover:border-navy-400"
                  trigger={({ open, selected }) => (
                    <>
                      <UserRound size={16} className="text-ink-muted" />
                      {selected?.label}
                      <SelectChevron open={open} />
                    </>
                  )}
                />
              ) : (
                <Button size="sm" variant="secondary" onClick={() => void take()}>
                  <UserRound size={18} />
                  {t('support.take')}
                </Button>
              )}
              <Button size="sm" onClick={() => void close()}>
                <CheckCheck size={18} />
                {t('support.close')}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => void reopen()}>
              <RotateCcw size={18} />
              {t('support.reopen')}
            </Button>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 lg:px-6">
          {chat.messages.map((message, i) => {
            const newDay = i === 0 || !sameDay(message.at, chat.messages[i - 1].at)
            return (
              <div key={message.id} className="flex flex-col gap-3">
                {newDay && (
                  <span className="self-center rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink-muted shadow-sm">
                    {dayLabel(message.at)}
                  </span>
                )}
                <Bubble message={message} chat={chat} system={sysText(message)} />
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
                void send(draft)
              }
            }}
            maxLength={4000}
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
                                {topicName(chat.topic)}
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
                    to={app === 'birzum' ? ROUTES.quickReplies : brandPath(app, 'quick-replies')}
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
            {/* Hidden: the button above is what people see. jpeg and png, up to 5 MiB */}
            <input
              ref={picker}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void send(draft, [file])
                e.target.value = ''
              }}
            />
            <Button
              size="sm"
              type="submit"
              className="ml-auto"
              loading={sending}
              disabled={!draft.trim()}
            >
              <SendHorizontal size={18} />
              {t(mode === 'note' ? 'support.send.note' : 'support.send')}
            </Button>
          </div>
        </form>
      </section>

      <ClientPanel chat={chat} />
    </>
  )
}

/** One line of the chat: the client on the left, staff on the right, events in the middle. */
function Bubble({
  message,
  chat,
  system,
}: {
  message: ChatLine
  chat: ChatDetail
  system: string
}) {
  const { t } = useI18n()
  if (message.kind === 'system')
    return (
      <p className="self-center text-center text-xs text-ink-subtle">
        {system} · {clock(message.at)}
      </p>
    )
  const mine = message.kind !== 'client'
  return (
    <div className={cn('flex max-w-[78%] gap-2', mine && 'self-end')}>
      {!mine && (
        <span className="mt-auto">
          <Avatar size="sm" initials={initialsOf(chat.client.name)} />
        </span>
      )}
      <div className={cn('flex flex-col gap-1', mine && 'items-end')}>
        <div
          className={cn(
            'flex flex-col gap-2 rounded-[18px] px-3.5 py-2.5 text-sm',
            message.kind === 'client' && 'rounded-bl-md border border-line bg-canvas',
            message.kind === 'operator' && 'rounded-br-md bg-primary text-on-primary',
            message.kind === 'note' && 'rounded-br-md border border-warning/30 bg-warning-soft',
          )}
        >
          {message.kind === 'note' && (
            <span className="text-xs font-semibold text-warning">{t('support.mode.note')}</span>
          )}
          {message.images.map((src) => (
            <img key={src} src={src} alt="" className="max-h-56 rounded-control object-cover" />
          ))}
          {message.text && <p className="whitespace-pre-line">{message.text}</p>}
        </div>
        <span className="px-1 text-xs text-ink-subtle tabular-nums">
          {mine && message.author ? `${message.author.name} · ` : ''}
          {clock(message.at)}
        </span>
      </div>
    </div>
  )
}

/** Who wrote. The backend has no client account, debt or applications for a chat yet (admin doc, 5.15a). */
function ClientPanel({ chat }: { chat: ChatRow }) {
  const { t } = useI18n()
  return (
    <aside className="hidden w-[320px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-line bg-canvas p-5 xl:flex">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar initials={initialsOf(chat.client.name)} size="lg" />
        <p className="font-bold">{chat.client.name || '—'}</p>
        {chat.client.phone && (
          <p className="text-sm text-ink-muted tabular-nums">
            {formatPhone(chat.client.phone.replace('+998', ''))}
          </p>
        )}
      </div>
      <p className="border-t border-line pt-4 text-sm text-ink-subtle">
        {t('support.panel.later')}
      </p>
    </aside>
  )
}
