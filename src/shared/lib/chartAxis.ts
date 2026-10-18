import type { Lang } from '@/shared/i18n/dictionaries'
import { addDays, MONTHS, sameDay, startOfDay, WEEKDAYS, type DateRange } from './dates'
import { formatDate, groupDigits } from './format'
import { boundsOf, shiftPeriod, type Bucket, type Period } from './period'

/** 0 < value: the next round number above it for the axis, e.g. 37 mln -> 40 mln. */
export function niceCeil(value: number) {
  if (value <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(value))
  return ([1, 2, 2.5, 5, 10].find((step) => step * pow >= value) ?? 10) * pow
}

/** Short money for axes and tiles: "12,5 mln", "1,1 mlrd". `unit` gives the words. */
export function compactSum(value: number, unit: (key: 'mln' | 'mlrd', n: string) => string) {
  const short = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
  if (value >= 1e9) return unit('mlrd', short(value / 1e9))
  if (value >= 1e6) return unit('mln', short(value / 1e6))
  return groupDigits(Math.round(value))
}

/** A bar's full name for a tooltip: "16.10.2026, 09:00", "16.10.2026" or "Oktabr 2026". */
export const bucketName = ({ start, size }: Bucket, lang: Lang) =>
  size === 'hour'
    ? `${formatDate(start)}, ${String(start.getHours()).padStart(2, '0')}:00`
    : size === 'day'
      ? formatDate(start)
      : `${MONTHS[lang][start.getMonth()]} ${start.getFullYear()}`

/** A bar's label under the axis, or '' when it is skipped to leave room. */
export function bucketTick(
  { start, size }: Bucket,
  i: number,
  count: number,
  lang: Lang,
  now: Date,
) {
  if (size === 'hour') return i % 3 === 0 ? String(start.getHours()).padStart(2, '0') : ''
  if (size === 'month') return count > 14 && i % 2 ? '' : MONTHS[lang][start.getMonth()].slice(0, 3)
  if (count <= 7) return `${WEEKDAYS[lang][(start.getDay() + 6) % 7]} ${start.getDate()}`
  const day = start.getDate()
  return i === 0 || day === 1 || day % 5 === 0 || sameDay(start, now) ? String(day) : ''
}

/**
 * The period just before, to compare with; none for all time. While the period is still
 * running (this month, today) only the same stretch of the previous one counts, e.g. 1–18
 * October against 1–18 September, so a half-finished month is not set against a whole one.
 */
export function previousOf(
  period: Period,
  now: Date,
): { range: DateRange; partial: boolean } | null {
  if (period.unit === 'all') return null
  if (period.unit === 'range') {
    const { from, to } = period.range
    if (!from || !to) return null
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
    return { range: { from: addDays(from, -days), to: addDays(from, -1) }, partial: false }
  }
  const current = boundsOf(period)
  const before = boundsOf(shiftPeriod(period, -1))
  const running = current.from! <= now && now < addDays(current.to!, 1)
  if (!running) return { range: before, partial: false }
  // As many days from the start of the previous period as have begun in this one
  const days = Math.round((startOfDay(now).getTime() - current.from!.getTime()) / 86_400_000)
  return { range: { from: before.from, to: addDays(before.from!, days) }, partial: true }
}

/** Change from `before` to `now` in percent, or null when there is nothing to compare with. */
export const changeOf = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 100) : null
