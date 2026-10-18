import { useMemo, useState, type ReactNode } from 'react'
import { applicationsStore, handedAtOf } from '@/entities/applications/applications'
import { categoriesStore } from '@/entities/catalog/categories'
import { productsStore } from '@/entities/catalog/products'
import { clientsStore } from '@/entities/clients/clients'
import { paymentsStore, progressOf } from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { sumOf } from '@/entities/payouts/payouts'
import { ratesStore } from '@/entities/pricing/pricing'
import { useI18n } from '@/shared/i18n/useI18n'
import { changeOf, compactSum, previousOf } from '@/shared/lib/chartAxis'
import { inRange, type DateRange } from '@/shared/lib/dates'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { boundsOf, bucketsOf, thisMonth, type Period } from '@/shared/lib/period'
import { BarList } from '@/shared/ui/charts/BarList'
import { ColumnChart } from '@/shared/ui/charts/ColumnChart'
import { KpiTile } from '@/shared/ui/charts/KpiTile'
import { LineChart } from '@/shared/ui/charts/LineChart'
import { ExportMenu } from '@/shared/ui/ExportMenu'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'

/** The first day with sample data. */
const FIRST_DAY = new Date(2026, 8, 1)
const card = 'flex min-w-0 flex-col gap-5 rounded-card border border-line bg-canvas p-5'

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {note && <span className="text-sm text-ink-subtle">{note}</span>}
      </div>
      {children}
    </section>
  )
}

/**
 * The platform at a glance for one period: four figures with their change, sales against money
 * collected, how arizalar went, who and what sells, and the portfolio as it stands today.
 */
export function DashboardPage() {
  const { t, tl } = useI18n()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const clients = clientsStore.useAll()
  const merchants = merchantsStore.useAll()
  const products = productsStore.useAll()
  const categories = categoriesStore.useAll()
  const rates = ratesStore.useAll()
  const [now] = useState(() => new Date())
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const bounds = boundsOf(period)
  const previous = previousOf(period, now)
  const before = previous?.range ?? null
  const unit = (key: 'mln' | 'mlrd', n: string) => t(`unit.${key}`, { n })

  const handed = useMemo(
    () =>
      applications
        .filter((a) => a.status === 'handed' || a.status === 'closed')
        .map((application) => ({ application, at: handedAtOf(application)! })),
    [applications],
  )
  const salesIn = (range: DateRange) => handed.filter((item) => inRange(item.at, range))
  const paidIn = (range: DateRange) =>
    payments.filter((payment) => !payment.failed && inRange(payment.at, range))
  const createdIn = (range: DateRange) =>
    applications.filter((application) => inRange(application.createdAt, range))
  const joinedIn = (range: DateRange) =>
    clients.filter((client) => inRange(client.registeredAt, range))
  const goods = (items: typeof handed) =>
    items.reduce((sum, item) => sum + item.application.goodsTotal, 0)

  const sold = salesIn(bounds)
  const paid = paidIn(bounds)
  const created = createdIn(bounds)
  const joined = joinedIn(bounds)
  const compare = (nowValue: number, of: (range: DateRange) => number) =>
    before ? changeOf(nowValue, of(before)) : null

  // One point per bar; bars still ahead of now have no value yet
  const buckets = bucketsOf(period, FIRST_DAY, now)
  const series = (of: (range: DateRange) => number) =>
    buckets.map((bucket) =>
      bucket.start > now || bucket.end <= FIRST_DAY
        ? null
        : of({ from: bucket.start, to: new Date(bucket.end.getTime() - 1) }),
    )
  const salesLine = series((range) => goods(salesIn(range)))
  const paidLine = series((range) => sumOf(paidIn(range)))
  const changeLabel = t(
    previous?.partial ? `dashboard.vsSoFar.${period.unit}` : `dashboard.vs.${period.unit}`,
  )
  // When there is nothing to compare with, the tile says why
  const noCompare = t(period.unit === 'all' ? 'dashboard.noCompare.all' : 'dashboard.noCompare')

  // How the period's arizalar went
  const decided = created.filter((a) => a.status !== 'pending' && a.status !== 'processing')
  const funnel = [
    { key: 'sent' as const, value: created.length },
    { key: 'decided' as const, value: decided.length },
    {
      key: 'handed' as const,
      value: created.filter((a) => a.status === 'handed' || a.status === 'closed').length,
    },
  ]
  const sideCounts = [
    {
      key: 'open' as const,
      value: created.length - decided.length,
    },
    { key: 'rejected' as const, value: created.filter((a) => a.status === 'rejected').length },
    { key: 'cancelled' as const, value: created.filter((a) => a.status === 'cancelled').length },
  ]

  // Who and what sells
  const byMerchant = merchants
    .map((merchant) => {
      const own = sold.filter((item) => item.application.merchantId === merchant.id)
      return { merchant, sum: goods(own), count: own.length }
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.sum - a.sum)
  const byCategory = new Map<string, number>()
  for (const { application } of sold)
    for (const line of application.lines) {
      const product = products.find((item) => item.name.uz === line.name)
      const category = categories.find((item) => item.id === product?.categoryId)
      const root = category?.parentId ?? category?.id
      if (root) byCategory.set(root, (byCategory.get(root) ?? 0) + line.price * line.quantity)
    }
  const terms = [
    ...new Set([
      ...rates.filter((r) => r.enabled).map((r) => r.term),
      ...sold.map((s) => s.application.term),
    ]),
  ].sort((a, b) => a - b)

  // The portfolio today, whatever the period
  const running = applications
    .filter((application) => application.status === 'handed')
    .map((application) => progressOf(application, payments, now))
  const outstanding = running.reduce((sum, item) => sum + item.remaining, 0)
  const lateBook = running.filter((item) => item.overdue > 0)
  const lateRemaining = lateBook.reduce((sum, item) => sum + item.remaining, 0)
  const overdue = lateBook.reduce((sum, item) => sum + item.overdue, 0)
  const par = outstanding ? (lateRemaining / outstanding) * 100 : 0
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.dashboard')}
        description={t('dashboard.description')}
        actions={<ExportMenu section="dashboard" period={period} />}
      />
      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={t('dashboard.kpi.sales')}
          value={compactSum(goods(sold), unit)}
          change={compare(goods(sold), (r) => goods(salesIn(r)))}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('collections.chart.collected')}
          value={compactSum(sumOf(paid), unit)}
          change={compare(sumOf(paid), (r) => sumOf(paidIn(r)))}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('nav.applications')}
          value={groupDigits(created.length)}
          change={compare(created.length, (r) => createdIn(r).length)}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('dashboard.kpi.clients')}
          value={groupDigits(joined.length)}
          change={compare(joined.length, (r) => joinedIn(r).length)}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title={t('dashboard.chart.title')}>
          <LineChart
            label={t('dashboard.chart.title')}
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
              {
                key: 'paid',
                label: t('collections.chart.collected'),
                color: 'var(--color-green-600)',
                values: paidLine,
              },
            ]}
          />
        </Card>

        <Card title={t('dashboard.funnel.title')}>
          <ol className="flex flex-col gap-3">
            {funnel.map((step, i) => {
              const share = funnel[0].value ? (step.value / funnel[0].value) * 100 : 0
              return (
                <li key={step.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{t(`dashboard.funnel.${step.key}`)}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold">{groupDigits(step.value)}</span>
                      {i > 0 && (
                        <span className="ml-1.5 text-ink-subtle">{Math.round(share)}%</span>
                      )}
                    </span>
                  </div>
                  <div className="h-8 rounded-control bg-surface">
                    <div
                      className="h-full rounded-control bg-brand transition-[width]"
                      style={{
                        width: `${Math.max(step.value ? 2 : 0, share)}%`,
                        opacity: 1 - i * 0.22,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
          <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4">
            {sideCounts.map((item) => (
              <div key={item.key} className="flex flex-col gap-0.5">
                <dt className="text-xs text-ink-muted">{t(`dashboard.funnel.${item.key}`)}</dt>
                <dd className="text-lg font-bold tabular-nums">{groupDigits(item.value)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title={t('dashboard.merchants.title')}>
          <BarList
            empty={t('dashboard.empty')}
            items={byMerchant.map(({ merchant, sum, count }) => ({
              key: merchant.id,
              label: merchant.name,
              leading: <MerchantLogo merchant={merchant} size="sm" />,
              value: sum,
              valueLabel: compactSum(sum, unit),
              sub: t('applications.count', { count: groupDigits(count) }),
            }))}
          />
        </Card>
        <Card title={t('dashboard.categories.title')}>
          <BarList
            empty={t('dashboard.empty')}
            items={[...byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([id, sum]) => ({
                key: id,
                label: tl(categories.find((c) => c.id === id)!.name),
                value: sum,
                valueLabel: compactSum(sum, unit),
              }))}
          />
        </Card>
        <Card title={t('dashboard.terms.title')} note={t('dashboard.terms.note')}>
          <ColumnChart
            columns={terms.map((term) => {
              const count = sold.filter((s) => s.application.term === term).length
              return {
                key: String(term),
                label: t('term.months', { count: String(term) }),
                value: count,
                tip: `${t('term.months', { count: String(term) })}: ${t('applications.count', { count: String(count) })}`,
              }
            })}
          />
        </Card>
      </div>

      <Card title={t('dashboard.portfolio.title')} note={t('dashboard.portfolio.note')}>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-ink-muted">{t('dashboard.portfolio.outstanding')}</span>
          <span className="text-4xl font-bold [font-variant-numeric:normal]">
            {formatSum(outstanding)}
          </span>
          <span className="text-sm text-ink-muted">
            {t('dashboard.portfolio.outstanding.hint', { count: groupDigits(running.length) })}
          </span>
        </div>
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          <span className="bg-green-500" style={{ flexGrow: outstanding - lateRemaining }} />
          <span className="bg-danger" style={{ flexGrow: lateRemaining }} />
        </div>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                swatch: 'bg-green-500',
                label: t('dashboard.portfolio.onTime'),
                value: formatSum(outstanding - lateRemaining),
                hint: t('dashboard.portfolio.onTime.hint', {
                  count: groupDigits(running.length - lateBook.length),
                }),
              },
              {
                swatch: 'bg-danger',
                label: t('dashboard.portfolio.late'),
                value: formatSum(lateRemaining),
                hint: t('dashboard.portfolio.late.hint', { count: groupDigits(lateBook.length) }),
              },
              {
                swatch: null,
                label: t('dashboard.portfolio.overdue'),
                value: formatSum(overdue),
                hint: t('dashboard.portfolio.overdue.hint'),
              },
              {
                swatch: null,
                label: t('dashboard.portfolio.par'),
                value: `${par.toFixed(1).replace('.', ',')}%`,
                hint: t('dashboard.portfolio.par.hint'),
              },
            ] as const
          ).map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-sm text-ink-muted">
                {item.swatch && <span className={`size-2.5 shrink-0 rounded-sm ${item.swatch}`} />}
                {item.label}
              </dt>
              <dd className="text-lg font-bold tabular-nums">{item.value}</dd>
              <dd className="text-sm text-ink-subtle">{item.hint}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
