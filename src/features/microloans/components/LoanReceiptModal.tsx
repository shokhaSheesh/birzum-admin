import type { LoanPayment } from '@/entities/microloans/loanPayments'
import { cardText } from '@/entities/microloans/loans'
import { WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { Button } from '@/shared/ui/Button'
import { FiscalReceipt } from '@/shared/ui/FiscalReceipt'
import { Modal } from '@/shared/ui/Modal'

/** The fiscal cheque of one payment, as soliq.uz keeps it. */
export function LoanReceiptModal({
  payment,
  onClose,
}: {
  payment: LoanPayment
  onClose: () => void
}) {
  const { t } = useI18n()
  const label =
    payment.kind === 'monthly'
      ? t('loan.payment.monthly', { n: String(payment.n) })
      : t(payment.kind === 'full' ? 'loan.payment.full' : 'loan.payment.partial')
  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={payment.loan.number}
      title={t('receipt.title')}
      footer={
        <Button size="sm" className="ml-auto px-4!" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <FiscalReceipt
        receipt={{
          seller: WORKSPACE_INFO[payment.brand].name,
          tin: WORKSPACE_INFO[payment.brand].tin,
          title: `${payment.loan.number} · ${label}`,
          amount: payment.amount,
          at: payment.at,
          card:
            payment.method === 'cash' || payment.method === 'transfer'
              ? t(`loanPay.method.${payment.method}`)
              : cardText(payment.loan.card),
          seed: payment.id,
        }}
      />
    </Modal>
  )
}
