import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  loanProductsStore,
  monthlyOf,
  RATE_MODES,
  rateOf,
  rateRangeOf,
  TERM_STEPS,
  type LoanProduct,
  type RateBand,
  type RateMode,
} from '@/entities/microloans/products'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { controlClass, inputClass } from '@/shared/ui/control'
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

/** A rate table as it is typed: rates stay text until saved, so a cell can be empty. */
type DraftBand = { id: string; upTo: number | null; byTerm: Record<number, string> }

const filled = (text: { uz: string; ru: string }) => !!text.uz.trim() && !!text.ru.trim()
const pct = (text: string | undefined) => Number((text ?? '').replace(',', '.'))
const okRate = (text: string | undefined) => !!text?.trim() && pct(text) > 0 && pct(text) <= 300
// The sum the example under the table is worked out for
const SAMPLE_SUM = 10_000_000

const toDraft = (rates: RateBand[]): DraftBand[] =>
  rates.map((band) => ({
    id: newId(),
    upTo: band.upTo,
    byTerm: Object.fromEntries(Object.entries(band.byTerm).map(([n, v]) => [n, String(v)])),
  }))

/** A small percent box for a table cell: our control look, digits and a comma only. */
function PercentInput({
  value,
  onChange,
  invalid,
  label,
}: {
  value: string
  onChange: (value: string) => void
  invalid: boolean
  label: string
}) {
  return (
    <div className={controlClass(invalid, 'h-10! w-20! px-2! text-sm!')}>
      <input
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))}
        className={cn(inputClass, 'w-full text-right tabular-nums')}
      />
      <span className="pl-1 text-sm text-ink-subtle">%</span>
    </div>
  )
}

/**
 * Add or edit one microloan product: its name and who it is for, the sum range, the shortest and
 * longest term, the yearly rate and what it depends on — one rate, the term, the sum, or both —
 * and whether the app shows it. The admin types the exact rate for every case; the app's range
 * and calculator come from that table.
 */
export function LoanProductModal({ brand, product, onClose, onDelete }: Props) {
  const { t, tl } = useI18n()
  const [name, setName] = useState(product?.name ?? '')
  const [audience, setAudience] = useState(product?.for ?? { uz: '', ru: '' })
  const [min, setMin] = useState<number | null>(product?.min ?? 1_000_000)
  const [max, setMax] = useState<number | null>(product?.max ?? null)
  const [termMin, setTermMin] = useState(String(product?.termMin ?? 3))
  const [termMax, setTermMax] = useState(String(product?.termMax ?? 12))
  const [mode, setMode] = useState<RateMode>(product?.rateMode ?? 'fixed')
  const [bands, setBands] = useState<DraftBand[]>(() =>
    product ? toDraft(product.rates) : [{ id: newId(), upTo: null, byTerm: {} }],
  )
  const [enabled, setEnabled] = useState(product?.enabled ?? true)
  const [submitted, setSubmitted] = useState(false)

  const terms = TERM_STEPS.filter((n) => n >= Number(termMin) && n <= Number(termMax))
  const byAmount = mode === 'amount' || mode === 'both'
  const byTerm = mode === 'term' || mode === 'both'
  // The table that is used: one band unless the sum matters, and the last one reaches the max
  const used = byAmount ? bands : bands.slice(0, 1)
  const rateOfBand = (band: DraftBand, n: number) =>
    byTerm ? band.byTerm[n] : (band.byTerm[terms[0]] ?? Object.values(band.byTerm)[0])

  const setRate = (id: string, n: number | 'all', value: string) =>
    setBands(
      bands.map((band) =>
        band.id !== id
          ? band
          : {
              ...band,
              byTerm:
                n === 'all'
                  ? Object.fromEntries(TERM_STEPS.map((step) => [step, value]))
                  : { ...band.byTerm, [n]: value },
            },
      ),
    )
  const setUpTo = (id: string, upTo: number | null) =>
    setBands(bands.map((band) => (band.id === id ? { ...band, upTo } : band)))
  const addBand = () =>
    setBands([...bands, { id: newId(), upTo: null, byTerm: { ...(bands.at(-1)?.byTerm ?? {}) } }])
  const dropBand = (id: string) => setBands(bands.filter((band) => band.id !== id))

  // Every band below the last needs a ceiling between the sums, each above the one before
  const bandErrors = new Map<string, string>()
  if (byAmount)
    used.slice(0, -1).forEach((band, i) => {
      const before = i === 0 ? (min ?? 0) : (used[i - 1].upTo ?? 0)
      if (band.upTo === null) bandErrors.set(band.id, t('error.required'))
      else if (band.upTo <= before || (max !== null && band.upTo >= max))
        bandErrors.set(band.id, t('mlProducts.error.band'))
    })
  const rateMissing = used.some((band) => terms.some((n) => !okRate(rateOfBand(band, n))))

  const errors = {
    name: !name.trim() ? t('error.required') : undefined,
    min: min === null || min <= 0 ? t('error.required') : undefined,
    max:
      max === null
        ? t('error.required')
        : min !== null && max <= min
          ? t('mlProducts.error.max')
          : undefined,
    termMax: Number(termMax) < Number(termMin) ? t('mlProducts.error.term') : undefined,
  }
  const valid =
    Object.values(errors).every((error) => !error) &&
    filled(audience) &&
    bandErrors.size === 0 &&
    !rateMissing

  // What the table makes of the numbers typed so far
  const record = (): Pick<LoanProduct, 'rates' | 'termMin' | 'termMax'> => ({
    termMin: Number(termMin),
    termMax: Number(termMax),
    rates: used.map((band, i) => ({
      upTo: i === used.length - 1 ? (max ?? 0) : (band.upTo ?? 0),
      byTerm: Object.fromEntries(terms.map((n) => [n, pct(rateOfBand(band, n))])),
    })),
  })
  const range = !rateMissing && terms.length ? rateRangeOf(record()) : null
  const exampleTerm = terms.at(-1)

  const save = () => {
    setSubmitted(true)
    if (!valid) return
    const next = {
      name: name.trim(),
      for: { uz: audience.uz.trim(), ru: audience.ru.trim() },
      min: min!,
      max: max!,
      rateMode: mode,
      enabled,
      ...record(),
    }
    if (product) loanProductsStore.update(product.id, next)
    else
      loanProductsStore.replaceAll([...loanProductsStore.getAll(), { id: newId(), brand, ...next }])
    const text = (p: Pick<LoanProduct, 'rates' | 'termMin' | 'termMax'>) => {
      const r = rateRangeOf(p)
      return r.from === r.to ? `${r.from}%` : `${r.from}–${r.to}%`
    }
    const changes = product
      ? [
          ...(product.max !== next.max
            ? [
                {
                  field: 'mlProducts.max' as const,
                  from: formatSum(product.max),
                  to: formatSum(next.max),
                },
              ]
            : []),
          ...(JSON.stringify(product.rates) !== JSON.stringify(next.rates) ||
          product.rateMode !== next.rateMode
            ? [
                {
                  field: 'mlProducts.rate' as const,
                  from: `${text(product)} · ${t(`mlProducts.mode.${product.rateMode}`)}`,
                  to: `${text(next)} · ${t(`mlProducts.mode.${next.rateMode}`)}`,
                },
              ]
            : []),
          ...(product.enabled !== next.enabled
            ? [
                {
                  field: 'mlProducts.enabled' as const,
                  from: t(product.enabled ? 'mlProducts.on' : 'mlProducts.off'),
                  to: t(next.enabled ? 'mlProducts.on' : 'mlProducts.off'),
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
      target: next.name,
      href: brandPath(brand, 'products'),
      changes: changes?.length ? changes : undefined,
    })
    toast(t(product ? 'toast.saved' : 'mlProducts.created'))
    onClose()
  }

  const termOptions = TERM_STEPS.map((n) => ({
    value: String(n),
    label: t('mlProducts.months', { n: String(n) }),
  }))
  const bandLabel = (i: number) => {
    const from = i === 0 ? (min ?? 0) : (used[i - 1].upTo ?? 0)
    const upTo = i === used.length - 1 ? max : used[i].upTo
    return `${formatSum(from, false)} – ${upTo ? formatSum(upTo, false) : '…'}`
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={WORKSPACE_INFO[brand].name}
      title={product ? product.name : t('mlProducts.new')}
      size="wide"
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
        label={t('mlProducts.for')}
        value={audience}
        onChange={setAudience}
        placeholder={tl({ uz: 'Har qanday maqsadga, garovsiz', ru: 'На любые цели, без залога' })}
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
        <SelectField
          label={t('mlProducts.termMin')}
          options={termOptions}
          value={termMin}
          onChange={setTermMin}
        />
        <SelectField
          label={t('mlProducts.termMax')}
          options={termOptions}
          value={termMax}
          onChange={setTermMax}
          error={errors.termMax}
        />
      </div>

      <ChoiceGrid
        label={t('mlProducts.mode')}
        columns={2}
        options={RATE_MODES.map((value) => ({
          value,
          label: t(`mlProducts.mode.${value}`),
          description: t(`mlProducts.mode.${value}.hint`),
        }))}
        value={mode}
        onChange={setMode}
      />

      {terms.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-control border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface/60">
                <tr>
                  {byAmount && (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">
                      {t('mlProducts.col.sum')}
                    </th>
                  )}
                  {byTerm ? (
                    terms.map((n) => (
                      <th
                        key={n}
                        className="px-2 py-2 text-right text-xs font-semibold text-ink-muted"
                      >
                        {t('mlProducts.months', { n: String(n) })}
                      </th>
                    ))
                  ) : (
                    <th className="px-2 py-2 text-right text-xs font-semibold text-ink-muted">
                      {t('mlProducts.rate')}
                    </th>
                  )}
                  {byAmount && used.length > 1 && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {used.map((band, i) => {
                  const last = i === used.length - 1
                  return (
                    <tr key={band.id} className="border-t border-line align-top">
                      {byAmount && (
                        <td className="px-3 py-2">
                          {last ? (
                            <p className="flex h-10 items-center text-sm whitespace-nowrap text-ink-muted tabular-nums">
                              {t('mlProducts.band.last', { range: bandLabel(i) })}
                            </p>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div
                                className={controlClass(
                                  submitted && bandErrors.has(band.id),
                                  'h-10! px-2.5! text-sm!',
                                )}
                              >
                                <span className="pr-1 text-sm text-ink-subtle">
                                  {t('mlProducts.band.upTo')}
                                </span>
                                <input
                                  inputMode="numeric"
                                  aria-label={t('mlProducts.band.upTo')}
                                  value={band.upTo === null ? '' : formatSum(band.upTo, false)}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12)
                                    setUpTo(band.id, digits ? Number(digits) : null)
                                  }}
                                  className={cn(inputClass, 'w-28 tabular-nums')}
                                />
                              </div>
                              {submitted && bandErrors.has(band.id) && (
                                <span className="text-xs text-danger">
                                  {bandErrors.get(band.id)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      {byTerm ? (
                        terms.map((n) => (
                          <td key={n} className="px-2 py-2">
                            <PercentInput
                              label={`${bandLabel(i)} · ${t('mlProducts.months', { n: String(n) })}`}
                              value={band.byTerm[n] ?? ''}
                              onChange={(value) => setRate(band.id, n, value)}
                              invalid={submitted && !okRate(band.byTerm[n])}
                            />
                          </td>
                        ))
                      ) : (
                        <td className="px-2 py-2">
                          <PercentInput
                            label={t('mlProducts.rate')}
                            value={rateOfBand(band, terms[0]) ?? ''}
                            onChange={(value) => setRate(band.id, 'all', value)}
                            invalid={submitted && !okRate(rateOfBand(band, terms[0]))}
                          />
                        </td>
                      )}
                      {byAmount && used.length > 1 && (
                        <td className="py-2 pr-2">
                          {!last && (
                            <button
                              type="button"
                              aria-label={t('common.remove')}
                              title={t('common.remove')}
                              onClick={() => dropBand(band.id)}
                              className="grid size-10 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-danger"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {byAmount && (
            <Button size="sm" variant="ghost" className="self-start" onClick={addBand}>
              <Plus size={18} />
              {t('mlProducts.band.add')}
            </Button>
          )}
          {submitted && rateMissing && (
            <p className="text-sm text-danger">{t('mlProducts.error.rates')}</p>
          )}
        </div>
      )}

      {range && exampleTerm && (
        <p className="rounded-control bg-surface p-4 text-sm text-ink-muted">
          {t('mlProducts.example.exact', {
            range: range.from === range.to ? `${range.from}%` : `${range.from}–${range.to}%`,
            sum: formatSum(SAMPLE_SUM),
            term: String(exampleTerm),
            rate: String(rateOf(record(), SAMPLE_SUM, exampleTerm)),
            monthly: formatSum(
              monthlyOf(SAMPLE_SUM, rateOf(record(), SAMPLE_SUM, exampleTerm), exampleTerm),
            ),
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
