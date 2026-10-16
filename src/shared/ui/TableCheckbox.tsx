import { Check, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type Props = {
  /** `mixed`: some of the rows under a "select all" are ticked. */
  checked: boolean | 'mixed'
  onChange: () => void
  label: string
}

/** Ticks a table row, or all of them from the header. */
export function TableCheckbox({ checked, onChange, label }: Props) {
  const on = checked !== false
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600',
        on ? 'border-primary bg-primary text-on-primary' : 'border-navy-400 bg-canvas',
      )}
    >
      {checked === 'mixed' ? (
        <Minus size={14} strokeWidth={3} />
      ) : (
        checked && <Check size={14} strokeWidth={3} />
      )}
    </button>
  )
}
