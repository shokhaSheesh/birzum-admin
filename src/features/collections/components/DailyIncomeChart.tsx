import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Payment } from '@/entities/collections/payments'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { MONTHS, sameDay, startOfDay } from '@/shared/lib/dates'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'

/** A payment still to come: its day and what is left of it. */
export type Expected = { date: Date; amount: number }

/** The first month with sample payments. */
const FIRST_MONTH = new Date(2026, 8, 1)

/** 0 < value: the next round number above it for the axis, e.g. 37 mln -> 40 mln. */
function niceCeil(value: number) {
  const pow = 10 ** Math.floor(Math.log10(value))
  return ([1, 2, 2.5, 5, 10].find((step) => step * pow >= value) ?? 10) * pow
}

/**
 * Money in per day for one month. Days up to today show what came in (solid green); later
 * days show what is due (pale green). Hovering or focusing a day shows its figures.
 */
export function DailyIncomeChart({
  payments,
  expected,
  today,
}: {
  payments: Payment[]
  expected: Expected[]
  today: Date
}) {
  const { t, lang } = useI18n()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [active, setActive] = useState<number | null>(null)
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const compact = (value: number) => {
    const short = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
    if (value >= 1e9) return t('unit.mlrd', { n: short(value / 1e9) })
    if (value >= 1e6) return t('unit.mln', { n: short(value / 1e6) })
    return groupDigits(value)
  }

  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const todayStart = startOfDay(today)
  const days = Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(month.getFullYear(), month.getMonth(), i + 1)
    const future = date > todayStart
    const inDay = (at: Date) => sameDay(at, date)
    const done = payments.filter((payment) => !payment.failed && inDay(payment.at))
    const due = future ? expected.filter((item) => inDay(item.date)) : []
    return {
      date,
      future,
      value: future
        ? due.reduce((sum, item) => sum + item.amount, 0)
        : done.reduce((sum, payment) => sum + payment.amount, 0),
      count: future ? due.length : done.length,
    }
  })
  const collected = days.filter((day) => !day.future).reduce((sum, day) => sum + day.value, 0)
  const coming = days.filter((day) => day.future).reduce((sum, day) => sum + day.value, 0)
  const top = niceCeil(Math.max(1_000_000, ...days.map((day) => day.value)))
  const shown = active === null ? null : days[active]

  const step = (by: number) => {
    setActive(null)
    setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1))
  }

  return (
    <section className="flex flex-col gap-5 rounded-card border border-line bg-canvas p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t('collections.chart.prev')}
            title={t('collections.chart.prev')}
            disabled={month <= FIRST_MONTH}
            onClick={() => step(-1)}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-32 text-center text-sm font-semibold">
            {MONTHS[lang][month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            type="button"
            aria-label={t('collections.chart.next')}
            title={t('collections.chart.next')}
            disabled={month >= last}
            onClick={() => step(1)}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        {/* Axis: three quiet lines and their values */}
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
            {days.map((day, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${formatDate(day.date)}: ${formatSum(day.value)}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="group flex h-full flex-1 items-end justify-center px-[1px] focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'w-full max-w-5 rounded-t-[4px] transition-colors',
                    day.future
                      ? 'border border-b-0 border-green-500 bg-green-200'
                      : active === i
                        ? 'bg-green-600'
                        : 'bg-green-500',
                    day.value === 0 && 'border-0',
                  )}
                  style={{ height: day.value ? `max(3px, ${(day.value / top) * 100}%)` : 0 }}
                />
              </button>
            ))}
          </div>
          {shown && (
            <div
              role="status"
              className={cn(
                'pointer-events-none absolute top-0 z-10 flex flex-col gap-0.5 rounded-control border border-line bg-canvas px-3 py-2 text-sm whitespace-nowrap shadow-[0_8px_24px_-8px_rgb(7_42_60/0.35)]',
                active! < 4
                  ? ''
                  : active! > dayCount - 5
                    ? '-translate-x-full'
                    : '-translate-x-1/2',
              )}
              style={{
                left: `${((active! + (active! < 4 ? 0 : active! > dayCount - 5 ? 1 : 0.5)) / dayCount) * 100}%`,
              }}
            >
              <span className="text-ink-muted tabular-nums">{formatDate(shown.date)}</span>
              <span className="font-semibold tabular-nums">
                {t(shown.future ? 'collections.chart.expected' : 'collections.chart.collected')}:{' '}
                {formatSum(shown.value)}
              </span>
              <span className="text-ink-muted">
                {t('collections.paymentsCount', { count: String(shown.count) })}
              </span>
            </div>
          )}
        </div>
        <span />
        <div className="flex pt-2 text-xs text-ink-subtle tabular-nums">
          {days.map((day, i) => (
            <span
              key={i}
              className={cn('flex-1 text-center', sameDay(day.date, today) && 'font-bold text-ink')}
            >
              {i === 0 || (i + 1) % 5 === 0 || sameDay(day.date, today) ? i + 1 : ''}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
