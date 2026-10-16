import { Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'

type Props = {
  /** May hold links, e.g. to the documents being agreed to. */
  label: ReactNode
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  error?: string
}

export function Checkbox({ label, description, checked, onChange, disabled, error }: Props) {
  const id = useId()

  const box = (
    <label htmlFor={id} className="relative flex cursor-pointer items-start gap-3 py-1">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={!!error || undefined}
        className="peer sr-only"
      />
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-[1.5px] border-navy-400 text-transparent peer-aria-invalid:border-danger transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-3 peer-focus-visible:ring-green-200 peer-disabled:opacity-45">
        <Check size={16} strokeWidth={3} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 peer-disabled:opacity-45">
        <span className="text-base font-medium">{label}</span>
        {description && <span className="text-sm text-ink-muted">{description}</span>}
      </span>
    </label>
  )
  if (!error) return box
  return (
    <div className="flex flex-col gap-1">
      {box}
      <p role="alert" className="pl-9 text-sm text-danger">
        {error}
      </p>
    </div>
  )
}
