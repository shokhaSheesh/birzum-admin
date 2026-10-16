import { cn } from '@/shared/lib/cn'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Read by screen readers; the switch has no visible label of its own. */
  label: string
}

/** An on/off toggle for a table row, e.g. whether a term is offered. */
export function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600',
        checked ? 'bg-primary' : 'bg-navy-200',
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
