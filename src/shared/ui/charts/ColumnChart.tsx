import { useState } from 'react'
import { cn } from '@/shared/lib/cn'

export type Column = { key: string; label: string; value: number; tip: string }

/**
 * A few labelled columns, e.g. arizalar per term: thin columns (24px at most) from one
 * baseline, the count on each cap, the full figure on hover or focus.
 */
export function ColumnChart({
  columns,
  hideValues,
}: {
  columns: Column[]
  /** Leaves the caps bare when there are too many columns to label; hover still shows each. */
  hideValues?: boolean
}) {
  const [active, setActive] = useState<string | null>(null)
  const max = Math.max(1, ...columns.map((column) => column.value))
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-44 items-end border-b border-line"
        onMouseLeave={() => setActive(null)}
      >
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            aria-label={column.tip}
            onMouseEnter={() => setActive(column.key)}
            onFocus={() => setActive(column.key)}
            onBlur={() => setActive(null)}
            className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 focus-visible:outline-none"
          >
            <span className="text-xs font-semibold tabular-nums">
              {hideValues && active !== column.key ? '' : column.value || ''}
            </span>
            <span
              className={cn(
                'w-full max-w-6 rounded-t-[4px] transition-colors',
                active === column.key ? 'bg-primary-pressed' : 'bg-brand',
              )}
              style={{ height: column.value ? `max(3px, ${(column.value / max) * 82}%)` : 0 }}
            />
            {active === column.key && (
              <span className="pointer-events-none absolute bottom-full z-10 mb-1 rounded-control border border-line bg-canvas px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[0_8px_24px_-8px_rgb(7_42_60/0.35)]">
                {column.tip}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex text-xs text-ink-subtle">
        {columns.map((column) => (
          <span key={column.key} className="min-w-0 flex-1 truncate text-center">
            {column.label}
          </span>
        ))}
      </div>
    </div>
  )
}
