import type { ReactNode } from 'react'

export type BarItem = {
  key: string
  label: string
  /** A logo or picture before the name. */
  leading?: ReactNode
  value: number
  /** The value as written at the bar's end, e.g. "12,5 mln". */
  valueLabel: string
  /** A quieter line under the name, e.g. "14 ta ariza". */
  sub?: string
}

/**
 * Ranked horizontal bars: name and value above a thin bar whose length is its share of the
 * largest. One colour, so the order and the numbers do the talking.
 */
export function BarList({ items, empty }: { items: BarItem[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (items.length === 0) return <p className="py-6 text-center text-sm text-ink-subtle">{empty}</p>
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-3">
          {item.leading}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 font-semibold tabular-nums">{item.valueLabel}</span>
            </div>
            <div className="h-2 rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
              />
            </div>
            {item.sub && <span className="text-xs text-ink-subtle">{item.sub}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}
