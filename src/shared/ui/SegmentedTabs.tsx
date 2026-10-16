import { cn } from '@/shared/lib/cn'

type Props<T extends string> = {
  /** Read by screen readers. */
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** Switches between two or three views of the same screen. Not a filter: use FilterChips for that. */
export function SegmentedTabs<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-control bg-surface p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-10 min-w-0 flex-1 truncate rounded-[10px] px-1.5 text-sm font-semibold transition-colors',
              selected ? 'bg-canvas text-ink' : 'text-ink-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
