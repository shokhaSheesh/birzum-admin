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
  hint?: string
  /** Said instead of the change when there is nothing to compare with. */
  noCompare?: string
}

/**
 * A dashboard figure: label, the value, its change against the previous period (green when
 * it went the good way, red when not, with an arrow so colour is not the only cue).
 */
export function KpiTile({
  label,
  value,
  change,
  changeLabel,
  upIsGood = true,
  hint,
  noCompare,
}: Props) {
  const good = change === null || change === 0 ? null : change > 0 === upIsGood
  const Arrow = change !== null && change < 0 ? ArrowDownRight : ArrowUpRight
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-sm text-ink-muted">{label}</p>
          <p className="truncate text-2xl font-bold [font-variant-numeric:normal]">{value}</p>
        </div>
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
