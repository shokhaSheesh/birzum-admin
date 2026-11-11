import type { AppId } from '@/entities/onboarding/slides'
import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'
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
  /** Worked out by the server (Tashkent's today); the list shows this one. */
  state?: BannerState
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
