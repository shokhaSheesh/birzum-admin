import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { MerchantStatus } from './merchants'

export const merchantStatusTone: Record<MerchantStatus, StatusTone> = {
  active: 'success',
  onboarding: 'warning',
  paused: 'neutral',
}
