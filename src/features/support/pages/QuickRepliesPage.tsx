import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CHAT_TOPICS } from '@/entities/support/chats'
import { repliesStore, type QuickReply } from '@/entities/support/replies'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { ReplyModal } from '../components/ReplyModal'
import { logAction } from '@/entities/audit/audit'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * The ready answers operators insert in Yordam chati, each in both languages. A row opens it
 * in a centred modal.
 */
export function QuickRepliesPage() {
  const { t, tl } = useI18n()
  const all = repliesStore.useAll()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('')
  // undefined: closed; null: creating; an answer: editing it
  const [editing, setEditing] = useState<QuickReply | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<QuickReply | null>(null)

  const needle = query.trim().toLowerCase()
  const rows = all.filter(
    (reply) =>
      (needle === '' ||
        [reply.title.uz, reply.title.ru, reply.text.uz, reply.text.ru].some((v) =>
          v.toLowerCase().includes(needle),
        )) &&
      (!topic || reply.topic === topic),
  )

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.quickReplies')}
        description={t('replies.description')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('replies.add')}
          </Button>
        }
      />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('replies.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('replies.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('replies.topic')}
            options={[
              { value: '', label: t('replies.topic.all') },
              { value: 'any', label: t('replies.topic.any') },
              ...CHAT_TOPICS.map((value) => ({ value, label: t(`support.topic.${value}`) })),
            ]}
            value={topic}
            onChange={setTopic}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState title={t('replies.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${th} w-64`}>{t('replies.title')}</th>
                  <th className={th}>{t('replies.text')}</th>
                  <th className={`${th} w-36`}>{t('replies.topic')}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map((reply) => (
                  <tr
                    key={reply.id}
                    onClick={() => setEditing(reply)}
                    className="cursor-pointer border-b border-line align-top last:border-b-0 hover:bg-surface/60"
                  >
                    <td className="px-4 py-3 font-semibold">{tl(reply.title)}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">
                      <span className="line-clamp-2">{tl(reply.text)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium whitespace-nowrap text-ink-muted">
                        {reply.topic === 'any'
                          ? t('replies.topic.any')
                          : t(`support.topic.${reply.topic}`)}
                      </span>
                    </td>
                    <td className="pr-3">
                      <RowActions
                        actions={[
                          {
                            icon: Pencil,
                            label: t('common.edit'),
                            onClick: () => setEditing(reply),
                          },
                          {
                            icon: Trash2,
                            label: t('common.delete'),
                            onClick: () => setDeleting(reply),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <ReplyModal
          reply={editing}
          onClose={() => setEditing(undefined)}
          onDelete={(reply) => {
            setEditing(undefined)
            setDeleting(reply)
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('replies.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) repliesStore.remove(deleting.id)
          setDeleting(null)
          toast(t('replies.deleted'))
          logAction({
            section: 'quickReplies',
            kind: 'delete',
            action: 'audit.a.replyDeleted',
            target: deleting ? tl(deleting.title) : undefined,
          })
        }}
      >
        <p>{t('replies.delete.message', { title: deleting ? tl(deleting.title) : '' })}</p>
      </ConfirmDialog>
    </div>
  )
}
