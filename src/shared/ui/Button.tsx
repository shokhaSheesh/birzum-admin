import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary active:bg-primary-pressed',
  secondary: 'bg-surface text-brand active:bg-navy-100',
  ghost: 'bg-transparent text-brand active:bg-surface',
  danger: 'bg-danger text-on-primary active:opacity-90',
}

const sizes: Record<Size, string> = {
  md: 'h-13 rounded-control px-5 text-base',
  sm: 'h-10 rounded-full pr-4 pl-3 text-sm',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  /** `sm` is only for the create action in a list screen header. */
  size?: Size
  block?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'flex shrink-0 items-center justify-center gap-2 font-semibold transition-colors',
        sizes[size],
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600',
        'disabled:opacity-45',
        variants[variant],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <LoaderCircle size={size === 'sm' ? 18 : 20} className="animate-spin" aria-hidden />
      )}
      {children}
    </button>
  )
}
