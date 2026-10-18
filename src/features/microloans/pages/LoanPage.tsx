import {
  ArrowLeft,
  BellRing,
  ChevronRight,
  CircleAlert,
  FileText,
  PhoneCall,
  Plus,
  ReceiptText,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { loanApplicationsStore } from '@/entities/microloans/applications'
import {
  daysLate,
  lateOf,
  loansStore,
  loanStateTone,
  progressOf,
  stateOf,
  type Installment,
  type Loan,
} from '@/entities/microloans/loans'
import { contactsOfLoan, loanContactsStore } from '@/entities/microloans/loanContacts'
import { paymentsOf, type LoanPayment } from '@/entities/microloans/loanPayments'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandPath, loanAppPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'
import { LoanCallModal, LoanReminderDialog } from '../components/LoanContactDialogs'
import { LoanManualPaymentModal } from '../components/LoanManualPaymentModal'
import { LoanReceiptModal } from '../components/LoanReceiptModal'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

/** Label and value rows inside a card. */
function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium break-words tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

type MonthState = 'paid' | 'late' | 'next' | 'upcoming' | 'settled'
const monthTone: Record<MonthState, StatusTone> = {
  paid: 'success',
  late: 'danger',
  next: 'info',
  upcoming: 'neutral',
  settled: 'neutral',
}
const monthStateOf = (loan: Loan, item: Installment, today: Date): MonthState =>
  item.n <= loan.paidCount
    ? 'paid'
    : loan.closedAt
      ? 'settled'
      : loan.overdueSince && item.due <= today
        ? 'late'
        : item.n === loan.paidCount + 1 || (loan.overdueSince && item.n === loan.paidCount + 1)
          ? 'next'
          : 'upcoming'

/**
 * One microloan, read-only: what was issued and what is left, the late payment if any, the full
 * schedule month by month, every payment made (monthly and early, with its fiscal cheque) and
 * every refused charge, and the borrower, card and ariza it came from. A payment made outside the
 * app is entered from here.
 */
export function LoanPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const loan = loansStore.useAll().find((item) => item.id === id && item.brand === brand)
  const product = loanProductsStore.useAll().find((p) => p.id === loan?.productId)
  const app = loanApplicationsStore.useAll().find((item) => item.id === loan?.applicationId)
  const [today] = useState(() => new Date())
  const [receipt, setReceipt] = useState<LoanPayment | null>(null)
  const [entering, setEntering] = useState(false)
  const [calling, setCalling] = useState(false)
  const [reminding, setReminding] = useState(false)
  const contacts = contactsOfLoan(loanContactsStore.useAll(), id ?? '')

  const back = (
    <button
      type="button"
      onClick={() => navigate(brandPath(brand, 'loans'))}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.loans')}
    </button>
  )

  if (!loan) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('loans.notFound')} />
      </div>
    )
  }

  const { schedule, next, remaining, principalLeft, paid, total } = progressOf(loan)
  const state = stateOf(loan)
  const card4 = `${loan.card.brand === 'humo' ? 'Humo' : 'Uzcard'} •••• ${loan.card.last4}`
  // Every payment made, newest first, and the charges the card refused
  const payments = paymentsOf([loan])

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tabular-nums">{loan.number}</h1>
          <StatusBadge tone={loanStateTone[state]}>{t(`loan.state.${state}`)}</StatusBadge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-muted">
            {product?.name} · {t('loan.issuedOn', { date: formatDate(loan.issuedAt) })}
          </p>
          {state !== 'closed' && (
            <Button size="sm" onClick={() => setEntering(true)}>
              <Plus size={18} />
              {t('manual.title')}
            </Button>
          )}
        </div>
      </div>

      {state === 'overdue' && next && (
        <div className="flex gap-3 rounded-card bg-danger-soft p-4 text-danger">
          <CircleAlert size={22} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">
              {t('loan.late.title', { days: String(daysLate(loan, today)) })}
            </p>
            <p className="text-sm">
              {t('loan.late.text', {
                months: String(lateOf(loan, today).months.length),
                sum: formatSum(lateOf(loan, today).amount),
                date: formatDate(loan.overdueSince!),
              })}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('loans.col.issued')}
          value={formatSum(loan.amount)}
          hint={`${t('mlProducts.months', { n: String(loan.term) })} · ${loan.rate}%`}
        />
        <StatCard
          label={t('loan.principalLeft')}
          value={formatSum(principalLeft)}
          hint={t('loans.paidOf', { paid: String(paid), total: String(total) })}
        />
        <StatCard
          label={t('loan.remaining')}
          value={formatSum(remaining)}
          hint={t('loan.remainingHint')}
        />
        {state === 'closed' ? (
          <StatCard
            label={t('loan.closed')}
            value={formatDate(loan.closedAt!)}
            hint={t(
              loan.prepayments.some((p) => p.kind === 'full')
                ? 'loan.closedEarly'
                : 'loan.closedOnTime',
            )}
          />
        ) : state === 'overdue' ? (
          <StatCard
            label={t('overdue.col.amount')}
            value={formatSum(lateOf(loan, today).amount)}
            hint={t('overdue.months', { count: String(lateOf(loan, today).months.length) })}
          />
        ) : (
          <StatCard
            label={t('loans.col.next')}
            value={next ? formatSum(next.amount) : '—'}
            hint={next ? formatDate(next.due) : undefined}
          />
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <h2 className="p-5 text-lg font-bold">{t('loan.schedule')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={cn(th, 'w-12')}>№</th>
                    <th className={th}>{t('loan.col.due')}</th>
                    <th className={`${th} text-right`}>{t('loan.col.amount')}</th>
                    <th className={`${th} text-right`}>{t('loan.col.principal')}</th>
                    <th className={`${th} text-right`}>{t('loan.col.interest')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => {
                    const month = monthStateOf(loan, item, today)
                    return (
                      <tr
                        key={item.n}
                        className={cn(
                          'border-b border-line last:border-b-0',
                          month === 'late' && 'bg-danger-soft/50',
                          month === 'settled' && 'text-ink-subtle',
                        )}
                      >
                        <td className="px-4 py-2.5 text-sm tabular-nums">{item.n}</td>
                        <td className="px-4 py-2.5 text-sm tabular-nums">{formatDate(item.due)}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums">
                          {formatSum(item.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                          {formatSum(item.principal)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm tabular-nums">
                          {formatSum(item.interest)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge tone={monthTone[month]}>
                            {month === 'paid'
                              ? t('loan.month.paidOn', {
                                  date: formatDate(loan.paidOn[item.n] ?? item.due),
                                })
                              : t(`loan.month.${month}`)}
                          </StatusBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('loan.payments')}</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('loan.payments.none')}</p>
            ) : (
              <ul className="flex flex-col">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('font-medium', !payment.ok && 'text-danger')}>
                        {payment.kind === 'monthly'
                          ? t('loan.payment.monthly', { n: String(payment.n) })
                          : t(
                              payment.kind === 'full'
                                ? 'loan.payment.full'
                                : 'loan.payment.partial',
                            )}
                        {!payment.ok && ` · ${t(`loanPay.reason.${payment.reason ?? 'funds'}`)}`}
                      </span>
                      <span className="text-sm text-ink-muted tabular-nums">
                        {formatDateTime(payment.at)} · {t(`loanPay.method.${payment.method}`)} ·{' '}
                        {payment.reference ?? card4}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'font-semibold whitespace-nowrap tabular-nums',
                        !payment.ok && 'text-danger line-through',
                      )}
                    >
                      {formatSum(payment.amount)}
                    </span>
                    {payment.ok && (
                      <button
                        type="button"
                        onClick={() => setReceipt(payment)}
                        aria-label={t('receipt.show')}
                        title={t('receipt.show')}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-subtle hover:bg-surface hover:text-ink"
                      >
                        <ReceiptText size={18} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(state === 'overdue' || contacts.length > 0) && (
            <section className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">{t('overdue.log')}</h2>
                {state === 'overdue' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setReminding(true)}>
                      <BellRing size={18} />
                      {t('contact.remind')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setCalling(true)}>
                      <PhoneCall size={18} />
                      {t('contact.call')}
                    </Button>
                  </div>
                )}
              </div>
              {contacts.length === 0 ? (
                <p className="text-sm text-ink-muted">{t('contact.empty')}</p>
              ) : (
                <ol className="flex flex-col">
                  {contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex flex-col gap-0.5 border-b border-line py-3 last:border-b-0"
                    >
                      <span className="font-medium">
                        {contact.channel === 'reminder'
                          ? t('overdue.log.reminder')
                          : contact.result === 'promised' && contact.promiseDate
                            ? t('contact.promise', { date: formatDate(contact.promiseDate) })
                            : t(`contact.result.${contact.result ?? 'noAnswer'}`)}
                      </span>
                      <span className="text-sm text-ink-muted">
                        {formatDateTime(contact.at)} · {contact.by}
                      </span>
                      {contact.comment && <span className="text-sm">{contact.comment}</span>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className={card}>
            <h2 className="font-bold">{t('loanApps.col.borrower')}</h2>
            <Rows
              rows={[
                [t('merchant.owner'), loan.borrower.name],
                [t('merchant.phone'), formatPhone(loan.borrower.phone)],
                [
                  t('loanApp.passport'),
                  `${loan.borrower.passport.slice(0, 2)} ${loan.borrower.passport.slice(2)}`,
                ],
              ]}
            />
          </section>
          <section className={card}>
            <h2 className="font-bold">{t('loan.terms')}</h2>
            <Rows
              rows={[
                [t('mlProducts.col.product'), product?.name ?? '—'],
                [t('loan.payDay'), t('loan.payDay.value', { day: String(loan.payDay) })],
                [t('loan.card'), card4],
                [t('loan.total'), formatSum(schedule.reduce((sum, item) => sum + item.amount, 0))],
              ]}
            />
            <button
              type="button"
              onClick={() => toast(t('loan.pdf.sample'))}
              className="flex h-10 items-center justify-center gap-2 rounded-control border border-line text-sm font-semibold text-brand hover:bg-surface"
            >
              <FileText size={18} />
              {t('loan.pdf')}
            </button>
          </section>
          {app && (
            <Link
              to={loanAppPath(brand, app.id)}
              className="flex items-center gap-3 rounded-card border border-line bg-canvas p-4 hover:bg-surface/60"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">
                  {t('application.title', { number: groupDigits(app.number) })}
                </span>
                <span className="text-sm text-ink-muted">{t('loan.fromApp')}</span>
              </div>
              <ChevronRight size={18} className="text-ink-subtle" />
            </Link>
          )}
        </aside>
      </div>
      {receipt && <LoanReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
      {entering && (
        <LoanManualPaymentModal brand={brand} loan={loan} onClose={() => setEntering(false)} />
      )}
      {calling && <LoanCallModal loan={loan} onClose={() => setCalling(false)} />}
      {reminding && (
        <LoanReminderDialog
          loan={loan}
          amount={lateOf(loan, today).amount}
          days={daysLate(loan, today)}
          onClose={() => setReminding(false)}
        />
      )}
    </div>
  )
}
