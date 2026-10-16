import { cn } from '@/shared/lib/cn'
import { initialsOf, type Merchant } from '../merchants'

type Props = { merchant: Pick<Merchant, 'name' | 'logo'>; size?: 'sm' | 'md' | 'lg' }

const sizes = {
  sm: 'size-9 rounded-lg text-xs',
  md: 'size-11 rounded-control text-sm',
  lg: 'size-20 rounded-card text-xl',
}

/** A merchant's square logo, or its initials on navy when it has none. */
export function MerchantLogo({ merchant, size = 'md' }: Props) {
  if (merchant.logo) {
    return (
      <img
        src={merchant.logo}
        alt=""
        className={cn('shrink-0 border border-line bg-white object-cover', sizes[size])}
      />
    )
  }
  return (
    <span
      className={cn('grid shrink-0 place-items-center bg-tile font-bold text-on-tile', sizes[size])}
    >
      {initialsOf(merchant.name) || '?'}
    </span>
  )
}
