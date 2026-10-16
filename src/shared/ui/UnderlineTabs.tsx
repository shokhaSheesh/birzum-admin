import { cn } from '@/shared/lib/cn'

type Props<T extends string> = {
  /** Read by screen readers. */
  label: string
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
}

/** Filters a table by one field, as tabs over it with a count each. The chosen one is underlined. */
export function UnderlineTabs<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-6 overflow-x-auto border-b border-line"
    >
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
              '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors',
              selected
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  selected ? 'bg-primary text-on-primary' : 'bg-surface text-ink-muted',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
