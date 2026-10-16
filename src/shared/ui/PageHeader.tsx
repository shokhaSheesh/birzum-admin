import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  /** Buttons at the right, e.g. "+ Qoʻshish". */
  actions?: ReactNode
}

/** The top of every admin page: title, one line about it, and the page's actions on the right. */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-bold text-balance">{title}</h1>
        {description && <p className="max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
