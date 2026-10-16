import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/shared/lib/cn'

export type Choice<T extends string | number> = {
  value: T
  label: string
  description?: string
  icon?: LucideIcon
}

type Props<T extends string | number> = {
  label: string
  options: Choice<T>[]
  value: T | null
  onChange: (value: T) => void
  columns: 2 | 3 | 5 | 6
  error?: string
  hint?: string
}

const grids = { 2: 'grid-cols-2', 3: 'grid-cols-3', 5: 'grid-cols-5', 6: 'grid-cols-6' }

/**
 * Pick one of a few short options that should all stay visible, such as a payment day. The
 * chosen one is marked the light way: a navy border on pale green, never a solid navy block.
 */
export function ChoiceGrid<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
  error,
  hint,
}: Props<T>) {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <p id={labelId} className="text-sm font-medium text-ink-muted">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className={cn('grid gap-2', grids[columns])}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex min-h-13 min-w-0 flex-col items-center justify-center rounded-control border-[1.5px] px-1 py-1.5 text-center transition-colors',
                'focus-visible:ring-3 focus-visible:ring-green-200 focus-visible:outline-none',
                selected
                  ? 'border-primary bg-green-200'
                  : 'border-line bg-canvas text-ink-muted active:bg-surface',
              )}
            >
              {option.icon && <option.icon size={22} className="mb-1 text-brand" />}
              <span className={cn('font-semibold', selected && 'text-ink')}>{option.label}</span>
              {option.description && (
                <span className="text-xs text-ink-muted">{option.description}</span>
              )}
            </button>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-ink-subtle">{hint}</p>
      )}
    </div>
  )
}
