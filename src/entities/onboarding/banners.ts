import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'
import { parseDate } from '@/shared/lib/dates'

/** What a banner opens when a shopper taps it. One kind per banner. */
export const BANNER_TARGETS = ['products', 'categories', 'merchants', 'nearest'] as const
export type BannerTargetKind = (typeof BANNER_TARGETS)[number]

/**
 * A banner in the carousel on Birzum's Bosh sahifa. The admin uploads a picture per language,
 * with the text inside it, and picks where it leads: several products, several categories,
 * several shops, or the shops nearest to the shopper (the backend finds those, so `ids` stays
 * empty). The banners the app ships with have no picture and are drawn by the app (`builtIn`).
 */
export type Banner = {
  id: string
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
): Banner => ({ id, title, builtIn: true, target, ids, visible: true, startsOn: '', endsOn: '' })

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
])
