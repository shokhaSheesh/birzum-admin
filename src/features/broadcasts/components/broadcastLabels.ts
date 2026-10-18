import type { Broadcast, BroadcastStatus } from '@/entities/broadcasts/broadcasts'
import type { StatusTone } from '@/shared/ui/StatusBadge'

export const broadcastStatusTone: Record<BroadcastStatus, StatusTone> = {
  sent: 'success',
  scheduled: 'info',
  draft: 'neutral',
  cancelled: 'warning',
}

/** Share of delivered ones that were opened, 0–100; null before sending or for no one. */
export const openRateOf = (broadcast: Broadcast) =>
  broadcast.stats?.delivered
    ? Math.round((broadcast.stats.opened / broadcast.stats.delivered) * 100)
    : null
