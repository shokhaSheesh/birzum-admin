import { useState } from 'react'
import type { Payment } from '@/entities/collections/payments'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { MONTHS, sameDay, startOfDay, WEEKDAYS } from '@/shared/lib/dates'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import type { Bucket } from '@/shared/lib/period'

/** A payment still to come: its day and what is left of it. */
export type Expected = { date: Date; amount: number }

/** 0 < value: the next round number above it for the axis, e.g. 37 mln -> 40 mln. */
function niceCeil(value: number) {
  const pow = 10 ** Math.floor(Math.log10(value))
  return ([1, 2, 2.5, 5, 10].find((step) => step * pow >= value) ?? 10) * pow
}

/**
 * Money in over the page's period, one bar per hour, day or month. What came in is solid
 * green; what is still due sits on top in pale green with a green outline. Hovering or
 * focusing a bar shows its figures.
 */
export function IncomeChart({
  buckets,
  payments,
  expected,
  now,
}: {
  buckets: Bucket[]
  payments: Payment[]
  expected: Expected[]
  now: Date
}) {
  const { t, lang } = useI18n()
  const [active, setActive] = useState<number | null>(null)
  const today = startOfDay(now)

  const compact = (value: number) => {
    const short = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
    if (value >= 1e9) return t('unit.mlrd', { n: short(value / 1e9) })
    if (value >= 1e6) return t('unit.mln', { n: short(value / 1e6) })
    return groupDigits(value)
  }

  const bars = buckets.map((bucket) => {
    const inside = (at: Date) => at >= bucket.start && at < bucket.end
    const done = payments.filter((payment) => !payment.failed && inside(payment.at))
    const due = expected.filter((item) => item.date >= today && inside(item.date))
    return {
      bucket,
      collected: done.reduce((sum, payment) => sum + payment.amount, 0),
      paidCount: done.length,
      expected: due.reduce((sum, item) => sum + item.amount, 0),
      dueCount: due.length,
    }
  })
  const collected = bars.reduce((sum, bar) => sum + bar.collected, 0)
  const coming = bars.reduce((sum, bar) => sum + bar.expected, 0)
  const top = niceCeil(Math.max(1_000_000, ...bars.map((bar) => bar.collected + bar.expected)))
  const shown = active === null ? null : bars[active]
  const count = bars.length

  const nameOf = ({ start, size }: Bucket) =>
    size === 'hour'
      ? `${formatDate(start)}, ${String(start.getHours()).padStart(2, '0')}:00`
      : size === 'day'
        ? formatDate(start)
        : `${MONTHS[lang][start.getMonth()]} ${start.getFullYear()}`
  const tickOf = ({ start, size }: Bucket, i: number) => {
    if (size === 'hour') return i % 3 === 0 ? String(start.getHours()).padStart(2, '0') : ''
    if (size === 'month')
      return count > 14 && i % 2 ? '' : MONTHS[lang][start.getMonth()].slice(0, 3)
    if (count <= 7) return `${WEEKDAYS[lang][(start.getDay() + 6) % 7]} ${start.getDate()}`
    const day = start.getDate()
    return i === 0 || day === 1 || day % 5 === 0 || sameDay(start, now) ? String(day) : ''
  }
  const isNow = (bucket: Bucket) => now >= bucket.start && now < bucket.end

  return (
    <section className="flex flex-col gap-5 rounded-card border border-line bg-canvas p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">{t('collections.chart.title')}</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-green-500" />
            <span className="text-ink-muted">{t('collections.chart.collected')}</span>
            <span className="font-semibold tabular-nums">{formatSum(collected)}</span>
          </span>
          {coming > 0 && (
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm border border-green-500 bg-green-200" />
              <span className="text-ink-muted">{t('collections.chart.expected')}</span>
              <span className="font-semibold tabular-nums">{formatSum(coming)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="flex h-52 flex-col justify-between text-right text-xs text-ink-subtle tabular-nums">
          <span className="-translate-y-1/2">{compact(top)}</span>
          <span>{compact(top / 2)}</span>
          <span className="translate-y-1/2">0</span>
        </div>
        <div className="relative h-52" onMouseLeave={() => setActive(null)}>
          <div className="absolute inset-0 flex flex-col justify-between">
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-dashed border-line" />
            <span className="border-t border-line" />
          </div>
          <div className="absolute inset-0 flex items-end">
            {bars.map((bar, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${nameOf(bar.bucket)}: ${formatSum(bar.collected + bar.expected)}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5 px-[1px] focus-visible:outline-none"
              >
                {bar.expected > 0 && (
                  <span
                    className={cn(
                      'w-full max-w-10 border border-green-500 bg-green-200',
                      bar.collected ? 'rounded-t-[4px] border-b-0' : 'rounded-t-[4px]',
                    )}
                    style={{ height: `max(3px, ${(bar.expected / top) * 100}%)` }}
                  />
                )}
                {bar.collected > 0 && (
                  <span
                    className={cn(
                      'w-full max-w-10 transition-colors',
                      bar.expected ? '' : 'rounded-t-[4px]',
                      active === i ? 'bg-green-600' : 'bg-green-500',
                    )}
                    style={{ height: `max(3px, ${(bar.collected / top) * 100}%)` }}
                  />
                )}
              </button>
            ))}
          </div>
          {shown && (
            <div
              role="status"
              className={cn(
                'pointer-events-none absolute top-0 z-10 flex flex-col gap-0.5 rounded-control border border-line bg-canvas px-3 py-2 text-sm whitespace-nowrap shadow-[0_8px_24px_-8px_rgb(7_42_60/0.35)]',
                active! < count * 0.15
                  ? ''
                  : active! >= count * 0.85
                    ? '-translate-x-full'
                    : '-translate-x-1/2',
              )}
              style={{
                left: `${((active! + (active! < count * 0.15 ? 0 : active! >= count * 0.85 ? 1 : 0.5)) / count) * 100}%`,
              }}
            >
              <span className="text-ink-muted tabular-nums">{nameOf(shown.bucket)}</span>
              {(shown.collected > 0 || !shown.expected) && (
                <span className="font-semibold tabular-nums">
                  {t('collections.chart.collected')}: {formatSum(shown.collected)}{' '}
                  <span className="font-normal text-ink-muted">
                    · {t('collections.paymentsCount', { count: String(shown.paidCount) })}
                  </span>
                </span>
              )}
              {shown.expected > 0 && (
                <span className="font-semibold tabular-nums">
                  {t('collections.chart.expected')}: {formatSum(shown.expected)}{' '}
                  <span className="font-normal text-ink-muted">
                    · {t('collections.paymentsCount', { count: String(shown.dueCount) })}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
        <span />
        <div className="flex pt-2 text-xs text-ink-subtle tabular-nums">
          {bars.map((bar, i) => (
            <span
              key={i}
              className={cn(
                'min-w-0 flex-1 text-center whitespace-nowrap',
                isNow(bar.bucket) && 'font-bold text-ink',
              )}
            >
              {tickOf(bar.bucket, i)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
