import { CircleCheck, CircleX, ReceiptText, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LoanPayment } from '@/entities/microloans/loanPayments'
import { cardText } from '@/entities/microloans/loans'
import { brandLoanPath, WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Button } from '@/shared/ui/Button'
import { FiscalReceipt } from '@/shared/ui/FiscalReceipt'
import { Modal } from '@/shared/ui/Modal'

/**
 * One payment: what it was for, how it came and from which card. A payment that went through
 * shows its fiscal cheque; a refused charge says why, and the latest one can be tried again.
 */
export function LoanPaymentModal({
  payment,
  canRetry,
  onRetry,
  onClose,
}: {
  payment: LoanPayment
  /** The loan is still late on this payment, so charging the card again makes sense. */
  canRetry: boolean
  onRetry: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [receipt, setReceipt] = useState(false)
  const { loan } = payment
  const label =
    payment.kind === 'monthly'
      ? t('loan.payment.monthly', { n: String(payment.n) })
      : t(payment.kind === 'full' ? 'loan.payment.full' : 'loan.payment.partial')
  const rows: [string, ReactNode][] = [
    [t('loanPay.col.at'), formatDateTime(payment.at)],
    [t('loanApps.col.borrower'), `${loan.borrower.name}, ${formatPhone(loan.borrower.phone)}`],
    [
      t('loans.col.contract'),
      <Link
        key="loan"
        to={brandLoanPath(loan.brand, loan.id)}
        className="font-semibold text-brand hover:underline"
      >
        {loan.number}
      </Link>,
    ],
    [t('loanPay.col.kind'), label],
    [t('loanPay.col.method'), t(`loanPay.method.${payment.method}`)],
    [t('loan.card'), cardText(loan.card)],
  ]

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={WORKSPACE_INFO[payment.brand].name}
      title={t(receipt ? 'receipt.title' : payment.ok ? 'loanPay.detail' : 'loanPay.failedTitle')}
      footer={
        <>
          {receipt && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto px-4!"
              onClick={() => setReceipt(false)}
            >
              {t('common.back')}
            </Button>
          )}
          {!receipt && payment.ok && (
            <Button
              size="sm"
              variant="secondary"
              className="mr-auto px-4!"
              onClick={() => setReceipt(true)}
            >
              <ReceiptText size={18} />
              {t('receipt.show')}
            </Button>
          )}
          {!payment.ok && canRetry && (
            <Button size="sm" variant="secondary" className="mr-auto px-4!" onClick={onRetry}>
              <RotateCcw size={18} />
              {t('loanPay.retry')}
            </Button>
          )}
          <Button size="sm" className="ml-auto px-4!" onClick={onClose}>
            {t('common.close')}
          </Button>
        </>
      }
    >
      {receipt ? (
        <FiscalReceipt
          receipt={{
            seller: WORKSPACE_INFO[payment.brand].name,
            tin: WORKSPACE_INFO[payment.brand].tin,
            title: `${loan.number} · ${label}`,
            amount: payment.amount,
            at: payment.at,
            card: cardText(loan.card),
            seed: payment.id,
          }}
        />
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                'grid size-14 place-items-center rounded-full',
                payment.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
              )}
            >
              {payment.ok ? <CircleCheck size={28} /> : <CircleX size={28} />}
            </span>
            <span className="text-3xl font-bold tabular-nums">{formatSum(payment.amount)}</span>
            <span
              className={cn('text-sm', payment.ok ? 'text-ink-muted' : 'font-semibold text-danger')}
            >
              {payment.ok ? label : t(`loanPay.reason.${payment.reason ?? 'funds'}`)}
            </span>
          </div>
          <dl className="flex flex-col gap-2.5 rounded-control bg-surface p-4 text-sm">
            {rows.map(([name, value]) => (
              <div key={name} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
                <dt className="text-ink-muted">{name}</dt>
                <dd className="font-medium break-words tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {!payment.ok && (
            <p className="text-sm text-ink-muted">
              {t(canRetry ? 'loanPay.failedHint' : 'loanPay.failedDone')}
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
