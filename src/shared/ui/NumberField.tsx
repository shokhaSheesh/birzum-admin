import { useId } from 'react'
import { groupDigits } from '@/shared/lib/format'
import { controlClass, inputClass } from './control'
import { Field } from './Field'

type Props = {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  /** Unit shown at the right edge, e.g. "UZS" or "oy". */
  suffix?: string
  placeholder?: string
  error?: string
  hint?: string
  maxDigits?: number
}

/** Whole numbers only, grouped in thousands as the user types. */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder = '0',
  error,
  hint,
  maxDigits = 12,
}: Props) {
  const id = useId()

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className={controlClass(!!error)}>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={!!error || undefined}
          className={inputClass}
          value={value === null ? '' : groupDigits(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, maxDigits)
            onChange(digits === '' ? null : Number(digits))
          }}
        />
        {suffix && <span className="text-ink-muted">{suffix}</span>}
      </div>
    </Field>
  )
}
