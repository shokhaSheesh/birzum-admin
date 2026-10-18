import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { dismissToast, useToasts } from '@/shared/lib/toast'

/**
 * The toasts, in the top right corner, oldest on top and each new one below it. Mounted once,
 * in the admin layout, above pages and modals.
 */
export function Toaster() {
  const { t } = useI18n()
  const toasts = useToasts()
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 left-4 z-[70] flex flex-col items-end gap-2 sm:left-auto"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const Icon = item.tone === 'error' ? CircleAlert : CircleCheck
        return (
          <div
            key={item.id}
            role="status"
            className="toast pointer-events-auto flex w-full items-start gap-3 rounded-control border border-line bg-canvas py-3 pr-2 pl-4 text-sm font-semibold shadow-xl sm:w-96"
          >
            <Icon
              size={20}
              className={cn(
                'mt-px shrink-0',
                item.tone === 'error' ? 'text-danger' : 'text-success',
              )}
            />
            <span className="min-w-0 flex-1 py-px">{item.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              aria-label={t('common.close')}
              className="-my-1 grid size-7 shrink-0 place-items-center rounded-full text-ink-subtle hover:bg-surface hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
