import { payoutsStore } from '@/entities/payouts/payouts'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

const now = () => new Date()

/**
 * Confirms that the bank has sent a payout. The merchant app then shows it as "Oʻtkazildi" and
 * its sales as paid.
 */
export function MarkPaidDialog({ payoutId, onClose }: { payoutId: string; onClose: () => void }) {
  const { t } = useI18n()
  const payout = payoutsStore.get(payoutId)
  if (!payout) return null

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('payout.markPaid.title')}
      tone="primary"
      confirmLabel={t('payout.markPaid')}
      onConfirm={() => {
        payoutsStore.update(payout.id, { state: 'paid', paidAt: now() })
        toast(t('payout.marked'))
        onClose()
      }}
    >
      <p>
        {t('payout.markPaid.message', {
          reference: payout.reference,
          amount: formatSum(payout.amount),
        })}
      </p>
    </ConfirmDialog>
  )
}
