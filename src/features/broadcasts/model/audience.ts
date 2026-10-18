import type { Audience } from '@/entities/broadcasts/broadcasts'
import { clientsStore } from '@/entities/clients/clients'
import { merchantsStore } from '@/entities/merchants/merchants'

/**
 * Who can get a broadcast: every shopper, and every merchant that is not paused. An audience
 * reaches all of them or the ones picked.
 */
export function useAudience() {
  const clients = clientsStore.useAll()
  const merchants = merchantsStore.useAll().filter((merchant) => merchant.status !== 'paused')
  const countOf = (audience: Audience) =>
    audience.all
      ? audience.kind === 'clients'
        ? clients.length
        : merchants.length
      : audience.ids.length
  return { clients, merchants, countOf }
}
