import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

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
  /** Object URL of the cover; none shows the brand colour. */
  image?: string
  text: LocalizedText
  visible: boolean
}

const slots = (brand: Brand): MenuSlot[] => {
  const slot = (
    place: MenuSlot['place'],
    key: MenuSlot['key'],
    uz: string,
    ru: string,
    visible = true,
    locked = false,
  ): MenuSlot => ({
    id: `${brand}-${place}-${key}`,
    brand,
    place,
    key,
    label: { uz, ru },
    visible,
    locked,
  })
  return [
    // The order from the client's sheet: Kreditlar, Toʻlov, Kartalar, Yordam
    slot('action', 'credits', 'Kreditlar', 'Кредиты'),
    slot('action', 'pay', 'Toʻlov', 'Оплата'),
    slot('action', 'cards', 'Kartalar', 'Карты'),
    slot('action', 'support', 'Yordam', 'Помощь'),
    slot('action', 'schedule', 'Jadval', 'График', false),
    slot('action', 'applications', 'Arizalarim', 'Мои заявки', false),
    slot('tab', 'home', 'Asosiy', 'Главная', true, true),
    slot('tab', 'loans', 'Qarzlarim', 'Мои займы'),
    slot('tab', 'apply', 'Qarz olish', 'Взять заём', true, true),
    slot('tab', 'payments', 'Monitoring', 'Мониторинг'),
    slot('tab', 'profile', 'Profil', 'Профиль', true, true),
  ]
}

// What the apps ship with. Replace with the API.
export const menuSlotsStore = createStore<MenuSlot>([...slots('fortuna'), ...slots('vodiy')])

export const infoTilesStore = createStore<InfoTile>([
  {
    id: 't1',
    brand: 'fortuna',
    title: { uz: 'Rivoj haqida', ru: 'О Rivoj' },
    text: {
      uz: 'Tadbirkorlar uchun garovsiz 50 mln soʻmgacha.',
      ru: 'Для предпринимателей, без залога, до 50 млн сумов.',
    },
    visible: true,
  },
  {
    id: 't2',
    brand: 'fortuna',
    title: { uz: 'Filiallar', ru: 'Филиалы' },
    text: { uz: '8 ta viloyatda filiallarimiz bor.', ru: 'Наши филиалы в 8 регионах.' },
    visible: true,
  },
  {
    id: 't3',
    brand: 'vodiy',
    title: { uz: 'Zar', ru: 'Zar' },
    text: {
      uz: 'Har qanday maqsadga, kafil va garovsiz.',
      ru: 'На любые цели, без поручителя и залога.',
    },
    visible: true,
  },
])
