import { PASS_SCORE } from '@/entities/applications/checks'
import { cn } from '@/shared/lib/cn'

/** The scoring result as a bar out of 100, with a tick where it passes on its own. */
export function ScoreMeter({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const pass = score >= PASS_SCORE
  return (
    <div className={cn('flex items-center gap-2', size === 'lg' && 'flex-col items-stretch gap-2')}>
      {size === 'sm' && (
        <span className={cn('w-7 text-sm font-bold tabular-nums', !pass && 'text-warning')}>
          {score}
        </span>
      )}
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-surface',
          size === 'sm' ? 'h-1.5 w-20' : 'h-2.5 w-full',
        )}
      >
        <div
          className={cn('h-full rounded-full', pass ? 'bg-success' : 'bg-warning')}
          style={{ width: `${score}%` }}
        />
        <span
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-ink-subtle"
          style={{ left: `${PASS_SCORE}%` }}
        />
      </div>
    </div>
  )
}
