import { filialsStore } from '@/entities/merchants/filials'
import { merchantsStore, type Merchant } from '@/entities/merchants/merchants'
import { useI18n } from '@/shared/i18n/useI18n'
import { groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

type Props = {
  merchant: Merchant
  onClose: () => void
  /** After the merchant and its filials are gone. */
  onDeleted?: () => void
}

/**
 * Asks before deleting a merchant. One with active nasiyas cannot be deleted until they are
 * paid off: the dialog offers to pause it instead, or only explains when it is already paused.
 */
export function MerchantDeleteDialog({ merchant, onClose, onDeleted }: Props) {
  const { t } = useI18n()

  const remove = () => {
    filialsStore
      .getAll()
      .filter((filial) => filial.merchantId === merchant.id)
      .forEach((filial) => filialsStore.remove(filial.id))
    merchantsStore.remove(merchant.id)
    toast(t('merchant.deleted'))
    onClose()
    onDeleted?.()
  }
  const pause = () => {
    merchantsStore.update(merchant.id, { status: 'paused' })
    toast(t('merchant.paused'))
    onClose()
  }

  if (merchant.activeNasiya > 0) {
    const paused = merchant.status === 'paused'
    return (
      <ConfirmDialog
        open
        onClose={onClose}
        title={t('common.cantDelete')}
        tone="primary"
        cancelLabel={paused ? t('common.understood') : undefined}
        confirmLabel={paused ? undefined : t('merchant.pause')}
        onConfirm={pause}
      >
        <p>
          {t('merchant.delete.blockedHint', {
            name: merchant.name,
            count: groupDigits(merchant.activeNasiya),
          })}
        </p>
        <p>{t(paused ? 'merchant.delete.alreadyPaused' : 'merchant.delete.pauseHint')}</p>
      </ConfirmDialog>
    )
  }
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('merchant.delete.title')}
      confirmLabel={t('common.delete')}
      onConfirm={remove}
    >
      <p>{t('merchant.delete.message', { name: merchant.name })}</p>
    </ConfirmDialog>
  )
}
