import { cn } from '@/shared/lib/cn'

/** The one box every form control sits in: text, password, number, dropdown and date. */
export function controlClass(invalid?: boolean, className?: string) {
  return cn(
    'flex h-13 w-full items-center gap-2 rounded-control border-[1.5px] bg-canvas px-4 text-left text-base text-ink transition-colors',
    'focus-within:border-primary focus-within:ring-3 focus-within:ring-green-200',
    'focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-green-200 focus-visible:outline-none',
    invalid ? 'border-danger' : 'border-line',
    className,
  )
}

export const inputClass =
  'min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-subtle'
