import { useEffect, type ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { Button } from './Button'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Label of the red button, e.g. "Oʻchirish". */
  confirmLabel: string
  onConfirm: () => void
}

/** Asks before something that cannot be undone. Every delete in the admin goes through this. */
export function ConfirmDialog({ open, onClose, title, children, confirmLabel, onConfirm }: Props) {
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
        role="alertdialog"
        aria-modal
        aria-labelledby="confirm-title"
        className="relative flex w-full max-w-md flex-col gap-4 rounded-card bg-canvas p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        <div className="flex flex-col gap-2 text-ink-muted">{children}</div>
        <div className="flex justify-end gap-2 pt-2">
          <Button size="sm" variant="ghost" className="px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" variant="danger" className="px-4!" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
