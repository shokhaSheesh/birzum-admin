import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { ProductStatus } from './products'

export const productStatusTone: Record<ProductStatus, StatusTone> = {
  review: 'warning',
  selling: 'success',
  soldOut: 'warning',
  hidden: 'neutral',
  rejected: 'danger',
}
