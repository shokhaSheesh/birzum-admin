import type { TranslationKey } from '@/shared/i18n/dictionaries'

/** How long a check has waited, as a short phrase: "40 daqiqa", "3 soat", "2 kun". */
export function waitedFor(since: Date, now: Date): { key: TranslationKey; count: string } {
  const minutes = Math.max(1, Math.round((now.getTime() - since.getTime()) / 60_000))
  if (minutes < 60) return { key: 'check.wait.minutes', count: String(minutes) }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { key: 'check.wait.hours', count: String(hours) }
  return { key: 'check.wait.days', count: String(Math.floor(hours / 24)) }
}
