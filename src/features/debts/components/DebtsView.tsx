import { Columns3, PhoneCall, RotateCcw, Rows3, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AGE_BUCKETS, ageBucketOf, type AgeBucket } from '@/entities/clients/debt'
import {
  CRITICAL_DAYS,
  DEBT_STATUSES,
  DEBT_TONES,
  type DebtStatus,
} from '@/entities/collections/debtCases'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { ALL_TIME, inRange, type DateRange } from '@/shared/lib/dates'
import { formatDate, formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { usePagination } from '@/shared/lib/usePagination'
import { Avatar } from '@/shared/ui/Avatar'
import { DateRangePicker } from '@/shared/ui/DateRangePicker'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { ViewToggle } from '@/shared/ui/ViewToggle'
import { DebtBoard } from './DebtBoard'
import type { BoardRow, MoveHandler } from '../lib/board'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const AGE_SHADES: Record<AgeBucket, string> = {
  d7: 'bg-danger/30',
  d14: 'bg-danger/55',
  d30: 'bg-danger/80',
  d30plus: 'bg-danger',
}
const CHIPS = [
  'all',
  'critical',
  'callToday',
  'noAnswer',
  'promised',
  'mine',
  'unassigned',
  'closed',
] as const
type Chip = (typeof CHIPS)[number]
const SUM_BANDS = ['', 'u1', 'u3', 'u5', 'o5'] as const
type SumBand = (typeof SUM_BANDS)[number]
const NEXT_FILTERS = ['', 'missed', 'today', 'later', 'none'] as const
type NextFilter = (typeof NEXT_FILTERS)[number]

const inBand = (sum: number, band: SumBand) =>
  band === ''
    ? true
    : band === 'u1'
      ? sum < 1_000_000
      : band === 'u3'
        ? sum >= 1_000_000 && sum < 3_000_000
        : band === 'u5'
          ? sum >= 3_000_000 && sum < 5_000_000
          : sum >= 5_000_000

/**
 * The collectors' board for one workspace: figures, the age bar, quick chips, filters, and the
 * debts as a kanban (main view) or a table. Each workspace gives its rows and keeps its dialogs.
 */
export function DebtsView({
  title,
  rows,
  today,
  groups,
  groupLabel,
  groupAll,
  operators,
  meId,
  searchPlaceholder,
  onMove,
  onCall,
}: {
  title: string
  rows: BoardRow[]
  today: Date
  /** Merchants (Birzum) or loan products (brands), for the group filter. */
  groups: { value: string; label: string }[]
  groupLabel: string
  groupAll: string
  operators: { id: string; name: string }[]
  /** The signed-in admin, for «Mening qarzlarim». */
  meId?: string
  searchPlaceholder: string
  onMove: MoveHandler
  onCall: (row: BoardRow) => void
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const me = meId ? { id: meId } : undefined

  const [view, setView] = useState<'board' | 'table'>('board')
  const [chip, setChip] = useState<Chip>('all')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'' | DebtStatus>('')
  const [age, setAge] = useState<'' | AgeBucket>(() => {
    const value = params.get('age')
    return AGE_BUCKETS.find((bucket) => bucket === value) ?? ''
  })
  const [merchant, setMerchant] = useState('')
  const [operator, setOperator] = useState('')
  const [sumBand, setSumBand] = useState<SumBand>('')
  const [next, setNext] = useState<NextFilter>('')
  const [opened, setOpened] = useState<DateRange>(ALL_TIME)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = rows.filter((row) => {
    const open = row.file.status !== 'closed'
    const chipOk =
      chip === 'all'
        ? true
        : chip === 'critical'
          ? open && row.days >= CRITICAL_DAYS
          : chip === 'callToday'
            ? row.nextCallState === 'today' || row.nextCallState === 'missed'
            : chip === 'noAnswer'
              ? row.file.status === 'noAnswer'
              : chip === 'promised'
                ? row.file.status === 'promised'
                : chip === 'mine'
                  ? open && !!me && row.file.operatorId === me.id
                  : chip === 'unassigned'
                    ? open && !row.file.operatorId
                    : !open
    return (
      chipOk &&
      (needle === '' ||
        row.name.toLowerCase().includes(needle) ||
        (digits.length >= 3 && (row.phone.includes(digits) || row.ref.includes(digits)))) &&
      (!status || row.file.status === status) &&
      (!age || (open && row.days > 0 && ageBucketOf(row.days) === age)) &&
      (!merchant || row.groupId === merchant) &&
      (!operator ||
        (operator === 'none' ? !row.file.operatorId : row.file.operatorId === operator)) &&
      inBand(open ? row.overdue : row.remaining, sumBand) &&
      (!next || row.nextCallState === next) &&
      inRange(row.openedAt, opened)
    )
  })

  const openRows = filtered.filter((row) => row.file.status !== 'closed')
  const overdueSum = openRows.reduce((sum, row) => sum + row.overdue, 0)
  const callsToday = filtered.filter(
    (row) => row.nextCallState === 'today' || row.nextCallState === 'missed',
  )
  const promised = openRows.filter((row) => row.file.status === 'promised')
  const closedThisMonth = filtered.filter((row) => {
    const last = row.file.history[row.file.history.length - 1]
    return row.file.status === 'closed' && last && last.at >= monthStart
  })
  const aging = AGE_BUCKETS.map((bucket) => {
    const inBucket = openRows.filter((row) => row.days > 0 && ageBucketOf(row.days) === bucket)
    return {
      bucket,
      count: inBucket.length,
      sum: inBucket.reduce((s, row) => s + row.overdue, 0),
    }
  })

  const chipCount = (value: Chip) =>
    rows.filter((row) => {
      const open = row.file.status !== 'closed'
      switch (value) {
        case 'all':
          return true
        case 'critical':
          return open && row.days >= CRITICAL_DAYS
        case 'callToday':
          return row.nextCallState === 'today' || row.nextCallState === 'missed'
        case 'noAnswer':
        case 'promised':
          return row.file.status === value
        case 'mine':
          return open && !!me && row.file.operatorId === me.id
        case 'unassigned':
          return open && !row.file.operatorId
        case 'closed':
          return !open
      }
    }).length

  const filtersSet =
    !!query ||
    !!status ||
    !!age ||
    !!merchant ||
    !!operator ||
    !!sumBand ||
    !!next ||
    !!opened.from ||
    !!opened.to
  const reset = () => {
    setQuery('')
    setStatus('')
    setAge('')
    setMerchant('')
    setOperator('')
    setSumBand('')
    setNext('')
    setOpened(ALL_TIME)
  }

  const pager = usePagination(
    filtered,
    JSON.stringify([chip, query, status, age, merchant, operator, sumBand, next, opened]),
  )

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={title} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('debts.stat.open')}
          value={groupDigits(openRows.length)}
          hint={t('debts.stat.openHint', { sum: formatSum(overdueSum) })}
        />
        <StatCard
          label={t('debts.stat.callsToday')}
          value={groupDigits(callsToday.length)}
          hint={t('debts.stat.missed', {
            count: String(callsToday.filter((row) => row.nextCallState === 'missed').length),
          })}
        />
        <StatCard
          label={t('debts.stat.promised')}
          value={groupDigits(promised.length)}
          hint={formatSum(promised.reduce((sum, row) => sum + row.overdue, 0))}
        />
        <StatCard
          label={t('debts.stat.closed')}
          value={groupDigits(closedThisMonth.length)}
          hint={t('debts.stat.closedHint')}
        />
      </div>

      <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-bold">{t('debts.aging.title')}</h2>
          <span className="text-2xl font-bold tabular-nums">{formatSum(overdueSum)}</span>
          <span className="text-sm text-ink-muted">{t('debts.aging.note')}</span>
        </div>
        {overdueSum > 0 && (
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {aging
              .filter((item) => item.sum > 0)
              .map((item) => (
                <span
                  key={item.bucket}
                  className={AGE_SHADES[item.bucket]}
                  style={{ flexGrow: item.sum }}
                />
              ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-1 gap-y-1">
          {aging.map((item) => (
            <button
              key={item.bucket}
              type="button"
              disabled={item.count === 0}
              onClick={() => setAge(age === item.bucket ? '' : item.bucket)}
              className={cn(
                'flex items-center gap-2 rounded-control px-2 py-1 text-sm hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent',
                age === item.bucket && 'bg-surface ring-1 ring-brand',
              )}
            >
              <span className={cn('size-2.5 rounded-sm', AGE_SHADES[item.bucket])} />
              <span>{t(`collections.aging.${item.bucket}`)}</span>
              <span className="font-semibold tabular-nums">{item.count}</span>
              <span className="text-ink-muted tabular-nums">
                · {item.sum ? formatSum(item.sum) : '—'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div
          className="flex flex-wrap items-center gap-2 px-4 pt-4"
          role="group"
          aria-label={t('debts.chips')}
        >
          {CHIPS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={chip === value}
              onClick={() => setChip(value)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
                chip === value
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line text-ink hover:bg-surface',
              )}
            >
              {t(`debts.chip.${value}`)}
              <span
                className={cn('tabular-nums', chip === value ? 'opacity-80' : 'text-ink-muted')}
              >
                {chipCount(value)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          {view === 'table' && (
            <FilterSelect
              label={t('debts.status')}
              options={[
                { value: '' as const, label: t('debts.status.all') },
                ...DEBT_STATUSES.map((value) => ({ value, label: t(`debts.status.${value}`) })),
              ]}
              value={status}
              onChange={setStatus}
            />
          )}
          <FilterSelect
            label={t('collections.col.late')}
            options={[
              { value: '' as const, label: t('collections.aging.all') },
              ...AGE_BUCKETS.map((value) => ({ value, label: t(`collections.aging.${value}`) })),
            ]}
            value={age}
            onChange={setAge}
          />
          <FilterSelect
            label={t('debts.sum')}
            options={SUM_BANDS.map((value) => ({
              value,
              label: t(value ? `debts.sum.${value}` : 'debts.sum.all'),
            }))}
            value={sumBand}
            onChange={setSumBand}
          />
          <FilterSelect
            label={t('debts.nextCall')}
            options={NEXT_FILTERS.map((value) => ({
              value,
              label: t(value ? `debts.next.f.${value}` : 'debts.next.f.all'),
            }))}
            value={next}
            onChange={setNext}
          />
          <FilterSelect
            label={groupLabel}
            options={[{ value: '', label: groupAll }, ...groups]}
            value={merchant}
            onChange={setMerchant}
          />
          <FilterSelect
            label={t('debts.operator')}
            options={[
              { value: '', label: t('debts.operator.all') },
              { value: 'none', label: t('debts.operator.none') },
              ...operators.map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={operator}
            onChange={setOperator}
          />
          <DateRangePicker label={t('debts.openedAt')} value={opened} onChange={setOpened} />
          {filtersSet && (
            <button
              type="button"
              onClick={reset}
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand hover:bg-surface"
            >
              <RotateCcw size={16} />
              {t('debts.reset')}
            </button>
          )}
          <div className="ml-auto">
            <ViewToggle
              label={t('debts.view')}
              options={[
                { value: 'board', label: t('debts.view.board'), icon: Columns3 },
                { value: 'table', label: t('debts.view.table'), icon: Rows3 },
              ]}
              value={view}
              onChange={setView}
            />
          </div>
        </div>

        {filtered.length === 0 && view === 'table' ? (
          <EmptyState title={t('debts.empty')} />
        ) : view === 'board' ? (
          <DebtBoard rows={filtered} onMove={onMove} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('applications.col.client')}</th>
                    <th className={th}>{t('debts.col.nasiya')}</th>
                    <th className={`${th} text-right`}>{t('client.overdue')}</th>
                    <th className={th}>{t('collections.col.late')}</th>
                    <th className={th}>{t('debts.status')}</th>
                    <th className={th}>{t('debts.nextCall')}</th>
                    <th className={th}>{t('debts.col.note')}</th>
                    <th className={th}>{t('debts.operator')}</th>
                    <th className="w-28" />
                  </tr>
                </thead>
                <tbody>
                  {pager.rows.map((row) => {
                    const closed = row.file.status === 'closed'
                    return (
                      <tr
                        key={row.file.id}
                        onClick={() => navigate(row.href)}
                        className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar initials={row.initials} photoUrl={row.photoUrl} />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-semibold">{row.name}</span>
                              <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                                {formatPhone(row.phone)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-56 px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium tabular-nums">{row.ref}</span>
                            <span className="truncate text-xs text-ink-muted">{row.sub}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {closed ? (
                            <span className="text-sm text-ink-subtle">—</span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-semibold whitespace-nowrap text-danger tabular-nums">
                                {formatSum(row.overdue)}
                              </span>
                              <span className="text-xs text-ink-muted">
                                {t('collections.paymentsCount', {
                                  count: String(row.overdueCount),
                                })}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!closed && row.days > 0 ? (
                            <StatusBadge tone={row.days >= CRITICAL_DAYS ? 'danger' : 'warning'}>
                              {t('collections.days', { days: String(row.days) })}
                            </StatusBadge>
                          ) : (
                            <span className="text-sm text-ink-subtle">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={DEBT_TONES[row.file.status]}>
                            {t(`debts.status.${row.file.status}`)}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                          {row.file.nextCall && row.nextCallState !== 'none' ? (
                            <span
                              className={cn(
                                row.nextCallState === 'missed' && 'font-medium text-danger',
                                row.nextCallState === 'today' && 'font-medium text-brand',
                              )}
                            >
                              {formatDateTime(row.file.nextCall.at)}
                            </span>
                          ) : (
                            <span className="text-ink-subtle">—</span>
                          )}
                        </td>
                        <td className="max-w-64 px-4 py-3">
                          {row.lastNote ? (
                            <div className="flex flex-col">
                              <span className="line-clamp-2 text-sm">{row.lastNote.text}</span>
                              <span className="text-xs text-ink-muted tabular-nums">
                                {formatDate(row.lastNote.at)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-ink-subtle">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {row.operatorName ?? (
                            <span className="text-warning">{t('debts.operator.none')}</span>
                          )}
                        </td>
                        <td className="pr-3">
                          {!closed && (
                            <RowActions
                              actions={[
                                {
                                  icon: PhoneCall,
                                  label: t('contact.call'),
                                  onClick: () => onCall(row),
                                },
                              ]}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pager={pager} />
          </>
        )}
      </div>
    </div>
  )
}
