import { toast } from '@/shared/lib/toast'
import { ApiError } from './client'

const NETWORK = { uz: 'Serverga ulanib boʻlmadi', ru: 'Не удалось связаться с сервером' }

/** The text for an error: the server's own message (already in the UI language), plus the field it names. */
export function errorText(e: unknown): string {
  if (!(e instanceof ApiError)) return e instanceof Error ? e.message : String(e)
  if (e.slug === 'network') return NETWORK[document.documentElement.lang === 'ru' ? 'ru' : 'uz']
  const details = e.details
    ? Object.entries(e.details)
        .filter(([key]) => key !== 'retry_after_seconds')
        .map(([key, value]) => (key === 'reason' ? String(value) : `${key}: ${String(value)}`))
        .join('; ')
    : ''
  return details ? `${e.message} (${details})` : e.message
}

/** Shows a failed call as a red toast. */
export const toastError = (e: unknown) => toast(errorText(e), 'error')

/** True when the call failed with this slug, e.g. `login_taken`. */
export const isSlug = (e: unknown, ...slugs: string[]) =>
  e instanceof ApiError && slugs.includes(e.slug)
