import { cn } from '@/shared/lib/cn'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const tones: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-navy-200 text-brand',
  neutral: 'bg-navy-100 text-ink-muted',
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
