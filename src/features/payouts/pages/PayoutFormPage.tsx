import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { filialsStore } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import {
  owedSales,
  payoutsStore,
  referenceFor,
  salesStore,
  sumOf,
} from '@/entities/payouts/payouts'
import { useAdmin } from '@/entities/session/session'
import { payoutPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FormSection } from '@/shared/ui/FormSection'
import { SelectField } from '@/shared/ui/SelectField'
import { TableCheckbox } from '@/shared/ui/TableCheckbox'
import { TextField } from '@/shared/ui/TextField'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * A new payout: pick the merchant, then which of its owed sales this transfer pays for (all of
 * them to start with). The summary beside shows where the money goes and how much. It is
 * created "Jarayonda" and marked sent later.
 */
export function PayoutFormPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const admin = useAdmin()
  const [params] = useSearchParams()
  const merchants = merchantsStore.useAll()
  const sales = salesStore.useAll()
  const filials = filialsStore.useAll()
  const owing = merchants.filter((item) => owedSales(sales, item.id).length > 0)

  const [merchantId, setMerchantId] = useState(() => {
    const asked = params.get('merchant')
    return owing.some((item) => item.id === asked) ? asked! : ''
  })
  const owed = owedSales(sales, merchantId || '__none__')
  const [picked, setPicked] = useState<Set<string>>(() => new Set(owed.map((sale) => sale.id)))
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [today] = useState(() => new Date())

  const merchant = merchants.find((item) => item.id === merchantId)
  const chosen = owed.filter((sale) => picked.has(sale.id))
  const allPicked = owed.length > 0 && chosen.length === owed.length

  const pickMerchant = (id: string) => {
    setMerchantId(id)
    setPicked(new Set(owedSales(sales, id).map((sale) => sale.id)))
  }
  const toggle = (id: string) => {
    const next = new Set(picked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  const create = () => {
    setSubmitted(true)
    if (!merchant || chosen.length === 0) {
      toast(t('payout.error.form'), 'error')
      return
    }
    const id = newId()
    payoutsStore.save({
      id,
      merchantId: merchant.id,
      reference: referenceFor(today, payoutsStore.getAll().length + 41),
      date: today,
      amount: sumOf(chosen),
      saleIds: chosen.map((sale) => sale.id),
      state: 'processing',
      createdBy: admin?.name ?? '—',
      note: note.trim() || undefined,
    })
    chosen.forEach((sale) => salesStore.update(sale.id, { payoutId: id }))
    toast(t('payout.created'))
    navigate(payoutPath(id), { replace: true })
  }

  return (
    <div className="flex min-h-full flex-col">
      <ActionBar
        eyebrow={t('nav.payouts')}
        title={t('payout.new')}
        onBack={() => navigate(ROUTES.payouts)}
      >
        <Button
          size="sm"
          variant="ghost"
          className="px-4!"
          onClick={() => navigate(ROUTES.payouts)}
        >
          {t('common.cancel')}
        </Button>
        <Button size="sm" className="px-4!" onClick={create}>
          {t('payouts.create')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="flex flex-col gap-6">
          <FormSection title={t('products.col.merchant')} hint={t('payout.merchant.hint')}>
            <SelectField
              label={t('products.col.merchant')}
              options={[
                { value: '', label: t('payout.merchant.pick') },
                ...owing.map((item) => ({
                  value: item.id,
                  label: `${item.name} · ${formatSum(sumOf(owedSales(sales, item.id)))}`,
                })),
              ]}
              value={merchantId}
              onChange={pickMerchant}
              error={submitted && !merchant ? t('error.required') : undefined}
            />
            <TextField
              label={t('payout.note')}
              placeholder={t('payout.note.placeholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormSection>

          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <div className="flex flex-col gap-1 p-6 pb-5">
              <h2 className="text-lg font-bold">{t('payout.sales')}</h2>
              <p className="text-sm text-ink-muted">{t('payout.sales.hint')}</p>
            </div>
            {!merchant ? (
              <EmptyState title={t('payout.sales.pickFirst')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-t border-line">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="w-12 pl-4">
                        <TableCheckbox
                          label={t('payout.sales.all')}
                          checked={allPicked ? true : chosen.length > 0 ? 'mixed' : false}
                          onChange={() =>
                            setPicked(allPicked ? new Set() : new Set(owed.map((sale) => sale.id)))
                          }
                        />
                      </th>
                      <th className={th}>{t('payout.col.ariza')}</th>
                      <th className={th}>{t('payout.col.client')}</th>
                      <th className={th}>{t('payout.col.filial')}</th>
                      <th className={th}>{t('payout.col.handed')}</th>
                      <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owed.map((sale) => {
                      const filial = filials.find((item) => item.id === sale.filialId)
                      const on = picked.has(sale.id)
                      return (
                        <tr
                          key={sale.id}
                          onClick={() => toggle(sale.id)}
                          className={cn(
                            'cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60',
                            !on && 'text-ink-muted',
                          )}
                        >
                          <td className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <TableCheckbox
                              label={`${t('payout.col.ariza')} ${sale.number}`}
                              checked={on}
                              onChange={() => toggle(sale.id)}
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            № {groupDigits(sale.number)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">{sale.client}</span>
                              <span className="truncate text-sm text-ink-muted">
                                {sale.product}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{filial ? tl(filial.name) : '—'}</td>
                          <td className="px-4 py-3 text-sm tabular-nums">
                            {formatDate(sale.handedAt)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                            {formatSum(sale.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5 lg:sticky lg:top-24">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            {t('payout.summary')}
          </p>
          {merchant && (
            <div className="flex items-center gap-3">
              <MerchantLogo merchant={merchant} />
              <div className="flex min-w-0 flex-col">
                <p className="truncate font-semibold">{merchant.name}</p>
                <p className="truncate text-sm text-ink-muted">{merchant.legal.company}</p>
              </div>
            </div>
          )}
          <div className="flex flex-col rounded-control bg-green-200 p-4">
            <p className="text-sm text-navy-700">
              {t('payout.summary.count', { count: String(chosen.length) })}
            </p>
            <p className="text-2xl font-bold tabular-nums">{formatSum(sumOf(chosen))}</p>
          </div>
          <dl className="flex flex-col gap-2.5 text-sm">
            {(
              [
                [t('payouts.col.date'), formatDate(today)],
                [t('merchant.bank'), merchant?.bank.name ?? '—'],
                [t('merchant.mfo'), merchant?.bank.mfo ?? '—'],
                [t('merchant.account'), merchant?.bank.account ?? '—'],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-medium break-all tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-subtle">{t('payout.summary.note')}</p>
        </aside>
      </div>
    </div>
  )
}
