import {
  ChevronRight,
  EyeOff,
  GripVertical,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, type DragEvent, type KeyboardEvent } from 'react'
import { contactsInfoStore, faqStore, type Faq } from '@/entities/faq/faq'
import { brandPath, WORKSPACE_INFO, type Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { Switch } from '@/shared/ui/Switch'
import { ContactsModal } from '../components/ContactsModal'
import { FaqModal } from '../components/FaqModal'
import { logAction } from '@/entities/audit/audit'

type Drop = { id: string; after: boolean }

/** The list with `moved` placed before or after `target`. */
function reorder(all: Faq[], moved: Faq, target: Faq, after: boolean) {
  const rest = all.filter((item) => item !== moved)
  const at = rest.indexOf(target) + (after ? 1 : 0)
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

/** One app's list moved in the whole store, the other apps' questions kept where they are. */
function placeBack(store: Faq[], app: Workspace, list: Faq[]) {
  const queue = [...list]
  return store.map((item) => (item.app === app ? queue.shift()! : item))
}

/**
 * An app's Savol-javoblar (Birzum's client app, or a microloan brand's): the questions in the
 * order people see them, dragged by their handle to reorder, each with a switch to show or hide
 * it. On the right, Birzum's support contacts the app shows under the questions; a brand's app
 * points to its chat and its Kontaktlar page instead.
 */
export function FaqPage({ app = 'birzum' }: { app?: Workspace }) {
  const { t, tl } = useI18n()
  const store = faqStore.useAll()
  const all = store.filter((item) => item.app === app)
  const ml = app !== 'birzum'
  const audit = {
    section: ml ? 'mlFaq' : 'faq',
    params: ml ? { brand: WORKSPACE_INFO[app].name } : undefined,
  } as const
  const contacts = contactsInfoStore.useAll()[0]
  const [query, setQuery] = useState('')
  // undefined: closed; null: adding; a question: editing it
  const [editing, setEditing] = useState<Faq | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Faq | null>(null)
  const [editingContacts, setEditingContacts] = useState(false)
  const [dragged, setDragged] = useState<Faq | null>(null)
  const [drop, setDrop] = useState<Drop | null>(null)

  const needle = query.trim().toLowerCase()
  const rows = all.filter(
    (item) =>
      needle === '' ||
      [item.question.uz, item.question.ru, item.answer.uz, item.answer.ru].some((v) =>
        v.toLowerCase().includes(needle),
      ),
  )
  // Order only makes sense on the whole list, so dragging is off while searching
  const canMove = needle === ''
  const shown = all.filter((item) => item.visible)

  const dragOver = (e: DragEvent, target: Faq) => {
    if (!dragged || dragged === target) return
    e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    setDrop({ id: target.id, after: e.clientY > box.top + box.height / 2 })
  }
  const dropOn = (target: Faq) => {
    if (dragged && drop && dragged !== target)
      faqStore.replaceAll(placeBack(store, app, reorder(all, dragged, target, drop.after)))
    setDragged(null)
    setDrop(null)
  }
  // The handle also moves a row with the arrow keys, for keyboards and screen readers
  const keyMove = (e: KeyboardEvent, item: Faq) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const target = all[all.indexOf(item) + (e.key === 'ArrowUp' ? -1 : 1)]
    if (target)
      faqStore.replaceAll(placeBack(store, app, reorder(all, item, target, e.key === 'ArrowDown')))
  }
  const toggle = (item: Faq) => {
    faqStore.update(item.id, { visible: !item.visible })
    toast(t(item.visible ? 'faq.hidden' : 'faq.shown'))
    logAction({
      ...audit,
      kind: 'update',
      action: ml ? 'audit.a.loanFaqSaved' : 'audit.a.faqSaved',
      target: tl(item.question),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.faq')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('faq.add')}
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col rounded-card border border-line bg-canvas">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
              <Search size={18} className="shrink-0" />
              <span className="sr-only">{t('faq.search')}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('faq.search')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </label>
            <p className="text-sm text-ink-muted">
              {t('faq.count', { shown: String(shown.length), total: String(all.length) })}
            </p>
          </div>
          {rows.length === 0 ? (
            <EmptyState title={t('faq.empty')} />
          ) : (
            <ol className="flex flex-col border-t border-line">
              {rows.map((item) => (
                <li
                  key={item.id}
                  draggable={canMove}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    setDragged(item)
                  }}
                  onDragEnd={() => {
                    setDragged(null)
                    setDrop(null)
                  }}
                  onDragOver={(e) => dragOver(e, item)}
                  onDrop={() => dropOn(item)}
                  onClick={() => setEditing(item)}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 border-b border-line py-3 pr-3 pl-2 last:border-b-0 hover:bg-surface/60',
                    !item.visible && 'bg-surface/40',
                    dragged === item && 'opacity-40',
                    drop?.id === item.id &&
                      (drop.after
                        ? 'shadow-[inset_0_-2px_0_var(--color-primary)]'
                        : 'shadow-[inset_0_2px_0_var(--color-primary)]'),
                  )}
                >
                  <span onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={!canMove}
                      onKeyDown={(e) => keyMove(e, item)}
                      aria-label={t('faq.drag', { question: tl(item.question) })}
                      title={canMove ? t('faq.drag', { question: tl(item.question) }) : undefined}
                      className="grid size-8 cursor-grab place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink active:cursor-grabbing disabled:cursor-default disabled:opacity-30"
                    >
                      <GripVertical size={18} />
                    </button>
                  </span>
                  <span className="w-6 pt-1.5 text-sm text-ink-subtle tabular-nums">
                    {all.indexOf(item) + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
                    <p className={cn('font-semibold', !item.visible && 'text-ink-muted')}>
                      {tl(item.question)}
                    </p>
                    <p className="line-clamp-2 text-sm text-ink-muted">{tl(item.answer)}</p>
                    {!item.visible && (
                      <span className="flex items-center gap-1 text-xs font-medium text-ink-subtle">
                        <EyeOff size={14} />
                        {t('faq.hiddenNote')}
                      </span>
                    )}
                  </div>
                  <span className="pt-1.5" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={item.visible}
                      onChange={() => toggle(item)}
                      label={t('faq.visible', { question: tl(item.question) })}
                    />
                  </span>
                  <RowActions
                    actions={[
                      { icon: Pencil, label: t('common.edit'), onClick: () => setEditing(item) },
                      {
                        icon: Trash2,
                        label: t('common.delete'),
                        onClick: () => setDeleting(item),
                        danger: true,
                      },
                    ]}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {ml ? (
            <section className="flex flex-col gap-1 rounded-card border border-line bg-canvas p-2">
              {(
                [
                  [MessageSquareText, 'nav.support', 'faq.loan.chat', 'support'],
                  [MapPin, 'nav.contacts', 'faq.loan.contacts', 'contacts'],
                ] as const
              ).map(([Icon, label, hint, page]) => (
                <Link
                  key={page}
                  to={brandPath(app, page)}
                  className="flex items-center gap-3 rounded-control p-3 hover:bg-surface"
                >
                  <Icon size={20} className="shrink-0 text-brand" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">{t(label)}</span>
                    <span className="text-sm text-ink-muted">{t(hint)}</span>
                  </span>
                  <ChevronRight size={18} className="text-ink-subtle" />
                </Link>
              ))}
            </section>
          ) : (
            <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{t('faq.contacts')}</p>
                <Button size="sm" variant="ghost" onClick={() => setEditingContacts(true)}>
                  <Pencil size={16} />
                  {t('common.edit')}
                </Button>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{t('faq.contacts.phone')}</dt>
                  <dd className="font-semibold tabular-nums">{formatPhone(contacts.phone)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{t('faq.contacts.hours')}</dt>
                  <dd className="text-right font-semibold">{tl(contacts.hours)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Telegram</dt>
                  <dd className="font-semibold">@{contacts.telegram}</dd>
                </div>
              </dl>
            </section>
          )}
        </aside>
      </div>

      {editing !== undefined && (
        <FaqModal
          app={app}
          item={editing}
          onClose={() => setEditing(undefined)}
          onDelete={(item) => {
            setEditing(undefined)
            setDeleting(item)
          }}
        />
      )}
      {editingContacts && (
        <ContactsModal contacts={contacts} onClose={() => setEditingContacts(false)} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('faq.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) faqStore.remove(deleting.id)
          setDeleting(null)
          toast(t('faq.deleted'))
          logAction({
            ...audit,
            kind: 'delete',
            action: ml ? 'audit.a.loanFaqDeleted' : 'audit.a.faqDeleted',
            target: deleting ? tl(deleting.question) : undefined,
          })
        }}
      >
        <p>{t('faq.delete.message')}</p>
      </ConfirmDialog>
    </div>
  )
}
