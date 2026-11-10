import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'

/**
 * One button of the app's menu: a quick action on Asosiy or a tab of the tab bar. The set is
 * fixed by the app; the admin changes the order, the label and whether it shows. `locked`: it
 * always shows (Asosiy, the centre «Qarz olish», Profil).
 */
export type MenuSlot = {
  id: string
  brand: Brand
  place: 'action' | 'tab'
  key: 'credits' | 'pay' | 'cards' | 'support' | 'schedule' | 'applications' | TabKey
  label: LocalizedText
  visible: boolean
  locked?: boolean
}
type TabKey = 'home' | 'loans' | 'apply' | 'payments' | 'profile'

/** A small tile at the top of Asosiy, like a story: a cover, a title, and what opens. */
export type InfoTile = {
  id: string
  brand: Brand
  title: LocalizedText
  /** URL of the uploaded cover; none shows the brand colour. */
  image?: string
  text: LocalizedText
  visible: boolean
}
