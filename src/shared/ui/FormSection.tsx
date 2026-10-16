import type { ReactNode } from 'react'

type Props = { title: string; hint?: string; children: ReactNode }

/** One card of a long admin form: a title and a line about it, then its fields. */
export function FormSection({ title, hint, children }: Props) {
  return (
    <section className="flex flex-col gap-5 rounded-card border border-line bg-canvas p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
