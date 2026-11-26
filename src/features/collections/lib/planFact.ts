/** Months of the plan / fakt table. */
export const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
export const nextMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 1)

/** The table's months: the period's, but none before `first` (the first hand-over or pay-out). */
export function monthsOf(bounds: { from: Date | null; to: Date | null }, first: Date, today: Date) {
  const from = monthStart(bounds.from && bounds.from > first ? bounds.from : first)
  const to = monthStart(bounds.to ?? today)
  const out: Date[] = []
  for (let m = from; m <= to; m = nextMonth(m)) out.push(m)
  return out
}
