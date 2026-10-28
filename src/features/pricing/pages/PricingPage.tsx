import { Info } from 'lucide-react'
import { merchantsStore, TARIFFS } from '@/entities/merchants/merchants'
import { MARKUPS, TERMS } from '@/entities/pricing/pricing'
import { useI18n } from '@/shared/i18n/useI18n'
import { PageHeader } from '@/shared/ui/PageHeader'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Ustama, read-only: the markup for every term under each tariff, and how many merchants are on
 * each tariff. FlexSoft owns the rates; they are changed there, not here.
 */
export function PricingPage() {
  const { t } = useI18n()
  const merchants = merchantsStore.useAll()

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.pricing')} />

      <p className="flex items-center gap-3 rounded-card bg-navy-100 p-4 text-sm text-ink">
        <Info size={20} className="shrink-0 text-brand" />
        {t('pricing.note')}
      </p>

      <section className="overflow-x-auto rounded-card border border-line bg-canvas">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>{t('pricing.col.term')}</th>
              {TARIFFS.map((tariff) => (
                <th key={tariff} className={`${th} text-right`}>
                  <span className="flex flex-col items-end gap-0.5">
                    {t('merchant.tariff.value', { tariff })}
                    <span className="font-medium tracking-normal normal-case">
                      {t('pricing.merchants', {
                        count: String(merchants.filter((m) => m.tariff === tariff).length),
                      })}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TERMS.map((term) => (
              <tr key={term} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3 font-semibold">
                  {t('term.months', { count: String(term) })}
                </td>
                {TARIFFS.map((tariff) => (
                  <td key={tariff} className="px-4 py-3 text-right font-semibold tabular-nums">
                    {MARKUPS[tariff][term]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
