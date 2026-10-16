import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/shared/lib/toast'

/** Draws the current toast. Mounted once, in the device layout, above every screen and sheet. */
export function Toaster() {
  const current = useToast()
  if (!current) return null
  const Icon = current.tone === 'error' ? CircleAlert : CircleCheck

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex justify-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <p
        key={current.id}
        role="status"
        className={cn(
          'toast flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_-8px_rgb(7_42_60/0.45)]',
          current.tone === 'error' ? 'bg-danger text-white' : 'bg-navy-950 text-white',
        )}
      >
        <Icon
          size={18}
          className={cn('shrink-0', current.tone === 'success' && 'text-green-500')}
        />
        <span className="min-w-0 truncate">{current.message}</span>
      </p>
    </div>
  )
}
