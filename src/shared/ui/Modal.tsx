import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** Small line above the title, e.g. "Kategoriya". */
  eyebrow?: string
  children: ReactNode
  /** Buttons pinned to the bottom: delete on the left, cancel and save on the right. */
  footer: ReactNode
}

/**
 * A centred dialog for creating or editing a small record (a category, a brand) without leaving
 * the list. Big records (a merchant) get their own page instead.
 */
export function Modal({ open, onClose, title, eyebrow, children, footer }: Props) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy-950/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className="modal relative flex max-h-[min(720px,calc(100dvh-2rem))] w-full max-w-lg flex-col rounded-card bg-canvas shadow-xl"
      >
        <header className="flex items-start gap-3 border-b border-line px-6 py-4">
          <div className="flex min-w-0 flex-1 flex-col">
            {eyebrow && <p className="text-sm text-ink-muted">{eyebrow}</p>}
            <h2 id="modal-title" className="truncate text-lg font-bold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {children}
        </div>
        <footer className="flex items-center gap-2 border-t border-line px-6 py-4">{footer}</footer>
      </div>
    </div>
  )
}
