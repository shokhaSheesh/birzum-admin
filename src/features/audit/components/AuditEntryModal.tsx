import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { initialsOfName } from '@/entities/admins/admins'
import { SECTIONS } from '@/entities/admins/roles'
import type { AuditEntry } from '@/entities/audit/audit'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { AuditKindBadge } from './AuditKindBadge'

/** Everything about one entry: who, when, from where, what, and each field before and after. */
export function AuditEntryModal({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  const { t } = useI18n()
  const section = SECTIONS.find((s) => s.key === entry.section)
  const rows: [string, ReactNode][] = [
    [t('audit.col.time'), formatDateTime(entry.at)],
    [
      t('audit.col.admin'),
      <span key="a" className="flex items-center gap-2">
        <Avatar size="sm" initials={initialsOfName(entry.admin)} />
        {entry.admin}
      </span>,
    ],
    [t('audit.col.section'), section ? t(section.label) : '—'],
    [t('audit.col.kind'), <AuditKindBadge key="k" kind={entry.kind} />],
    ...(entry.target
      ? [
          [
            t('audit.col.target'),
            entry.href ? (
              <Link key="t" to={entry.href} className="font-semibold text-brand hover:underline">
                {entry.target}
              </Link>
            ) : (
              entry.target
            ),
          ] as [string, ReactNode],
        ]
      : []),
    [
      t('audit.ip'),
      <span key="ip" className="tabular-nums">
        {entry.ip}
      </span>,
    ],
  ]

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('nav.audit')}
      title={t(entry.action, entry.params)}
      footer={
        <Button variant="ghost" className="ml-auto" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-b-0"
          >
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {entry.changes && entry.changes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">{t('audit.changes')}</h3>
          <ul className="flex flex-col gap-2">
            {entry.changes.map((change) => (
              <li
                key={change.field}
                className="flex flex-col gap-1.5 rounded-control bg-surface p-3"
              >
                <span className="text-xs font-semibold text-ink-muted">{t(change.field)}</span>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-danger-soft px-2 py-0.5 text-danger line-through">
                    {change.from}
                  </span>
                  <ArrowRight size={14} className="text-ink-subtle" />
                  <span className="rounded-md bg-success-soft px-2 py-0.5 font-semibold text-success">
                    {change.to}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Modal>
  )
}
