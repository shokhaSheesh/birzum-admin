import { EmptyIllustration } from './EmptyIllustration'

type Props = {
  title: string
  hint?: string
}

/** What a list, search or section shows when it has nothing: the picture, a title and a hint. */
export function EmptyState({ title, hint }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <EmptyIllustration className="mb-2 w-52 max-w-full" />
      <p className="text-lg font-bold">{title}</p>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  )
}
