import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { groupOf, type EventEntry } from '@/entities/audit/events'
import { WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime, groupDigits } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const link = (to: { label: string; href: string }) => (
  <Link to={to.href} className="font-semibold text-brand hover:underline">
    {to.label}
  </Link>
)

/** A request or response body. */
function Code({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-bold">{title}</h3>
      <pre className="max-h-56 overflow-auto rounded-control bg-surface p-3 text-xs leading-relaxed">
        {text}
      </pre>
    </section>
  )
}

/**
 * Everything about one step: when, in which app, who, the result, the service it called and how
 * long it took, the device, and on failure the service's code, message and what the client saw,
 * then the request and the response.
 */
export function EventModal({ entry, onClose }: { entry: EventEntry; onClose: () => void }) {
  const { t } = useI18n()
  const rows: [string, ReactNode][] = [
    [t('audit.col.time'), formatDateTime(entry.at)],
    [t('events.app'), WORKSPACE_INFO[entry.workspace].name],
    [t('events.col.who'), `${t(`events.actor.${entry.actor.kind}`)}: ${entry.actor.name}`],
    [t('events.col.group'), t(`events.group.${groupOf(entry.step)}`)],
    [
      t('events.col.result'),
      <StatusBadge key="r" tone={entry.ok ? 'success' : 'danger'}>
        {t(entry.ok ? 'events.ok' : 'events.failed')}
      </StatusBadge>,
    ],
    ...(entry.service ? [[t('events.col.service'), entry.service] as [string, ReactNode]] : []),
    ...(entry.ms !== undefined
      ? [
          [t('events.ms'), t('events.ms.value', { ms: groupDigits(entry.ms) })] as [
            string,
            ReactNode,
          ],
        ]
      : []),
    ...(entry.client
      ? [
          [t('events.col.client'), link({ label: entry.client.name, href: entry.client.href })] as [
            string,
            ReactNode,
          ],
        ]
      : []),
    ...(entry.object ? [[t('audit.col.target'), link(entry.object)] as [string, ReactNode]] : []),
    ...(entry.device ? [[t('events.device'), entry.device] as [string, ReactNode]] : []),
    ...(entry.ip ? [[t('audit.ip'), entry.ip] as [string, ReactNode]] : []),
  ]

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      eyebrow={t('nav.audit')}
      title={t(`events.step.${entry.step}`, entry.params)}
      footer={
        <Button variant="ghost" className="ml-auto" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      {entry.error && (
        <div className="flex gap-3 rounded-card bg-danger-soft p-4 text-danger">
          <CircleAlert size={20} className="mt-0.5 shrink-0" />
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            <p className="font-bold break-all">{entry.error.code}</p>
            <p>{entry.error.message}</p>
            {entry.error.shown && (
              <p className="text-ink">
                {t('events.shown')}: «{entry.error.shown}»
              </p>
            )}
          </div>
        </div>
      )}
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-b-0"
          >
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {entry.request && <Code title={t('events.request')} text={entry.request} />}
      {entry.response && <Code title={t('events.response')} text={entry.response} />}
    </Modal>
  )
}
