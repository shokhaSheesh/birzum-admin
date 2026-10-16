import { brandInitials, type Brand } from '@/entities/catalog/brands'
import { cn } from '@/shared/lib/cn'

const sizes = { sm: 'size-11 rounded-control text-sm', lg: 'size-20 rounded-card text-xl' }

/** A brand's logo, or its initials when it has none yet. */
export function BrandLogo({
  brand,
  size = 'sm',
}: {
  brand: Pick<Brand, 'name' | 'logo'>
  size?: 'sm' | 'lg'
}) {
  if (brand.logo)
    return (
      <img
        src={brand.logo}
        alt=""
        className={cn('shrink-0 border border-line bg-white object-contain p-1', sizes[size])}
      />
    )
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center border border-line bg-canvas font-bold text-ink-muted',
        sizes[size],
      )}
    >
      {brandInitials(brand.name) || '?'}
    </span>
  )
}
