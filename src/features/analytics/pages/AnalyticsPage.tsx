import { Fragment, useState } from 'react'
import {
  activeOn,
  activeOver,
  DOWNLOAD_HEAT,
  downloadsIn,
  LAUNCH_DAY,
  signupFunnel,
  viewsOf,
} from '@/entities/analytics/appAnalytics'
import { productsStore } from '@/entities/catalog/products'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { useI18n } from '@/shared/i18n/useI18n'
import { bucketTick, changeOf, previousOf } from '@/shared/lib/chartAxis'
import { WEEKDAYS } from '@/shared/lib/dates'
import { groupDigits } from '@/shared/lib/format'
import { boundsOf, bucketsOf, thisMonth, type Period } from '@/shared/lib/period'
import { BarList } from '@/shared/ui/charts/BarList'
import { ColumnChart } from '@/shared/ui/charts/ColumnChart'
import { KpiTile } from '@/shared/ui/charts/KpiTile'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import type { ReactNode } from 'react'

const card = 'flex min-w-0 flex-col gap-5 rounded-card border border-line bg-canvas p-5'
const TOP = 5

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={card}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {note && <p className="text-sm text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  )
}

const minutes = (value: number) => {
  const whole = Math.floor(value)
  const seconds = Math.round((value - whole) * 60)
  return `${whole}:${String(seconds).padStart(2, '0')}`
}

/**
 * The client app in numbers: installs by day and by hour of the week, how many people use it,
 * what they look at most, and where sign-up loses them (which step, after how long).
 */
export function AnalyticsPage() {
  const { t, tl, lang } = useI18n()
  const products = productsStore.useAll()
  const merchants = merchantsStore.useAll()
  const [now] = useState(() => new Date())
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const bounds = boundsOf(period)
  const from = bounds.from ?? LAUNCH_DAY
  const to = bounds.to && bounds.to < now ? bounds.to : now
  const previous = previousOf(period, now)
  const changeLabel = t(
    previous?.partial ? `dashboard.vsSoFar.${period.unit}` : `dashboard.vs.${period.unit}`,
  )
  const noCompare = t(period.unit === 'all' ? 'dashboard.noCompare.all' : 'dashboard.noCompare')

  const downloads = downloadsIn(from, to)
  const before = previous?.range
  const downloadsBefore = before?.from && before.to ? downloadsIn(before.from, before.to) : 0

  const daily = activeOn(to)
  const weekly = activeOver(to, 7)
  const monthly = activeOver(to, 30)

  // Installs per bar; bars still ahead of today stay empty
  const buckets = bucketsOf(period, LAUNCH_DAY, now)
  const columns = buckets.map((bucket, i) => {
    const value =
      bucket.start > now || bucket.size === 'hour'
        ? 0
        : downloadsIn(bucket.start, new Date(Math.min(bucket.end.getTime() - 1, now.getTime())))
    return {
      key: String(i),
      label: bucketTick(bucket, i, buckets.length, lang, now),
      value,
      tip: t('analytics.downloads.tip', { count: groupDigits(value) }),
    }
  })

  // Where in the week the installs land, as a share of the busiest hour
  const heatMax = Math.max(...DOWNLOAD_HEAT.flat())
  const heatTotal = DOWNLOAD_HEAT.flat().reduce((sum, value) => sum + value, 0)

  const topProducts = products
    .map((product) => ({ product, views: viewsOf(product.id, from, to) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, TOP)
  const topMerchants = merchants
    .map((merchant) => ({ merchant, views: viewsOf(merchant.id, from, to) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, TOP)

  const opened = Math.round(downloads * 0.93)
  const funnel = signupFunnel(opened)
  const finished = funnel[funnel.length - 1].reached
  const finishedShare = opened ? Math.round((finished / opened) * 100) : 0

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.analytics')} />
      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={t('analytics.kpi.downloads')}
          value={groupDigits(downloads)}
          change={before ? changeOf(downloads, downloadsBefore) : null}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('analytics.kpi.dau')}
          value={groupDigits(daily)}
          change={null}
          changeLabel=""
          noCompare={t('analytics.kpi.onDay')}
        />
        <KpiTile
          label={t('analytics.kpi.wau')}
          value={groupDigits(weekly)}
          change={null}
          changeLabel=""
          noCompare={t('analytics.kpi.last7')}
        />
        <KpiTile
          label={t('analytics.kpi.mau')}
          value={groupDigits(monthly)}
          change={null}
          changeLabel=""
          noCompare={t('analytics.kpi.stickiness', {
            share: String(Math.round((daily / monthly) * 100)),
          })}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card title={t('analytics.downloads.title')}>
          {period.unit === 'day' ? (
            <p className="text-sm text-ink-muted">{t('analytics.downloads.day')}</p>
          ) : (
            <ColumnChart columns={columns} hideValues={columns.length > 14} />
          )}
        </Card>

        <Card title={t('analytics.heat.title')} note={t('analytics.heat.note')}>
          <div className="overflow-x-auto">
            <div className="grid min-w-[420px] grid-cols-[2rem_repeat(24,minmax(0,1fr))] gap-0.5">
              <span />
              {Array.from({ length: 24 }, (_, hour) => (
                <span
                  key={hour}
                  className="text-center text-[10px] font-medium text-ink-subtle tabular-nums"
                >
                  {hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}
                </span>
              ))}
              {DOWNLOAD_HEAT.map((row, weekday) => (
                <Fragment key={weekday}>
                  <span className="self-center text-xs font-medium text-ink-muted">
                    {WEEKDAYS[lang][weekday]}
                  </span>
                  {row.map((value, hour) => (
                    <span
                      key={hour}
                      title={t('analytics.heat.tip', {
                        day: WEEKDAYS[lang][weekday],
                        hour: `${String(hour).padStart(2, '0')}:00`,
                        count: groupDigits(Math.round((downloads * value) / heatTotal)),
                      })}
                      className="h-6 rounded-[4px] bg-brand"
                      style={{ opacity: 0.08 + (value / heatMax) * 0.92 }}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            {t('analytics.heat.less')}
            <span className="h-2.5 w-24 rounded-full bg-gradient-to-r from-brand/10 to-brand" />
            {t('analytics.heat.more')}
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title={t('analytics.top.products')}>
          <BarList
            empty={t('analytics.top.empty')}
            items={topProducts.map(({ product, views }) => ({
              key: product.id,
              label: tl(product.name),
              value: views,
              valueLabel: t('analytics.views', { count: groupDigits(views) }),
              sub: merchants.find((merchant) => merchant.id === product.merchantId)?.name,
            }))}
          />
        </Card>
        <Card title={t('analytics.top.merchants')}>
          <BarList
            empty={t('analytics.top.empty')}
            items={topMerchants.map(({ merchant, views }) => ({
              key: merchant.id,
              label: merchant.name,
              leading: <MerchantLogo merchant={merchant} size="sm" />,
              value: views,
              valueLabel: t('analytics.views', { count: groupDigits(views) }),
            }))}
          />
        </Card>
      </div>

      <Card
        title={t('analytics.funnel.title')}
        note={t('analytics.funnel.note', {
          share: String(finishedShare),
          finished: groupDigits(finished),
          opened: groupDigits(opened),
        })}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                <th className="py-3 pr-4">{t('analytics.funnel.step')}</th>
                <th className="py-3 pr-4">{t('analytics.funnel.reached')}</th>
                <th className="py-3 pr-4 text-right">{t('analytics.funnel.left')}</th>
                <th className="py-3 text-right">{t('analytics.funnel.after')}</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((row) => {
                const share = opened ? (row.reached / opened) * 100 : 0
                return (
                  <tr key={row.step} className="border-b border-line last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{t(`analytics.step.${row.step}`)}</td>
                    <td className="w-[40%] py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-navy-100">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-sm tabular-nums">
                          {groupDigits(row.reached)} · {Math.round(share)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-sm tabular-nums">
                      {row.left ? (
                        <span className="text-danger">−{groupDigits(row.left)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 text-right text-sm text-ink-muted tabular-nums">
                      {row.left
                        ? t('analytics.funnel.minutes', { time: minutes(row.leftAfterMinutes) })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
