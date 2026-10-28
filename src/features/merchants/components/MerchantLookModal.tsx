import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { merchantsStore, type Merchant } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { merchantPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ImageField } from '@/shared/ui/ImageField'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'

/**
 * The only part of a merchant Birzum edits: how the shop looks in the client app, its logo and
 * description. FlexSoft knows nothing of these; everything else on the merchant comes from it.
 */
export function MerchantLookModal({
  merchant,
  onClose,
}: {
  merchant: Merchant
  onClose: () => void
}) {
  const { t } = useI18n()
  const [logo, setLogo] = useState(merchant.logo)
  const [description, setDescription] = useState(merchant.description)

  const save = () => {
    merchantsStore.save({ ...merchant, logo, description })
    toast(t('toast.saved'))
    logAction({
      section: 'merchants',
      kind: 'update',
      action: 'audit.a.merchantUpdated',
      target: merchant.name,
      href: merchantPath(merchant.id),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={merchant.name}
      title={t('merchant.look.title')}
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
      <div className="flex flex-col gap-4">
        <ImageField
          label={t('merchant.logo')}
          hint={t('merchant.logo.hint')}
          preview={<MerchantLogo merchant={{ name: merchant.name, logo }} size="lg" />}
          value={logo}
          onChange={setLogo}
        />
        <LocalizedTextField
          label={t('merchant.description')}
          value={description}
          onChange={setDescription}
          multiline
        />
      </div>
    </Modal>
  )
}
