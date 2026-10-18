import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type Props<T extends string> = {
  /** Read by screen readers. */
  label: string
  options: { value: T; label: string; icon: LucideIcon }[]
  value: T
  onChange: (value: T) => void
}

/** Switches a table between two ways of showing the same records, e.g. a tree and a list. */
export function ViewToggle<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full bg-surface p-1">
      {options.map(({ value: option, label: text, icon: Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          onClick={() => onChange(option)}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors',
            option === value ? 'bg-raised text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
          )}
        >
          <Icon size={16} />
          {text}
        </button>
      ))}
    </div>
  )
}
