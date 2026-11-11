import { Search } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { initialsOfName } from '@/entities/admins/admins'
import { SECTIONS } from '@/entities/admins/roles'
import { AUDIT_KINDS, type AuditEntry } from '@/entities/audit/audit'
import { auditTarget, auditText, loadAudit } from '@/entities/audit/auditApi'
import { loadAdmins } from '@/entities/admins/adminsApi'
import { useResource } from '@/shared/api/useResource'
import { useServerPager } from '@/shared/api/useServerPager'
import { useI18n } from '@/shared/i18n/useI18n'
import { addDays, sameDay } from '@/shared/lib/dates'
import { formatDate, groupDigits } from '@/shared/lib/format'
import { thisMonth, type Period } from '@/shared/lib/period'
import { Avatar } from '@/shared/ui/Avatar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { AuditEntryModal } from '../components/AuditEntryModal'
import { AuditKindBadge } from '../components/AuditKindBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const time = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

/**
 * Everything done in this panel: who, when, on which page, what and to whom, newest first and
 * split by day. Entries cannot be changed or deleted. A row opens the details, with each
 * changed field before and after.
 */
export function AuditLogPage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [admin, setAdmin] = useState('')
  const [section, setSection] = useState('')
  const [kind, setKind] = useState('')
  const [open, setOpen] = useState<AuditEntry | null>(null)

  // The search goes to the server a moment after typing stops
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(id)
  }, [query])

  const filters = JSON.stringify([period, search, admin, section, kind])
  const { page, limit, pager: pagerOf } = useServerPager(filters)
  const log = useResource(
    () => loadAudit({ period, q: search, staffId: admin, section, kind, page, limit }),
    JSON.stringify([filters, page, limit]),
  )
  const staff = useResource(() => loadAdmins({ limit: 100 }).catch(() => undefined), 'staff')
  const rows = log.data?.items ?? []
  const pager = pagerOf(log.data?.total ?? 0)
  const sectionLabel = (key: string) => {
    const found = SECTIONS.find((s) => s.key === key)
    return found ? t(found.label) : key || '—'
  }
  const [today] = useState(() => new Date())
  const dayLabel = (date: Date) =>
    sameDay(date, today)
      ? t('audit.today')
      : sameDay(date, addDays(today, -1))
        ? t('audit.yesterday')
        : formatDate(date)

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.audit')} />
      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('audit.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('audit.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('audit.col.admin')}
            options={[
              { value: '', label: t('audit.allAdmins') },
              ...(staff.data?.items ?? []).map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={admin}
            onChange={setAdmin}
          />
          <FilterSelect
            label={t('audit.col.section')}
            options={[
              { value: '', label: t('audit.allSections') },
              ...SECTIONS.map((s) => ({ value: s.key, label: t(s.label) })),
            ]}
            value={section}
            onChange={setSection}
          />
          <FilterSelect
            label={t('audit.col.kind')}
            options={[
              { value: '', label: t('audit.allKinds') },
              ...AUDIT_KINDS.map((value) => ({ value, label: t(`audit.kind.${value}`) })),
            ]}
            value={kind}
            onChange={setKind}
          />
        </div>
        <p className="px-4 pb-3 text-sm text-ink-muted">
          {t('audit.count', { count: groupDigits(pager.total) })}
        </p>

        {log.loading && !log.data ? (
          <EmptyState title={t('common.loading')} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('audit.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${th} w-24`}>{t('audit.col.time')}</th>
                  <th className={th}>{t('audit.col.admin')}</th>
                  <th className={th}>{t('audit.col.action')}</th>
                  <th className={th}>{t('audit.col.target')}</th>
                  <th className={th}>{t('audit.col.section')}</th>
                  <th className={th}>{t('audit.col.kind')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry, i) => {
                  const previous = rows[i - 1]
                  const newDay = !previous || !sameDay(previous.at, entry.at)
                  return (
                    <Fragment key={entry.id}>
                      {newDay && (
                        <tr className="border-b border-line bg-surface/60">
                          <td
                            colSpan={6}
                            className="px-4 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                          >
                            {dayLabel(entry.at)}
                          </td>
                        </tr>
                      )}
                      <tr
                        onClick={() => setOpen(entry)}
                        className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                      >
                        <td className="px-4 py-3 text-sm text-ink-muted tabular-nums">
                          {time(entry.at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                            <Avatar size="sm" initials={initialsOfName(entry.admin)} />
                            {entry.admin}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {auditText(t, entry)}
                          {entry.changes.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-ink-subtle">
                              {t('audit.changed', { count: String(entry.changes.length) })}
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          onClick={(e) => auditTarget(entry).href && e.stopPropagation()}
                        >
                          {entry.target ? (
                            auditTarget(entry).href ? (
                              <Link
                                to={auditTarget(entry).href!}
                                className="text-brand hover:underline"
                              >
                                {entry.target}
                              </Link>
                            ) : (
                              entry.target
                            )
                          ) : (
                            <span className="text-ink-subtle">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted">
                          {sectionLabel(entry.section)}
                        </td>
                        <td className="px-4 py-3">
                          <AuditKindBadge kind={entry.kind} />
                        </td>
                      </tr>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pager={pager} />
      </div>

      {open && <AuditEntryModal entry={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
