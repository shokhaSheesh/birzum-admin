import { useI18n } from '@/shared/i18n/useI18n'
import { MONTHS, sameDay } from './dates'
import { formatDate } from './format'
import { boundsOf, type Period } from './period'

/** A period as words: "16.10.2026", "12.10 – 18.10.2026", "Oktabr 2026", "2026" or "Butun davr". */
export function usePeriodLabel(period: Period) {
  const { t, lang } = useI18n()
  const bounds = boundsOf(period)
  const a = period.anchor
  switch (period.unit) {
    case 'day':
      return formatDate(a)
    case 'week':
      return `${formatDate(bounds.from!).slice(0, 5)} – ${formatDate(bounds.to!)}`
    case 'month':
      return `${MONTHS[lang][a.getMonth()]} ${a.getFullYear()}`
    case 'year':
      return String(a.getFullYear())
    case 'range':
      return bounds.from && bounds.to
        ? sameDay(bounds.from, bounds.to)
          ? formatDate(bounds.from)
          : `${formatDate(bounds.from)} – ${formatDate(bounds.to)}`
        : t('period.pick')
    case 'all':
      return t('range.all')
  }
}
