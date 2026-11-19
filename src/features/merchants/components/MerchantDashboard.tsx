import { useState } from 'react'
import { applicationsStore, handedAtOf, isOpen } from '@/entities/applications/applications'
import type { Merchant } from '@/entities/merchants/merchants'
import { ratingOf, reviewsStore } from '@/entities/reviews/reviews'
import { useI18n } from '@/shared/i18n/useI18n'
import { changeOf, compactSum, previousOf } from '@/shared/lib/chartAxis'
import { inRange, type DateRange } from '@/shared/lib/dates'
import { groupDigits } from '@/shared/lib/format'
import { boundsOf, bucketsOf, thisMonth, type Period } from '@/shared/lib/period'
import { KpiTile } from '@/shared/ui/charts/KpiTile'
import { LineChart } from '@/shared/ui/charts/LineChart'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'

const FIRST_DAY = new Date(2026, 8, 1)
const score = (n: number) => n.toFixed(1).replace('.', ',')

/**
 * The merchant's figures for a period, from Birzum's own data: nasiya sales (goods handed over),
 * arizalar and how many the shop accepted, the rating and negative reviews, and sales over time.
 */
export function MerchantDashboard({ merchant }: { merchant: Merchant }) {
  const { t } = useI18n()
  const [now] = useState(() => new Date())
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const applications = applicationsStore
    .useAll()
    .filter((application) => application.merchantId === merchant.id)
  const reviews = reviewsStore.useAll().filter((review) => review.merchantId === merchant.id)
  const bounds = boundsOf(period)
  const previous = previousOf(period, now)
  const before = previous?.range ?? null
  const unit = (key: 'mln' | 'mlrd', n: string) => t(`unit.${key}`, { n })

  const handed = applications
    .filter((a) => a.status === 'handed' || a.status === 'closed')
    .map((application) => ({ application, at: handedAtOf(application)! }))
  const salesOf = (range: DateRange) =>
    handed
      .filter((item) => inRange(item.at, range))
      .reduce((sum, item) => sum + item.application.goodsTotal, 0)
  const createdIn = (range: DateRange) =>
    applications.filter((application) => inRange(application.createdAt, range))
  const reviewsIn = (range: DateRange) => reviews.filter((review) => inRange(review.at, range))
  const negativeIn = (range: DateRange) =>
    reviewsIn(range).filter((r) => r.status === 'published' && r.rating <= 2).length
  const compare = (value: number, of: (range: DateRange) => number) =>
    before ? changeOf(value, of(before)) : null

  const sales = salesOf(bounds)
  const created = createdIn(bounds)
  const decided = created.filter((a) => !isOpen(a.status))
  const accepted = decided.filter((a) => a.status !== 'rejected')
  const acceptedShare = decided.length ? Math.round((accepted.length / decided.length) * 100) : 0
  const { count, average } = ratingOf(reviewsIn(bounds))
  const negative = negativeIn(bounds)

  const buckets = bucketsOf(period, FIRST_DAY, now)
  const salesLine = buckets.map((bucket) =>
    bucket.start > now || bucket.end <= FIRST_DAY
      ? null
      : salesOf({ from: bucket.start, to: new Date(bucket.end.getTime() - 1) }),
  )
  const changeLabel = t(
    previous?.partial ? `dashboard.vsSoFar.${period.unit}` : `dashboard.vs.${period.unit}`,
  )
  const noCompare = t(period.unit === 'all' ? 'dashboard.noCompare.all' : 'dashboard.noCompare')

  return (
    <div className="flex flex-col gap-4">
      <PeriodFilter value={period} onChange={setPeriod} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={t('dashboard.kpi.sales')}
          value={compactSum(sales, unit)}
          change={compare(sales, salesOf)}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('nav.applications')}
          value={groupDigits(created.length)}
          hint={t('merchant.dash.accepted', { share: String(acceptedShare) })}
          change={compare(created.length, (r) => createdIn(r).length)}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('merchant.dash.rating')}
          value={count ? score(average) : '—'}
          hint={t('product.reviews.count', { count: groupDigits(count) })}
          change={null}
          changeLabel={changeLabel}
          noCompare={t('merchant.dash.ratingNote')}
        />
        <KpiTile
          label={t('merchant.dash.negative')}
          value={groupDigits(negative)}
          change={compare(negative, negativeIn)}
          upIsGood={false}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
      </div>
      <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5">
        <h2 className="text-lg font-bold">{t('merchant.dash.chart')}</h2>
        <LineChart
          label={t('merchant.dash.chart')}
          buckets={buckets}
          now={now}
          series={[
            {
              key: 'sales',
              label: t('dashboard.kpi.sales'),
              color: 'var(--color-brand)',
              values: salesLine,
              area: true,
            },
          ]}
        />
      </section>
    </div>
  )
}
