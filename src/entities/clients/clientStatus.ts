import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { ClientStatus } from './debt'

export const clientStatusTone: Record<ClientStatus, StatusTone> = {
  running: 'success',
  overdue: 'danger',
  blocked: 'neutral',
  idle: 'info',
}
