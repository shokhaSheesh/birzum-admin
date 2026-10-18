import type { ReactNode } from 'react'

type Props = {
  title: string
  /** Buttons at the right, e.g. "+ Qoʻshish". */
  actions?: ReactNode
}

/** The top of every admin page: the title and the page's actions on the right. No subtitle (user). */
export function PageHeader({ title, actions }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="min-w-0 text-2xl font-bold text-balance">{title}</h1>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
