import { useId } from 'react'
import { formatPhoneDigits, PHONE_DIGITS, PHONE_PREFIX } from '@/shared/lib/phone'
import { controlClass, inputClass } from './control'
import { Field } from './Field'

type Props = {
  label: string
  /** The nine digits after +998, without spaces. */
  value: string
  onChange: (digits: string) => void
  error?: string
  hint?: string
  autoFocus?: boolean
}

export function PhoneField({ label, value, onChange, error, hint, autoFocus }: Props) {
  const id = useId()

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className={controlClass(!!error)}>
        <span className="font-medium text-ink-muted">{PHONE_PREFIX}</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          placeholder="00 000 00 00"
          aria-invalid={!!error || undefined}
          className={inputClass}
          value={formatPhoneDigits(value)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, PHONE_DIGITS))}
        />
      </div>
    </Field>
  )
}
