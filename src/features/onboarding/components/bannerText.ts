import { bannerState, type Banner } from '@/entities/onboarding/banners'
import type { TranslationKey } from '@/shared/i18n/dictionaries'
import type { StatusTone } from '@/shared/ui/StatusBadge'

type T = (key: TranslationKey, params?: Record<string, string>) => string

/** "Mahsulotlar · 4 ta mahsulot", or just "Yaqin doʻkonlar". */
export function targetSummary(banner: Banner, t: T) {
  const kind = t(`banners.target.${banner.target}`)
  if (banner.target === 'nearest' || banner.target === 'loanProducts') return kind
  return `${kind} · ${t(`banners.summary.${banner.target}`, { count: String(banner.ids.length) })}`
}

/** "16.10.2026 – 31.10.2026", "16.10.2026 dan", "31.10.2026 gacha" or "Muddatsiz". */
export function datesSummary(banner: Banner, t: T) {
  const { startsOn, endsOn } = banner
  if (startsOn && endsOn) return `${startsOn} – ${endsOn}`
  if (startsOn) return t('banners.dates.from', { date: startsOn })
  if (endsOn) return t('banners.dates.until', { date: endsOn })
  return t('banners.dates.always')
}

export const stateTone: Record<ReturnType<typeof bannerState>, StatusTone> = {
  live: 'success',
  scheduled: 'info',
  ended: 'neutral',
  hidden: 'neutral',
}
