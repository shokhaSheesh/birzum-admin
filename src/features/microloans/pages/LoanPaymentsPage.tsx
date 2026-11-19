import { CircleCheck, CircleX, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paymentsOf, type LoanPayment } from '@/entities/microloans/loanPayments'
import { cardText, lateOf, loansStore } from '@/entities/microloans/loans'
import { brandLoanPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { inRange } from '@/shared/lib/dates'
import { boundsOf, thisMonth, type Period } from '@/shared/lib/period'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { usePagination } from '@/shared/lib/usePagination'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { Pagination } from '@/shared/ui/Pagination'
import { StatCard } from '@/shared/ui/StatCard'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { LoanReports } from '../debts/LoanReports'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
type Tab = 'all' | 'paid' | 'failed' | 'reports'
type Kind = '' | 'monthly' | 'early'
type Method = '' | 'auto' | 'app' | 'cash' | 'transfer'

/**
 * Toʻlovlar of one microloan brand: every payment on its loans — taken from the card on the
 * day, or paid in the app, monthly or early — with its fiscal cheque, and every automatic charge
 * the card refused. A row opens its loan. Refused charges are not tried again from here (user,
 * 2026-11-19): the collectors work late loans on Qarzdorlar. Was: a loan still late could be charged
 * again from here, and a payment made outside the app (cash, transfer) is entered here.
 */
export function LoanPaymentsPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [today] = useState(() => new Date())
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const all = paymentsOf(loans)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind>('')
  const [method, setMethod] = useState<Method>('')
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const bounds = boundsOf(period)

  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = all.filter(
    (payment) =>
      (needle === '' ||
        payment.loan.borrower.name.toLowerCase().includes(needle) ||
        payment.loan.number.toLowerCase().includes(needle) ||
        (digits.length >= 3 && payment.loan.borrower.phone.includes(digits))) &&
      (!kind || (kind === 'monthly' ? payment.kind === 'monthly' : payment.kind !== 'monthly')) &&
      (!method || payment.method === method) &&
      inRange(payment.at, bounds),
  )
  const rows = filtered.filter(
    (payment) => tab === 'all' || (tab === 'paid' ? payment.ok : !payment.ok),
  )
  const pager = usePagination(rows, JSON.stringify([query, kind, method, period, tab]))

  // Figures for the period; "late now" is how things stand today, whatever the period
  const inPeriod = all.filter((payment) => inRange(payment.at, bounds))
  const paid = inPeriod.filter((payment) => payment.ok)
  const refused = inPeriod.filter((payment) => !payment.ok)
  const early = paid.filter((payment) => payment.kind !== 'monthly')
  const failing = loans.filter((loan) => loan.overdueSince && !loan.closedAt)
  const sum = (list: LoanPayment[]) => list.reduce((total, payment) => total + payment.amount, 0)

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.loanPayments')} />

      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('loanPay.stat.paid')}
          value={formatSum(sum(paid))}
          hint={t('loanPay.stat.count', { count: String(paid.length) })}
        />
        <StatCard
          label={t('loanPay.stat.early')}
          value={formatSum(sum(early))}
          hint={t('loanPay.stat.count', { count: String(early.length) })}
        />
        <StatCard
          label={t('loanPay.stat.refused')}
          value={String(refused.length)}
          hint={t('loanPay.stat.refusedHint', { sum: formatSum(sum(refused)) })}
        />
        <StatCard
          label={t('loanPay.stat.failed')}
          value={String(failing.length)}
          hint={t('loanPay.stat.failedHint', {
            sum: formatSum(failing.reduce((total, loan) => total + lateOf(loan, today).amount, 0)),
          })}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              ...(['all', 'paid', 'failed'] as const).map((value) => ({
                value,
                label: t(`loanPay.tab.${value}`),
                count:
                  value === 'all'
                    ? filtered.length
                    : filtered.filter((p) => (value === 'paid' ? p.ok : !p.ok)).length,
              })),
              { value: 'reports' as const, label: t('collections.tab.reports') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        {tab === 'reports' ? (
          <LoanReports brand={brand} bounds={bounds} today={today} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 p-4">
              <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
                <Search size={18} className="shrink-0" />
                <span className="sr-only">{t('loanPay.search')}</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('loanPay.search')}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                />
              </label>
              <FilterSelect
                label={t('loanPay.col.kind')}
                options={[
                  { value: '', label: t('loanPay.kind.all') },
                  { value: 'monthly', label: t('loanPay.kind.monthly') },
                  { value: 'early', label: t('loanPay.kind.early') },
                ]}
                value={kind}
                onChange={setKind}
              />
              <FilterSelect
                label={t('loanPay.col.method')}
                options={[
                  { value: '', label: t('loanPay.method.all') },
                  { value: 'auto', label: t('loanPay.method.auto') },
                  { value: 'app', label: t('loanPay.method.app') },
                  { value: 'cash', label: t('loanPay.method.cash') },
                  { value: 'transfer', label: t('loanPay.method.transfer') },
                ]}
                value={method}
                onChange={setMethod}
              />
            </div>

            {rows.length === 0 ? (
              <EmptyState title={t('loanPay.empty')} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] border-t border-line">
                    <thead>
                      <tr className="border-b border-line">
                        <th className={th}>{t('loanPay.col.at')}</th>
                        <th className={th}>{t('loanApps.col.borrower')}</th>
                        <th className={th}>{t('loans.col.contract')}</th>
                        <th className={th}>{t('loanPay.col.kind')}</th>
                        <th className={th}>{t('loanPay.col.method')}</th>
                        <th className={`${th} text-right`}>{t('loanPay.col.amount')}</th>
                        <th className={th}>{t('merchants.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pager.rows.map((payment) => (
                        <tr
                          key={payment.id}
                          onClick={() => navigate(brandLoanPath(brand, payment.loan.id))}
                          className={cn(
                            'cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60',
                            !payment.ok && 'bg-danger-soft/40',
                          )}
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                            {formatDateTime(payment.at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="block max-w-64 truncate">
                              {payment.loan.borrower.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={brandLoanPath(brand, payment.loan.id)}
                              className="font-semibold whitespace-nowrap text-brand hover:underline"
                            >
                              {payment.loan.number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {payment.kind === 'monthly'
                              ? t('loan.payment.monthly', { n: String(payment.n) })
                              : t(
                                  payment.kind === 'full'
                                    ? 'loan.payment.full'
                                    : 'loan.payment.partial',
                                )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="block">{t(`loanPay.method.${payment.method}`)}</span>
                            <span className="text-xs whitespace-nowrap text-ink-muted">
                              {payment.reference ?? cardText(payment.loan.card)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                            {formatSum(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {payment.ok ? (
                              <span className="flex items-center gap-1.5 font-medium text-success">
                                <CircleCheck size={16} />
                                {t('loanPay.ok')}
                              </span>
                            ) : (
                              <span className="flex flex-col text-danger">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <CircleX size={16} />
                                  {t('loanPay.failed')}
                                </span>
                                <span className="text-xs">
                                  {t(`loanPay.reason.${payment.reason ?? 'funds'}`)}
                                </span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination pager={pager} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
