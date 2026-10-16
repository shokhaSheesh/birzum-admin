import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { controlClass, inputClass } from './control'
import { Field } from './Field'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  error?: string
  hint?: string
  trailing?: ReactNode
  labelEnd?: ReactNode
}

export function TextField({ label, error, hint, trailing, labelEnd, id, ...rest }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} labelEnd={labelEnd}>
      <div className={controlClass(!!error)}>
        <input id={inputId} aria-invalid={!!error || undefined} className={inputClass} {...rest} />
        {trailing}
      </div>
    </Field>
  )
}
