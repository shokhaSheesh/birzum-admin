import { Search } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { MONTHS } from '@/shared/lib/dates'
import { formatDate, groupDigits } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'

export type PlanFactCell = { plan: number; fact: number }

/** One nasiya or loan in the plan / fakt table. */
export type PlanFactRow = {
  id: string
  name: string
  nameHref: string
  /** The nasiya or contract number. */
  ref: string
  refHref: string
  /** Under the number: the shop, or the loan product. */
  sub: string
  /** What the group filter matches: the merchant or the product. */
  groupId: string
  /** Hand-over or pay-out day. */
  date: Date
  /** The figures between the date and the months, as many as `labels.values`. */
  values: number[]
  /** Plan and fakt for each month of the table. */
  months: PlanFactCell[]
  /** What is late today. */
  debtToday: number
  /** Name, phone and number, for the search. */
  search: string
}

export type PlanFactLabels = {
  name: string
  date: string
  values: string[]
  group: string
  allGroups: string
  search: string
}

const num = (value: number) => (value ? groupDigits(Math.round(value)) : '0')

/**
 * The plan / fakt table: a row per nasiya or loan, Plan, Fakt and Farq for each month, the period's
 * total and the debt late today, with a «Jami» row on top. Every row is on the page (no pagination,
 * user 2026-11-19); the header and the first column stay put while the table scrolls.
 */
export function PlanFactView({
  rows,
  months,
  today,
  labels,
  groups,
}: {
  rows: PlanFactRow[]
  months: Date[]
  today: Date
  labels: PlanFactLabels
  groups: { value: string; label: string }[]
}) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')

  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = rows.filter(
    (row) =>
      (!group || row.groupId === group) &&
      (needle === '' ||
        row.search.toLowerCase().includes(needle) ||
        (digits.length >= 3 && row.search.replace(/\D/g, '').includes(digits))),
  )
  const totalOf = (cells: PlanFactCell[]) =>
    cells.reduce((s, c) => ({ plan: s.plan + c.plan, fact: s.fact + c.fact }), { plan: 0, fact: 0 })
  const totals = {
    values: labels.values.map((_, i) => filtered.reduce((s, r) => s + r.values[i], 0)),
    months: months.map((_, i) => totalOf(filtered.map((r) => r.months[i]))),
    debt: filtered.reduce((s, r) => s + r.debtToday, 0),
  }

  const th =
    'px-3 py-2 text-xs font-semibold tracking-wide text-ink-muted uppercase whitespace-nowrap'
  const td = 'px-3 py-2.5 text-right text-sm whitespace-nowrap tabular-nums'
  // The first column stays put while the months scroll
  const sticky = 'sticky left-0 z-10 bg-canvas'
  const diffClass = (value: number) =>
    value > 0 ? 'text-danger' : value < 0 ? 'text-success' : 'text-ink-subtle'
  const cells = (cell: PlanFactCell, strong = false) => {
    const diff = cell.plan - cell.fact
    return (
      <>
        <td className={cn(td, 'border-l border-line', strong && 'font-semibold')}>
          {num(cell.plan)}
        </td>
        <td className={cn(td, strong && 'font-semibold')}>{num(cell.fact)}</td>
        <td className={cn(td, diffClass(diff), strong && 'font-semibold')}>{num(diff)}</td>
      </>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
          <Search size={18} className="shrink-0" />
          <span className="sr-only">{labels.search}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
        </label>
        <FilterSelect
          label={labels.group}
          options={[{ value: '', label: labels.allGroups }, ...groups]}
          value={group}
          onChange={setGroup}
        />
        <p className="ml-auto text-sm text-ink-muted">
          {t('planFact.months', { count: String(months.length) })} · {t('planFact.note')}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('planFact.empty')} />
      ) : (
        <div className="max-h-[calc(100vh-260px)] min-h-80 overflow-auto border-t border-line">
          <table className="w-max min-w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-canvas">
              <tr className="border-b border-line">
                <th rowSpan={2} className={cn(th, sticky, 'min-w-60 text-left')}>
                  {labels.name}
                </th>
                <th rowSpan={2} className={cn(th, 'text-left')}>
                  {labels.date}
                </th>
                {labels.values.map((label) => (
                  <th key={label} rowSpan={2} className={cn(th, 'text-right')}>
                    {label}
                  </th>
                ))}
                {months.map((month) => (
                  <th
                    key={month.toISOString()}
                    colSpan={3}
                    className={cn(th, 'border-l border-line bg-warning-soft text-center')}
                  >
                    {MONTHS[lang][month.getMonth()]} {month.getFullYear()}
                  </th>
                ))}
                <th
                  colSpan={3}
                  className={cn(th, 'border-l border-line bg-success-soft text-center')}
                >
                  {t('planFact.total')}
                </th>
                <th rowSpan={2} className={cn(th, 'border-l border-line text-right')}>
                  {t('planFact.debtToday')}
                  <span className="block font-normal normal-case">{formatDate(today)}</span>
                </th>
              </tr>
              <tr className="border-b border-line">
                {[...months.map((m) => m.toISOString()), 'total'].map((key) => (
                  <Fragment key={key}>
                    <th className={cn(th, 'border-l border-line text-right')}>
                      {t('planFact.plan')}
                    </th>
                    <th className={cn(th, 'text-right')}>{t('planFact.fact')}</th>
                    <th className={cn(th, 'text-right')}>{t('planFact.diff')}</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line bg-surface font-semibold">
                <td className={cn('px-3 py-2.5 text-sm', sticky, 'bg-surface')}>
                  {t('planFact.totalRow')}
                </td>
                <td />
                {totals.values.map((value, i) => (
                  <td key={i} className={td}>
                    {num(value)}
                  </td>
                ))}
                {totals.months.map((cell, i) => (
                  <Fragment key={i}>{cells(cell, true)}</Fragment>
                ))}
                {cells(totalOf(totals.months), true)}
                <td className={cn(td, 'border-l border-line text-danger')}>{num(totals.debt)}</td>
              </tr>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line last:border-b-0 hover:bg-surface/60"
                >
                  <td className={cn('px-3 py-2.5', sticky)}>
                    <div className="flex min-w-0 flex-col">
                      <Link
                        to={row.nameHref}
                        className="truncate text-sm font-semibold hover:underline"
                      >
                        {row.name}
                      </Link>
                      <span className="truncate text-xs text-ink-muted">
                        <Link to={row.refHref} className="hover:underline">
                          {row.ref}
                        </Link>{' '}
                        · {row.sub}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm whitespace-nowrap tabular-nums">
                    {formatDate(row.date)}
                  </td>
                  {row.values.map((value, i) => (
                    <td key={i} className={td}>
                      {num(value)}
                    </td>
                  ))}
                  {row.months.map((cell, i) => (
                    <Fragment key={i}>{cells(cell)}</Fragment>
                  ))}
                  {cells(totalOf(row.months), true)}
                  <td
                    className={cn(
                      td,
                      'border-l border-line',
                      row.debtToday > 0 && 'font-semibold text-danger',
                    )}
                  >
                    {num(row.debtToday)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
