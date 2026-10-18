import { useRules } from '@/entities/applications/checkRules'
import { cn } from '@/shared/lib/cn'

/**
 * The final score as a bar out of 100, with ticks where it is rejected on its own (below the
 * first) and approved on its own (from the second), as the rules stand now.
 */
export function ScoreMeter({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const rules = useRules()
  const tone =
    score >= rules.approveFrom
      ? 'bg-success'
      : score < rules.rejectBelow
        ? 'bg-danger'
        : 'bg-warning'
  return (
    <div className={cn('flex items-center gap-2', size === 'lg' && 'flex-col items-stretch gap-2')}>
      {size === 'sm' && (
        <span
          className={cn(
            'w-7 text-sm font-bold tabular-nums',
            score < rules.approveFrom && 'text-warning',
          )}
        >
          {score}
        </span>
      )}
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-surface',
          size === 'sm' ? 'h-1.5 w-20' : 'h-2.5 w-full',
        )}
      >
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${score}%` }} />
        {[rules.rejectBelow, rules.approveFrom].map((at) => (
          <span
            key={at}
            aria-hidden
            className="absolute inset-y-0 w-0.5 bg-ink-subtle"
            style={{ left: `${at}%` }}
          />
        ))}
      </div>
    </div>
  )
}
