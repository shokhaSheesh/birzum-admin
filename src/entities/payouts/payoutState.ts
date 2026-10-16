import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { PayoutState } from './payouts'

export const payoutStateTone: Record<PayoutState, StatusTone> = {
  processing: 'warning',
  paid: 'success',
}
