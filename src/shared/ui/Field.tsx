import type { ReactNode } from 'react'

type Props = {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  /** Sits at the right of the label, e.g. a language toggle. */
  labelEnd?: ReactNode
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, labelEnd, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink-muted">
          {label}
        </label>
        {labelEnd}
      </div>
      {children}
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
