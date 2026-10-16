import { Package } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const sizes = {
  sm: 'size-11 rounded-control',
  md: 'size-16 rounded-control',
  lg: 'size-full rounded-card',
}

/** A product's cover photo, or a box icon until the merchant adds one. */
export function ProductThumb({
  photo,
  size = 'sm',
}: {
  photo?: string
  size?: keyof typeof sizes
}) {
  if (photo)
    return (
      <img
        src={photo}
        alt=""
        className={cn('shrink-0 border border-line bg-white object-contain', sizes[size])}
      />
    )
  return (
    <span
      className={cn('grid shrink-0 place-items-center bg-surface text-ink-subtle', sizes[size])}
    >
      <Package size={size === 'lg' ? 48 : 20} />
    </span>
  )
}
