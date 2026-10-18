import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  enterPayment,
  loansStore,
  MANUAL_METHODS,
  progressOf,
  type Loan,
  type ManualMethod,
} from '@/entities/microloans/loans'
import { useAdmin } from '@/entities/session/session'
import { brandLoanPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { parseDate, startOfDay } from '@/shared/lib/dates'
import { formatDate, formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { DateField } from '@/shared/ui/DateField'
import { Modal } from '@/shared/ui/Modal'
import { NumberField } from '@/shared/ui/NumberField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { TextField } from '@/shared/ui/TextField'

const now = () => new Date()

/**
 * A payment the borrower made outside the app — cash at a branch or a bank transfer — put on
 * their loan by an admin. It pays the next monthly payment (ending a late one); more goes to the
 * loan early, and enough to cover the rest closes it. Opened from Toʻlovlar (pick the loan) or
 * from a loan's page (that loan).
 */
export function LoanManualPaymentModal({
  brand,
  loan: fixed,
  onClose,
}: {
  brand: Brand
  loan?: Loan
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const open = loansStore.useAll().filter((loan) => loan.brand === brand && !loan.closedAt)
  const [today] = useState(now)
  const [loanId, setLoanId] = useState(fixed?.id ?? '')
  const [method, setMethod] = useState<ManualMethod>('cash')
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState(formatDate(today))
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const loan = open.find((item) => item.id === loanId)
  const progress = loan ? progressOf(loan) : null
  const next = progress?.next
  // What closes the loan today: the next payment's interest and all the principal left
  const payoff = progress && next ? Math.round(next.interest + progress.principalLeft) : 0
  const day = parseDate(date)
  const errors = {
    loan: !loan ? t('error.required') : undefined,
    amount: !amount
      ? t('error.required')
      : next && amount < Math.min(next.amount, payoff)
        ? t('manualLoan.error.min', { sum: formatSum(next.amount) })
        : amount > payoff
          ? t('manualLoan.error.max', { sum: formatSum(payoff) })
          : undefined,
    date: !day ? t('error.required') : day > today ? t('manual.error.future') : undefined,
    reference: !reference.trim() ? t('error.required') : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || !loan || !amount || !day) return
    // Today keeps the time; an earlier day gets midday
    const at =
      startOfDay(day).getTime() === startOfDay(today).getTime()
        ? now()
        : new Date(day.getTime() + 12 * 3_600_000)
    const closed = enterPayment(loan, amount, at, {
      method,
      reference: reference.trim(),
      note: note.trim() || undefined,
      by: admin?.name ?? '—',
    })
    logAction({
      section: 'mlPayments',
      kind: 'money',
      action: 'audit.a.loanPaymentEntered',
      params: { brand: WORKSPACE_INFO[brand].name, sum: formatSum(amount) },
      target: loan.number,
      href: brandLoanPath(brand, loan.id),
    })
    toast(t(closed ? 'manualLoan.closed' : 'manual.saved'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={fixed ? fixed.number : WORKSPACE_INFO[brand].name}
      title={t('manual.title')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      {!fixed && (
        <SelectField
          label={t('loans.col.contract')}
          placeholder={t('manualLoan.pick')}
          options={open.map((item) => ({
            value: item.id,
            label: `${item.number} · ${item.borrower.name}`,
          }))}
          value={loanId}
          onChange={setLoanId}
          error={submitted ? errors.loan : undefined}
        />
      )}
      {loan && next && (
        <div className="grid grid-cols-2 gap-2 rounded-control bg-surface p-3 text-sm">
          {(
            [
              [
                t(loan.overdueSince ? 'manualLoan.late' : 'manualLoan.next', {
                  date: formatDate(next.due),
                }),
                next.amount,
                !!loan.overdueSince,
              ],
              [t('manualLoan.payoff'), payoff, false],
            ] as const
          ).map(([label, sum, red]) => (
            <button
              key={label}
              type="button"
              onClick={() => setAmount(sum)}
              className="flex flex-col items-start rounded-[10px] p-1.5 text-left hover:bg-canvas"
            >
              <span className="text-xs text-ink-muted">{label}</span>
              <span className={cn('font-semibold tabular-nums', red && 'text-danger')}>
                {formatSum(sum)}
              </span>
            </button>
          ))}
        </div>
      )}
      <ChoiceGrid
        label={t('manual.method')}
        columns={2}
        options={MANUAL_METHODS.map((value) => ({ value, label: t(`loanPay.method.${value}`) }))}
        value={method}
        onChange={setMethod}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label={t('payouts.col.amount')}
          suffix="UZS"
          value={amount}
          onChange={setAmount}
          error={submitted ? errors.amount : undefined}
        />
        <DateField
          label={t('manual.date')}
          placeholder="dd.mm.yyyy"
          value={date}
          onChange={setDate}
          error={submitted ? errors.date : undefined}
        />
      </div>
      <TextField
        label={t(method === 'cash' ? 'manual.reference.cash' : 'manual.reference.transfer')}
        placeholder={method === 'cash' ? 'KV-004512' : 'PT-2026-10-0187'}
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        error={submitted ? errors.reference : undefined}
      />
      <TextAreaField
        label={t('contact.comment')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      {next && amount !== null && amount > next.amount && amount < payoff && (
        <p className="rounded-control bg-surface p-3 text-sm">
          {t('manualLoan.willPartial', { sum: formatSum(amount - next.amount) })}
        </p>
      )}
      {amount !== null && payoff > 0 && amount >= payoff && (
        <p className="rounded-control bg-success-soft p-3 text-sm text-success">
          {t('manualLoan.willClose')}
        </p>
      )}
    </Modal>
  )
}
