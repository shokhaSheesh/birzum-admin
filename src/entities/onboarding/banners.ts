import type { AppId } from '@/entities/onboarding/slides'
import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'
import { parseDate } from '@/shared/lib/dates'

/**
 * What a banner opens when tapped. One kind per banner. Birzum's lead to products, categories,
 * shops or the nearest shops; a microloan app's to its loan products (one opens its calculator,
 * several open Kreditlar with just those).
 */
export const BANNER_TARGETS = [
  'products',
  'categories',
  'merchants',
  'nearest',
  'loanProducts',
] as const
export type BannerTargetKind = (typeof BANNER_TARGETS)[number]

export const targetsFor = (app: AppId): BannerTargetKind[] =>
  app === 'birzum' ? ['products', 'categories', 'merchants', 'nearest'] : ['loanProducts']

/**
 * A banner in the carousel on an app's home screen (Birzum's Bosh sahifa, a microloan app's
 * Asosiy). The admin uploads a picture per language,
 * with the text inside it, and picks where it leads: several products, several categories,
 * several shops, or the shops nearest to the shopper (the backend finds those, so `ids` stays
 * empty). The banners the app ships with have no picture and are drawn by the app (`builtIn`).
 */
export type Banner = {
  id: string
  app: AppId
  /** The banner's name in this list, also read out by screen readers in the app. */
  title: LocalizedText
  image?: Partial<Record<Lang, string>>
  builtIn?: boolean
  target: BannerTargetKind
  ids: string[]
  visible: boolean
  /** "16.10.2026", or empty for no limit. Both days are included. */
  startsOn: string
  endsOn: string
}

/** Where a banner stands today: hidden by its switch, waiting for its start, over, or live. */
export type BannerState = 'hidden' | 'scheduled' | 'ended' | 'live'

export function bannerState(banner: Banner, today = new Date()): BannerState {
  if (!banner.visible) return 'hidden'
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const from = parseDate(banner.startsOn)
  const to = parseDate(banner.endsOn)
  if (from && day < from) return 'scheduled'
  if (to && day > to) return 'ended'
  return 'live'
}

const seeded = (
  id: string,
  title: LocalizedText,
  target: BannerTargetKind,
  ids: string[] = [],
  app: AppId = 'birzum',
): Banner => ({
  id,
  app,
  title,
  builtIn: true,
  target,
  ids,
  visible: true,
  startsOn: '',
  endsOn: '',
})

/** A microloan app's seeded banner: one loan product, drawn by the app from its card. */
const loanBanner = (app: AppId, productId: string, title: LocalizedText) =>
  seeded(`${app}-${productId}`, title, 'loanProducts', [productId], app)

// The banners the client app ships with. 1 and 2 are the client's texts, 3 and 4 placeholders.
export const bannersStore = createStore<Banner>([
  seeded(
    'b1',
    { uz: 'Sizga eng yaqin doʻkondan xarid qiling', ru: 'Покупайте в ближайшем к вам магазине' },
    'nearest',
  ),
  seeded(
    'b2',
    {
      uz: 'Xaridni amalga oshiring va toʻlovni boʻlib toʻlang',
      ru: 'Совершите покупку и платите частями',
    },
    'products',
    ['p1', 'p2', 'p3', 'p4'],
  ),
  seeded(
    'b3',
    { uz: 'Telefon va noutbuklar nasiyaga', ru: 'Телефоны и ноутбуки в рассрочку' },
    'categories',
    ['phones', 'laptops'],
  ),
  seeded(
    'b4',
    {
      uz: 'Mediapark va iSpace doʻkonlaridan xarid qiling',
      ru: 'Покупайте в магазинах Mediapark и iSpace',
    },
    'merchants',
    ['m1', 'm2'],
  ),
  loanBanner('fortuna', 'rivoj', {
    uz: 'Rivoj: tadbirkorlar uchun 50 mln soʻmgacha',
    ru: 'Ривож: для предпринимателей до 50 млн сум',
  }),
  loanBanner('fortuna', 'tezkor', {
    uz: 'Tezkor: rasmiy daromadi borlar uchun, garovsiz',
    ru: 'Тезкор: при официальном доходе, без залога',
  }),
  loanBanner('fortuna', 'ishonch', {
    uz: 'Ishonch: takroriy mijozlar uchun',
    ru: 'Ишонч: для повторных клиентов',
  }),
  loanBanner('vodiy', 'zar', {
    uz: 'Zar: 100 mln soʻmgacha mikroqarz',
    ru: 'Зар: микрозайм до 100 млн сум',
  }),
  loanBanner('vodiy', 'komak', { uz: 'Koʻmak mikroqarzi', ru: 'Микрозайм Кўмак' }),
  loanBanner('vodiy', 'imkoniyat', { uz: 'Imkoniyat mikroqarzi', ru: 'Микрозайм Имконият' }),
])
