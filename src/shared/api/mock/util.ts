import { mockError } from './index'

/** The sample panel's admin: who the sample endpoints say did a thing. */
export const ACTOR = { id: 'demo', name: 'Namuna admin' }

export const newId = () => crypto.randomUUID()

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** An ISO time `days` and `hours` before now, for sample data that always looks recent. */
export const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * DAY - hours * HOUR).toISOString()

export const nowIso = () => new Date().toISOString()

/** Today in Tashkent (UTC+5) as YYYY-MM-DD. */
export const todayTashkent = () => new Date(Date.now() + 5 * HOUR).toISOString().slice(0, 10)

export const notFound = () => mockError(404, 'not_found', 'Not found')
export const invalid = (details?: Record<string, string>) =>
  Object.assign(mockError(400, 'validation_failed', 'Validation failed'), { details })

/** `page` and `limit` from a query (limit 1..100, default 20) and the slice they select. */
export function paged<T>(items: T[], query: Record<string, string>) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit }
}

/** Case-insensitive "contains" over several fields. */
export const matches = (query: string | undefined, ...fields: (string | undefined)[]) => {
  if (!query) return true
  const needle = query.toLowerCase()
  return fields.some((field) => field?.toLowerCase().includes(needle))
}

export type Text = { uz: string; ru: string }
export const text = (uz: string, ru: string): Text => ({ uz, ru })

export const isText = (value: unknown): value is Text =>
  !!value &&
  typeof (value as Text).uz === 'string' &&
  typeof (value as Text).ru === 'string' &&
  !!(value as Text).uz.trim() &&
  !!(value as Text).ru.trim()

export const asBody = (body: unknown) => (body ?? {}) as Record<string, any>
