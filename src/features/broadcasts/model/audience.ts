import { inSegments, type Audience } from '@/entities/broadcasts/broadcasts'
import { clientsStore } from '@/entities/clients/clients'
import { loanClientsStore } from '@/entities/microloans/loanClients'
import { merchantsStore } from '@/entities/merchants/merchants'
import type { Workspace } from '@/shared/config/workspaces'

/**
 * Who can get a broadcast: in Birzum every shopper and every merchant that is not paused; in a
 * microloan brand everyone who signed up in its app. An audience reaches all of them, the
 * groups picked, or the people picked.
 */
export function useAudience(app: Workspace = 'birzum') {
  const clients = clientsStore.useAll()
  const merchants = merchantsStore.useAll().filter((merchant) => merchant.status !== 'paused')
  const loanClients = loanClientsStore.useAll().filter((client) => client.brand === app)
  const countOf = (audience: Audience) => {
    if (audience.kind === 'loanClients' && app !== 'birzum') {
      if (audience.all) return loanClients.length
      if (audience.segments) return inSegments(app, audience.segments).length
      return audience.ids.length
    }
    return audience.all
      ? audience.kind === 'clients'
        ? clients.length
        : merchants.length
      : audience.ids.length
  }
  return { clients, merchants, loanClients, countOf }
}
