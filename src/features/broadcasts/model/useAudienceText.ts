import type { Audience } from '@/entities/broadcasts/broadcasts'
import { clientsStore, fullName } from '@/entities/clients/clients'
import { loanClientsStore } from '@/entities/microloans/loanClients'
import { merchantsStore } from '@/entities/merchants/merchants'
import { useI18n } from '@/shared/i18n/useI18n'

/**
 * Who a broadcast goes to, in words, as [the app, who]: ["Klientlar", "Hammasi"],
 * ["Merchantlar", "Mediapark, iSpace"] or ["Klientlar", "6 ta klient"].
 */
export function useAudienceText() {
  const { t } = useI18n()
  const clients = clientsStore.useAll()
  const merchants = merchantsStore.useAll()
  const loanClients = loanClientsStore.useAll()
  const partsOf = (audience: Audience): [string, string] => {
    if (audience.kind === 'loanClients') {
      const app = t('nav.borrowers')
      if (audience.all) return [app, t('broadcast.audience.all')]
      const names = audience.ids.map((id) => loanClients.find((c) => c.id === id)?.name ?? id)
      return [
        app,
        names.length <= 2
          ? names.join(', ')
          : t('broadcast.audience.loanClientsN', { count: String(names.length) }),
      ]
    }
    const app = t(audience.kind === 'clients' ? 'nav.customers' : 'nav.merchants')
    if (audience.all) return [app, t('broadcast.audience.all')]
    const names = audience.ids.map((id) =>
      audience.kind === 'clients'
        ? clients.find((c) => c.id === id)
          ? fullName(clients.find((c) => c.id === id)!)
          : id
        : (merchants.find((m) => m.id === id)?.name ?? id),
    )
    return [
      app,
      names.length <= 2
        ? names.join(', ')
        : t(
            audience.kind === 'clients'
              ? 'broadcast.audience.clientsN'
              : 'broadcast.audience.merchantsN',
            {
              count: String(names.length),
            },
          ),
    ]
  }
  return Object.assign((audience: Audience) => partsOf(audience).join(' · '), { partsOf })
}
