import { Shapes } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const sizes = { sm: 'size-11 rounded-control', lg: 'size-20 rounded-card' }

/** A category's square picture, or a placeholder shape when it has none yet. */
export function CategoryThumb({ image, size = 'sm' }: { image?: string; size?: 'sm' | 'lg' }) {
  if (image)
    return (
      <img
        src={image}
        alt=""
        className={cn('shrink-0 border border-line bg-white object-cover', sizes[size])}
      />
    )
  return (
    <span
      className={cn('grid shrink-0 place-items-center bg-surface text-ink-subtle', sizes[size])}
    >
      <Shapes size={size === 'lg' ? 28 : 20} />
    </span>
  )
}
