import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  loanProductsStore,
  monthlyOf,
  TERM_STEPS,
  type LoanProduct,
} from '@/entities/microloans/products'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { NumberField } from '@/shared/ui/NumberField'
import { SelectField } from '@/shared/ui/SelectField'
import { Switch } from '@/shared/ui/Switch'
import { TextField } from '@/shared/ui/TextField'

type Props = {
  brand: Brand
  /** The product to edit, or null to add one at the end. */
  product: LoanProduct | null
  onClose: () => void
  onDelete: (product: LoanProduct) => void
}

const filled = (text: { uz: string; ru: string }) => !!text.uz.trim() && !!text.ru.trim()
// The sum the example under the form is worked out for
const SAMPLE_SUM = 10_000_000

/**
 * Add or edit one microloan product: its name, kind and who it is for in both languages, the sum
 * range and step, the yearly rate range, the shortest and longest term, and whether the app
 * shows it. An example monthly payment follows the numbers as they are typed.
 */
export function LoanProductModal({ brand, product, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [name, setName] = useState(product?.name ?? '')
  const [kind, setKind] = useState(product?.kind ?? { uz: '', ru: '' })
  const [audience, setAudience] = useState(product?.for ?? { uz: '', ru: '' })
  const [min, setMin] = useState<number | null>(product?.min ?? 1_000_000)
  const [max, setMax] = useState<number | null>(product?.max ?? null)
  const [step, setStep] = useState<number | null>(product?.step ?? 500_000)
  const [rateFrom, setRateFrom] = useState<number | null>(product?.rateFrom ?? null)
  const [rateTo, setRateTo] = useState<number | null>(product?.rateTo ?? null)
  const [termMin, setTermMin] = useState(String(product?.termMin ?? 3))
  const [termMax, setTermMax] = useState(String(product?.termMax ?? 12))
  const [enabled, setEnabled] = useState(product?.enabled ?? true)
  const [submitted, setSubmitted] = useState(false)

  const errors = {
    name: !name.trim() ? t('error.required') : undefined,
    min: min === null || min <= 0 ? t('error.required') : undefined,
    max:
      max === null
        ? t('error.required')
        : min !== null && max <= min
          ? t('mlProducts.error.max')
          : undefined,
    step:
      step === null || step <= 0
        ? t('error.required')
        : min !== null && max !== null && step > max - min
          ? t('mlProducts.error.step')
          : undefined,
    rateFrom:
      rateFrom === null || rateFrom <= 0 || rateFrom > 300 ? t('mlProducts.error.rate') : undefined,
    rateTo:
      rateTo === null || rateTo <= 0 || rateTo > 300
        ? t('mlProducts.error.rate')
        : rateFrom !== null && rateTo < rateFrom
          ? t('mlProducts.error.rateOrder')
          : undefined,
    termMax: Number(termMax) < Number(termMin) ? t('mlProducts.error.term') : undefined,
  }
  const valid = Object.values(errors).every((error) => !error) && filled(kind) && filled(audience)

  const terms = TERM_STEPS.map((n) => ({
    value: String(n),
    label: t('mlProducts.months', { n: String(n) }),
  }))
  const exampleTerm = Number(termMax)
  const canExample = rateFrom !== null && rateTo !== null && !errors.rateTo && !errors.rateFrom

  const save = () => {
    setSubmitted(true)
    if (!valid) return
    const record = {
      name: name.trim(),
      kind: { uz: kind.uz.trim(), ru: kind.ru.trim() },
      for: { uz: audience.uz.trim(), ru: audience.ru.trim() },
      min: min!,
      max: max!,
      step: step!,
      rateFrom: rateFrom!,
      rateTo: rateTo!,
      termMin: Number(termMin),
      termMax: Number(termMax),
      enabled,
    }
    if (product) loanProductsStore.update(product.id, record)
    else
      loanProductsStore.replaceAll([
        ...loanProductsStore.getAll(),
        { id: newId(), brand, ...record },
      ])
    const rate = (from: number, to: number) => (from === to ? `${from}%` : `${from}–${to}%`)
    const changes = product
      ? [
          ...(product.max !== record.max
            ? [
                {
                  field: 'mlProducts.max' as const,
                  from: formatSum(product.max),
                  to: formatSum(record.max),
                },
              ]
            : []),
          ...(product.rateFrom !== record.rateFrom || product.rateTo !== record.rateTo
            ? [
                {
                  field: 'mlProducts.rate' as const,
                  from: rate(product.rateFrom, product.rateTo),
                  to: rate(record.rateFrom, record.rateTo),
                },
              ]
            : []),
          ...(product.enabled !== record.enabled
            ? [
                {
                  field: 'mlProducts.enabled' as const,
                  from: t(product.enabled ? 'mlProducts.on' : 'mlProducts.off'),
                  to: t(record.enabled ? 'mlProducts.on' : 'mlProducts.off'),
                },
              ]
            : []),
        ]
      : undefined
    logAction({
      section: 'mlProducts',
      kind: product ? 'update' : 'create',
      action: product ? 'audit.a.loanProductSaved' : 'audit.a.loanProductCreated',
      params: { brand: WORKSPACE_INFO[brand].name },
      target: record.name,
      href: brandPath(brand, 'products'),
      changes: changes?.length ? changes : undefined,
    })
    toast(t(product ? 'toast.saved' : 'mlProducts.created'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={WORKSPACE_INFO[brand].name}
      title={product ? product.name : t('mlProducts.new')}
      footer={
        <>
          {product && (
            <Button
              size="sm"
              variant="ghost"
              className="mr-auto text-danger!"
              onClick={() => onDelete(product)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(product ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <TextField
        label={t('mlProducts.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Zar"
        error={submitted ? errors.name : undefined}
      />
      <LocalizedTextField
        label={t('mlProducts.kind')}
        value={kind}
        onChange={setKind}
        placeholder={tl({ uz: 'Mikroqarz', ru: 'Микрозайм' })}
        requireBoth={submitted}
      />
      <LocalizedTextField
        label={t('mlProducts.for')}
        value={audience}
        onChange={setAudience}
        requireBoth={submitted}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label={t('mlProducts.min')}
          value={min}
          onChange={setMin}
          suffix="UZS"
          error={submitted ? errors.min : undefined}
        />
        <NumberField
          label={t('mlProducts.max')}
          value={max}
          onChange={setMax}
          suffix="UZS"
          error={submitted ? errors.max : undefined}
        />
      </div>
      <NumberField
        label={t('mlProducts.step')}
        value={step}
        onChange={setStep}
        suffix="UZS"
        hint={t('mlProducts.step.hint')}
        error={submitted ? errors.step : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label={t('mlProducts.rateFrom')}
          value={rateFrom}
          onChange={setRateFrom}
          suffix="%"
          maxDigits={3}
          error={submitted ? errors.rateFrom : undefined}
        />
        <NumberField
          label={t('mlProducts.rateTo')}
          value={rateTo}
          onChange={setRateTo}
          suffix="%"
          maxDigits={3}
          hint={t('mlProducts.rate.hint')}
          error={submitted ? errors.rateTo : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t('mlProducts.termMin')}
          options={terms}
          value={termMin}
          onChange={setTermMin}
        />
        <SelectField
          label={t('mlProducts.termMax')}
          options={terms}
          value={termMax}
          onChange={setTermMax}
          error={errors.termMax}
        />
      </div>

      {canExample && (
        <p className="rounded-control bg-surface p-4 text-sm text-ink-muted">
          {t(rateFrom === rateTo ? 'mlProducts.example.one' : 'mlProducts.example', {
            sum: formatSum(SAMPLE_SUM),
            term: String(exampleTerm),
            low: formatSum(monthlyOf(SAMPLE_SUM, rateFrom!, exampleTerm)),
            high: formatSum(monthlyOf(SAMPLE_SUM, rateTo!, exampleTerm)),
          })}
        </p>
      )}

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
