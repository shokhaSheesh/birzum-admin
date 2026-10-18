import type { Audience } from '@/entities/broadcasts/broadcasts'
import { merchantsStore } from '@/entities/merchants/merchants'
import { useI18n } from '@/shared/i18n/useI18n'

/** Who a broadcast goes to, in words: "Klientlar · Qarzdorlar" or "Merchantlar · Mediapark, iSpace". */
export function useAudienceText() {
  const { t } = useI18n()
  const merchants = merchantsStore.useAll()
  /** [the app, the group]: ["Klientlar", "Qarzdorlar"]. */
  const partsOf = (audience: Audience): [string, string] =>
    audience.kind === 'clients'
      ? [t('nav.customers'), t(`broadcast.segment.${audience.segment}`)]
      : [
          t('nav.merchants'),
          audience.merchantIds.length
            ? audience.merchantIds
                .map((id) => merchants.find((m) => m.id === id)?.name ?? id)
                .join(', ')
            : t('broadcast.segment.all'),
        ]
  return Object.assign((audience: Audience) => partsOf(audience).join(' · '), { partsOf })
}
