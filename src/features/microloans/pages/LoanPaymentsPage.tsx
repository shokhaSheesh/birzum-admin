import { CircleCheck, CircleX, ReceiptText, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logAction } from '@/entities/audit/audit'
import { paymentsOf, type LoanPayment } from '@/entities/microloans/loanPayments'
import { cardText, lateOf, loansStore, overdueAfter, scheduleOf } from '@/entities/microloans/loans'
import { brandLoanPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { inRange } from '@/shared/lib/dates'
import { boundsOf, thisMonth, type Period } from '@/shared/lib/period'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { usePagination } from '@/shared/lib/usePagination'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { LoanReceiptModal } from '../components/LoanReceiptModal'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
type Tab = 'all' | 'paid' | 'failed'
type Kind = '' | 'monthly' | 'early'
type Method = '' | 'auto' | 'app' | 'cash' | 'transfer'

/**
 * Toʻlovlar of one microloan brand: every payment on its loans — taken from the card on the
 * day, or paid in the app, monthly or early — with its fiscal cheque, and every automatic charge
 * the card refused. A row opens its loan. A loan still late on a refused charge can be charged
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
  const [receipt, setReceipt] = useState<LoanPayment | null>(null)
  const [charging, setCharging] = useState<LoanPayment | null>(null)

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

  // Only the newest refused charge of a loan that is still late can be tried again
  const canRetry = (payment: LoanPayment) => {
    const loan = loans.find((item) => item.id === payment.loan.id)
    return (
      !payment.ok &&
      !!loan?.overdueSince &&
      !loan.closedAt &&
      payment.n === loan.paidCount + 1 &&
      all.find((item) => item.loan.id === payment.loan.id && !item.ok)?.id === payment.id
    )
  }

  const charge = (payment: LoanPayment) => {
    const loan = loansStore.get(payment.loan.id)
    if (!loan) return
    const paidCount = loan.paidCount + 1
    const done = paidCount >= scheduleOf(loan).length
    const now = new Date()
    loansStore.update(loan.id, {
      paidCount,
      paidOn: { ...loan.paidOn, [paidCount]: now },
      overdueSince: overdueAfter(loan, paidCount, now),
      ...(done ? { closedAt: now } : {}),
    })
    logAction({
      section: 'mlPayments',
      kind: 'money',
      action: 'audit.a.loanCharged',
      params: { brand: WORKSPACE_INFO[brand].name, sum: formatSum(payment.amount) },
      target: loan.number,
      href: brandLoanPath(brand, loan.id),
    })
    toast(t('loanPay.charged', { sum: formatSum(payment.amount) }))
  }

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
            options={(['all', 'paid', 'failed'] as const).map((value) => ({
              value,
              label: t(`loanPay.tab.${value}`),
              count:
                value === 'all'
                  ? filtered.length
                  : filtered.filter((p) => (value === 'paid' ? p.ok : !p.ok)).length,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>
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
                    <th className="w-14" />
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
                      <td className="pr-3">
                        <RowActions
                          actions={
                            payment.ok
                              ? [
                                  {
                                    icon: ReceiptText,
                                    label: t('receipt.show'),
                                    onClick: () => setReceipt(payment),
                                  },
                                ]
                              : canRetry(payment)
                                ? [
                                    {
                                      icon: RotateCcw,
                                      label: t('loanPay.retry'),
                                      onClick: () => setCharging(payment),
                                    },
                                  ]
                                : []
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={pager} />
          </>
        )}
      </div>

      {receipt && <LoanReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
      <ConfirmDialog
        open={!!charging}
        onClose={() => setCharging(null)}
        title={t('loanPay.retry.title', { sum: charging ? formatSum(charging.amount) : '' })}
        confirmLabel={t('loanPay.retry')}
        tone="primary"
        onConfirm={() => {
          if (charging) charge(charging)
          setCharging(null)
        }}
      >
        <p>
          {charging &&
            t('loanPay.retry.message', {
              card: cardText(charging.loan.card),
              name: charging.loan.borrower.name,
            })}
        </p>
      </ConfirmDialog>
    </div>
  )
}
