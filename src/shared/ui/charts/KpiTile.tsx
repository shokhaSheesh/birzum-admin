import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type Props = {
  label: string
  value: string
  /** Percent change against the period before; null when there is nothing to compare with. */
  change: number | null
  /** e.g. "oʻtgan oyga nisbatan". */
  changeLabel: string
  /** Whether a rise is good news (sales) or bad (overdue). */
  upIsGood?: boolean
  /** The value over the period, one point per bar of the page's chart. */
  trend: number[]
  hint?: string
  /** Said instead of the change when there is nothing to compare with. */
  noCompare?: string
}

/**
 * A dashboard figure: label, the value, its change against the previous period (green when
 * it went the good way, red when not, with an arrow so colour is not the only cue) and a small
 * trend line in a quiet colour with the latest point in the accent.
 */
export function KpiTile({
  label,
  value,
  change,
  changeLabel,
  upIsGood = true,
  trend,
  hint,
  noCompare,
}: Props) {
  const good = change === null || change === 0 ? null : change > 0 === upIsGood
  const Arrow = change !== null && change < 0 ? ArrowDownRight : ArrowUpRight
  const max = Math.max(1, ...trend)
  const step = trend.length > 1 ? 100 / (trend.length - 1) : 0
  const points = trend.map((v, i) => `${i * step},${30 - (v / max) * 28}`).join(' ')
  const lastIndex = trend.length - 1

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-sm text-ink-muted">{label}</p>
          <p className="truncate text-2xl font-bold [font-variant-numeric:normal]">{value}</p>
        </div>
        {trend.length > 1 && (
          <svg viewBox="-3 -3 106 36" className="h-9 w-24 shrink-0 overflow-visible" aria-hidden>
            <polyline
              points={points}
              fill="none"
              stroke="var(--color-navy-400)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={lastIndex * step}
              cy={30 - (trend[lastIndex] / max) * 28}
              r={3}
              fill="var(--color-green-600)"
              stroke="var(--color-canvas)"
              strokeWidth={1.5}
            />
          </svg>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        {change === null ? (
          <span className="truncate text-ink-subtle">{noCompare ?? hint ?? '—'}</span>
        ) : (
          <>
            <span
              className={cn(
                'flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                good === null
                  ? 'bg-navy-100 text-ink-muted'
                  : good
                    ? 'bg-success-soft text-success'
                    : 'bg-danger-soft text-danger',
              )}
            >
              {change !== 0 && <Arrow size={14} />}
              {change > 0 ? '+' : ''}
              {change}%
            </span>
            <span className="truncate text-ink-subtle">{hint ?? changeLabel}</span>
          </>
        )}
      </div>
    </div>
  )
}
