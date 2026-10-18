import { addDays, startOfDay, type DateRange } from './dates'

export const PERIOD_UNITS = ['day', 'week', 'month', 'year', 'range', 'all'] as const
export type PeriodUnit = (typeof PERIOD_UNITS)[number]

/**
 * A page-wide period: a day, week (Monday first), month or year around `anchor`, a picked
 * range, or all time.
 */
export type Period = { unit: PeriodUnit; anchor: Date; range: DateRange }

export const thisMonth = (today: Date): Period => ({
  unit: 'month',
  anchor: startOfDay(today),
  range: { from: null, to: null },
})

const mondayOf = (date: Date) => addDays(date, -((date.getDay() + 6) % 7))

/** The period's first and last day (both included); null ends mean open. */
export function boundsOf(period: Period): DateRange {
  const a = period.anchor
  switch (period.unit) {
    case 'day':
      return { from: a, to: a }
    case 'week':
      return { from: mondayOf(a), to: addDays(mondayOf(a), 6) }
    case 'month':
      return {
        from: new Date(a.getFullYear(), a.getMonth(), 1),
        to: new Date(a.getFullYear(), a.getMonth() + 1, 0),
      }
    case 'year':
      return { from: new Date(a.getFullYear(), 0, 1), to: new Date(a.getFullYear(), 11, 31) }
    case 'range':
      return period.range
    case 'all':
      return { from: null, to: null }
  }
}

/** The same kind of period, `by` steps earlier or later. */
export function shiftPeriod(period: Period, by: number): Period {
  const a = period.anchor
  const anchor =
    period.unit === 'day'
      ? addDays(a, by)
      : period.unit === 'week'
        ? addDays(a, by * 7)
        : period.unit === 'month'
          ? new Date(a.getFullYear(), a.getMonth() + by, 1)
          : period.unit === 'year'
            ? new Date(a.getFullYear() + by, 0, 1)
            : a
  return { ...period, anchor }
}

/** One bar of a chart over the period: [start, end). */
export type Bucket = { start: Date; end: Date; size: 'hour' | 'day' | 'month' }

/**
 * Bars for a chart over the period: hours for a day, days for a week, month or a short range,
 * months for a year, a long range or all time (`first` and `last` bound the open ends).
 */
export function bucketsOf(period: Period, first: Date, last: Date): Bucket[] {
  const bounds = boundsOf(period)
  const from = startOfDay(bounds.from ?? first)
  const to = startOfDay(bounds.to ?? last)
  if (period.unit === 'day')
    return Array.from({ length: 24 }, (_, h) => ({
      start: new Date(from.getTime() + h * 3_600_000),
      end: new Date(from.getTime() + (h + 1) * 3_600_000),
      size: 'hour',
    }))
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
  if (period.unit !== 'year' && period.unit !== 'all' && days <= 62)
    return Array.from({ length: days }, (_, i) => ({
      start: addDays(from, i),
      end: addDays(from, i + 1),
      size: 'day',
    }))
  const out: Bucket[] = []
  for (
    let m = new Date(from.getFullYear(), from.getMonth(), 1);
    m <= to;
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  )
    out.push({ start: m, end: new Date(m.getFullYear(), m.getMonth() + 1, 1), size: 'month' })
  return out
}
