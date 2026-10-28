import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { ApplicationStatus } from './applications'

export const applicationStatusTone: Record<ApplicationStatus, StatusTone> = {
  pending: 'warning',
  creating: 'info',
  processing: 'info',
  handed: 'success',
  closed: 'neutral',
  rejected: 'danger',
  cancelled: 'neutral',
}
