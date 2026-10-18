import { CircleCheck, CircleX, Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { logAction } from '@/entities/audit/audit'
import { paymentsOf, type LoanPayment } from '@/entities/microloans/loanPayments'
import { cardText, loansStore, progressOf, scheduleOf } from '@/entities/microloans/loans'
import { brandLoanPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { ALL_TIME, inRange, startOfDay, type DateRange } from '@/shared/lib/dates'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { usePagination } from '@/shared/lib/usePagination'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DateRangePicker } from '@/shared/ui/DateRangePicker'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { LoanPaymentModal } from '../components/LoanPaymentModal'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
type Tab = 'all' | 'paid' | 'failed'
type Kind = '' | 'monthly' | 'early'
type Method = '' | 'auto' | 'app'

/**
 * Toʻlovlar of one microloan brand: every payment on its loans — taken from the card on the
 * day, or paid in the app, monthly or early — with its fiscal cheque, and every automatic charge
 * the card refused. A loan still late on a refused charge can be charged again from here.
 */
export function LoanPaymentsPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const [today] = useState(() => new Date())
  const all = paymentsOf(loans)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind>('')
  const [method, setMethod] = useState<Method>('')
  const [period, setPeriod] = useState<DateRange>(ALL_TIME)
  const [open, setOpen] = useState<LoanPayment | null>(null)
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
      inRange(payment.at, period),
  )
  const rows = filtered.filter(
    (payment) => tab === 'all' || (tab === 'paid' ? payment.ok : !payment.ok),
  )
  const pager = usePagination(rows, JSON.stringify([query, kind, method, period, tab]))

  const paid = all.filter((payment) => payment.ok)
  const thisMonth = paid.filter(
    (payment) =>
      payment.at.getMonth() === today.getMonth() &&
      payment.at.getFullYear() === today.getFullYear(),
  )
  const todays = paid.filter((payment) => payment.at >= startOfDay(today))
  const early = thisMonth.filter((payment) => payment.kind !== 'monthly')
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
      overdueSince: undefined,
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
      <PageHeader title={t('nav.loanPayments')} description={t('loanPay.description')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('loanPay.stat.month')}
          value={formatSum(sum(thisMonth))}
          hint={t('loanPay.stat.count', { count: String(thisMonth.length) })}
        />
        <StatCard
          label={t('loanPay.stat.today')}
          value={formatSum(sum(todays))}
          hint={t('loanPay.stat.count', { count: String(todays.length) })}
        />
        <StatCard
          label={t('loanPay.stat.early')}
          value={formatSum(sum(early))}
          hint={t('loanPay.stat.earlyHint')}
        />
        <StatCard
          label={t('loanPay.stat.failed')}
          value={String(failing.length)}
          hint={formatSum(
            failing.reduce((total, loan) => total + (progressOf(loan).next?.amount ?? 0), 0),
          )}
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
            ]}
            value={method}
            onChange={setMethod}
          />
          <DateRangePicker label={t('applications.period')} value={period} onChange={setPeriod} />
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
                      onClick={() => setOpen(payment)}
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
                          {cardText(payment.loan.card)}
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
                          actions={[
                            { icon: Eye, label: t('common.view'), onClick: () => setOpen(payment) },
                          ]}
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

      {open && (
        <LoanPaymentModal
          payment={open}
          canRetry={canRetry(open)}
          onRetry={() => {
            setCharging(open)
            setOpen(null)
          }}
          onClose={() => setOpen(null)}
        />
      )}
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
