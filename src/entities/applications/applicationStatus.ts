import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { ApplicationStatus } from './applications'

export const applicationStatusTone: Record<ApplicationStatus, StatusTone> = {
  checking: 'info',
  pending: 'warning',
  processing: 'info',
  handed: 'success',
  closed: 'neutral',
  rejected: 'danger',
  cancelled: 'neutral',
}
