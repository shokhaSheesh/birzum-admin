import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { controlClass } from './control'
import { Field } from './Field'

type Props<T extends string> = {
  label: string
  options: { value: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (value: T) => void
  hint?: string
  error?: string
  disabled?: boolean
}

/** Pick one of many options from a native dropdown, in the same box as a text field. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  disabled,
}: Props<T>) {
  const id = useId()

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div className={controlClass(!!error, 'relative')}>
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-full w-full cursor-pointer appearance-none bg-transparent pr-8 text-base outline-none disabled:cursor-default disabled:text-ink-muted"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={20}
          className="pointer-events-none absolute right-4 text-ink-muted"
          aria-hidden
        />
      </div>
    </Field>
  )
}
