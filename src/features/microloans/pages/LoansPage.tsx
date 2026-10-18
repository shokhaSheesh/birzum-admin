import { Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  daysLate,
  LOAN_STATES,
  loansStore,
  loanStateTone,
  progressOf,
  stateOf,
  type LoanState,
} from '@/entities/microloans/loans'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandLoanPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { ALL_TIME, inRange } from '@/shared/lib/dates'
import { boundsOf, type Period } from '@/shared/lib/period'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { usePagination } from '@/shared/lib/usePagination'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Qarzlar of one microloan brand, read-only: the portfolio on top, then every loan paid out —
 * running, late or closed — with what is left and the next payment. Opening one shows its
 * schedule and payments. Money is taken and chased on Toʻlovlar and Kechikkanlar.
 */
export function LoansPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const all = loansStore.useAll().filter((loan) => loan.brand === brand)
  const products = loanProductsStore.useAll().filter((p) => p.brand === brand)
  const [state, setState] = useState<'all' | LoanState>('all')
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState('')
  // A list of loans: all of them unless a period is picked
  const [period, setPeriod] = useState<Period>(() => ({
    unit: 'all',
    anchor: new Date(),
    range: ALL_TIME,
  }))
  const bounds = boundsOf(period)
  const [today] = useState(() => new Date())

  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = all.filter(
    (loan) =>
      (needle === '' ||
        loan.borrower.name.toLowerCase().includes(needle) ||
        loan.number.toLowerCase().includes(needle) ||
        loan.borrower.passport.toLowerCase().includes(needle) ||
        (digits.length >= 3 && loan.borrower.phone.includes(digits))) &&
      (!product || loan.productId === product) &&
      inRange(loan.issuedAt, bounds),
  )
  const rows = filtered.filter((loan) => state === 'all' || stateOf(loan) === state)
  const pager = usePagination(rows, JSON.stringify([query, product, period, state]))

  const open = all.filter((loan) => !loan.closedAt)
  const late = open.filter((loan) => loan.overdueSince)
  const portfolio = open.reduce((sum, loan) => sum + progressOf(loan).principalLeft, 0)
  const lateSum = late.reduce((sum, loan) => sum + (progressOf(loan).next?.amount ?? 0), 0)
  // Issued and closed in the period; portfolio and late are how things stand today
  const issued = all.filter((loan) => inRange(loan.issuedAt, bounds))
  const closed = all.filter((loan) => loan.closedAt && inRange(loan.closedAt, bounds))
  const closedEarly = closed.filter((loan) => loan.prepayments.some((p) => p.kind === 'full'))
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? '—'

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.loans')} description={t('loans.description')} />

      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('loans.stat.issued')}
          value={formatSum(issued.reduce((sum, loan) => sum + loan.amount, 0))}
          hint={t('loans.stat.issuedHint', { count: groupDigits(issued.length) })}
        />
        <StatCard
          label={t('loans.stat.closed')}
          value={groupDigits(closed.length)}
          hint={t('loans.stat.closedHint', { count: String(closedEarly.length) })}
        />
        <StatCard
          label={t('loans.stat.portfolio')}
          value={formatSum(portfolio)}
          hint={t('loans.stat.portfolioHint', { count: groupDigits(open.length) })}
        />
        <StatCard
          label={t('loans.stat.late')}
          value={String(late.length)}
          hint={t('loans.stat.lateHint', {
            sum: formatSum(lateSum),
            share: String(open.length ? Math.round((late.length / open.length) * 100) : 0),
          })}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...LOAN_STATES.map((value) => ({
                value,
                label: t(`loan.state.${value}`),
                count: filtered.filter((loan) => stateOf(loan) === value).length,
              })),
            ]}
            value={state}
            onChange={setState}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('loans.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('loans.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('mlProducts.col.product')}
            options={[
              { value: '', label: t('loanApps.allProducts') },
              ...products.map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={product}
            onChange={setProduct}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('loans.empty')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('loans.col.contract')}</th>
                    <th className={th}>{t('loanApps.col.borrower')}</th>
                    <th className={th}>{t('mlProducts.col.product')}</th>
                    <th className={`${th} text-right`}>{t('loans.col.issued')}</th>
                    <th className={th}>{t('loans.col.left')}</th>
                    <th className={th}>{t('loans.col.next')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody>
                  {pager.rows.map((loan) => {
                    const { next, principalLeft, paid, total } = progressOf(loan)
                    const loanState = stateOf(loan)
                    return (
                      <tr
                        key={loan.id}
                        onClick={() => navigate(brandLoanPath(brand, loan.id))}
                        className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold whitespace-nowrap tabular-nums">
                              {loan.number}
                            </span>
                            <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                              {formatDate(loan.issuedAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{loan.borrower.name}</span>
                            <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                              {formatPhone(loan.borrower.phone)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {productName(loan.productId)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col">
                            <span className="font-semibold whitespace-nowrap tabular-nums">
                              {formatSum(loan.amount)}
                            </span>
                            <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                              {t('mlProducts.months', { n: String(loan.term) })} · {loan.rate}%
                            </span>
                          </div>
                        </td>
                        <td className="w-48 px-4 py-3">
                          {loanState === 'closed' ? (
                            <span className="text-sm text-ink-muted">—</span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                                {formatSum(principalLeft)}
                              </span>
                              <div className="h-1.5 overflow-hidden rounded-full bg-navy-100">
                                <div
                                  className="h-full rounded-full bg-brand"
                                  style={{ width: `${(paid / total) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-ink-muted tabular-nums">
                                {t('loans.paidOf', { paid: String(paid), total: String(total) })}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                          {loanState === 'closed' ? (
                            <span className="text-ink-muted">
                              {t('loans.closedOn', { date: formatDate(loan.closedAt!) })}
                            </span>
                          ) : next ? (
                            <div
                              className={cn(
                                'flex flex-col',
                                loanState === 'overdue' && 'text-danger',
                              )}
                            >
                              <span className="font-semibold">{formatSum(next.amount)}</span>
                              <span>
                                {loanState === 'overdue'
                                  ? t('loans.lateDays', { days: String(daysLate(loan, today)) })
                                  : formatDate(next.due)}
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={loanStateTone[loanState]}>
                            {t(`loan.state.${loanState}`)}
                          </StatusBadge>
                        </td>
                        <td className="pr-3">
                          <RowActions
                            actions={[
                              {
                                icon: Eye,
                                label: t('common.view'),
                                onClick: () => navigate(brandLoanPath(brand, loan.id)),
                              },
                            ]}
                          />
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
