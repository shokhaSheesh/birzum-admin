import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  loanProductsStore,
  PAY_TYPES,
  rateRangeOf,
  type LoanProduct,
  type PayType,
} from '@/entities/microloans/products'
import { brandPath, WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { Switch } from '@/shared/ui/Switch'

const filled = (text: { uz: string; ru: string }) => !!text.uz.trim() && !!text.ru.trim()

/**
 * One product from FlexSoft: its own terms read-only on top, then what the app shows and the admin
 * sets here: who it is for, the payment types the client can pick, and whether it shows at all.
 */
export function LoanProductSettingsModal({
  product,
  onClose,
}: {
  product: LoanProduct
  onClose: () => void
}) {
  const { t } = useI18n()
  const [audience, setAudience] = useState(product.for)
  const [payTypes, setPayTypes] = useState<PayType[]>(product.payTypes)
  const [enabled, setEnabled] = useState(product.enabled)
  const [submitted, setSubmitted] = useState(false)
  const { from, to } = rateRangeOf(product)

  const save = () => {
    setSubmitted(true)
    if (!filled(audience) || payTypes.length === 0) return
    loanProductsStore.update(product.id, {
      for: { uz: audience.uz.trim(), ru: audience.ru.trim() },
      // In the order the app lists them, whatever order they were ticked in
      payTypes: PAY_TYPES.filter((type) => payTypes.includes(type)),
      enabled,
    })
    logAction({
      section: 'mlProducts',
      kind: 'update',
      action: 'audit.a.loanProductSaved',
      params: { brand: WORKSPACE_INFO[product.brand].name },
      target: product.name,
      href: brandPath(product.brand, 'products'),
    })
    toast(t('toast.saved'))
    onClose()
  }

  const facts: [string, string][] = [
    [t('mlProducts.code'), product.code],
    [t('mlProducts.col.sum'), `${formatSum(product.min)} – ${formatSum(product.max)}`],
    [t('mlProducts.termMax'), t('mlProducts.months', { n: String(product.termMax) })],
    [t('mlProducts.col.rate'), from === to ? `${from}%` : `${from}–${to}%`],
  ]

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={WORKSPACE_INFO[product.brand].name}
      title={product.name}
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
      <section className="flex flex-col gap-2 rounded-control bg-surface p-4">
        <p className="text-sm font-semibold">{t('mlProducts.fromFlexSoft')}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <LocalizedTextField
        label={t('mlProducts.for')}
        value={audience}
        onChange={setAudience}
        requireBoth={submitted}
      />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium text-ink-muted">
          {t('mlProducts.payTypes')}
        </legend>
        {PAY_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={t(`payType.${type}`)}
            description={t(`payType.${type}.hint`)}
            checked={payTypes.includes(type)}
            onChange={(on) =>
              setPayTypes(on ? [...payTypes, type] : payTypes.filter((item) => item !== type))
            }
          />
        ))}
        {submitted && payTypes.length === 0 && (
          <p className="text-sm text-danger">{t('mlProducts.error.payTypes')}</p>
        )}
      </fieldset>
      <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
        <div className="flex flex-col">
          <p className="font-semibold">{t('mlProducts.enabled')}</p>
          <p className="text-sm text-ink-muted">{t('mlProducts.enabled.hint')}</p>
        </div>
        <Switch checked={enabled} onChange={setEnabled} label={t('mlProducts.enabled')} />
      </div>
    </Modal>
  )
}
