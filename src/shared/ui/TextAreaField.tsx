import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { controlClass } from './control'
import { Field } from './Field'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  label: string
  error?: string
  hint?: string
  labelEnd?: ReactNode
}

/** Several lines of text, in the same box as every other control. */
export function TextAreaField({ label, error, hint, labelEnd, rows = 4, ...rest }: Props) {
  const id = useId()

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} labelEnd={labelEnd}>
      <div className={controlClass(!!error, 'h-auto! py-3')}>
        <textarea
          id={id}
          rows={rows}
          aria-invalid={!!error || undefined}
          className="min-w-0 flex-1 resize-none bg-transparent text-base outline-none placeholder:text-ink-subtle"
          {...rest}
        />
      </div>
    </Field>
  )
}
