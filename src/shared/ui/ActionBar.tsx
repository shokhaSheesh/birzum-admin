import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'

type Props = {
  /** Small line above the title, e.g. "Tahrirlash". */
  eyebrow?: string
  title: string
  /** Shows a back arrow on the left. */
  onBack?: () => void
  /** "Bekor qilish" and the primary action, at the right. */
  children: ReactNode
}

/** The bar fixed to the top of a page that saves: where you are, then its actions. */
export function ActionBar({ eyebrow, title, onBack, children }: Props) {
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-page items-center gap-3 px-4 py-3 lg:px-8">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {eyebrow && <p className="truncate text-sm text-ink-muted">{eyebrow}</p>}
          <h1 className="truncate text-lg leading-tight font-bold">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </header>
  )
}
