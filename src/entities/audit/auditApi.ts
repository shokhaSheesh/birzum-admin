import { apiGet } from '@/shared/api/client'
import { roleEditPath } from '@/shared/config/routes'
import { dictionaries, type TranslationKey } from '@/shared/i18n/dictionaries'
import { boundsOf, type Period } from '@/shared/lib/period'
import { actionKey, type AuditEntry, type AuditKind } from './audit'

type ApiEntry = {
  id: string
  created_at: string
  staff_id: string
  staff_name: string
  company_code: string
  section: string
  kind: AuditKind
  action: string
  params: Record<string, unknown>
  target: string
  entity: string
  entity_id: string
  changes: { field: string; from: string; to: string }[]
  ip: string
}

const toEntry = (raw: ApiEntry): AuditEntry => ({
  id: raw.id,
  at: new Date(raw.created_at),
  staffId: raw.staff_id,
  admin: raw.staff_name,
  company: raw.company_code,
  section: raw.section,
  kind: raw.kind,
  action: raw.action,
  params: Object.fromEntries(Object.entries(raw.params ?? {}).map(([k, v]) => [k, String(v)])),
  target: raw.target,
  entity: raw.entity,
  entityId: raw.entity_id,
  changes: raw.changes ?? [],
  ip: raw.ip,
})

const pad = (n: number) => String(n).padStart(2, '0')
/** A calendar day at its start in Tashkent (UTC+5), which is how the log counts days. */
const tashkent = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00+05:00`

/**
 * `from` and `to` for a period. The log allows at most 366 days at once, so there "all time" is the
 * last year (`maxYear`); elsewhere it sends no bounds.
 */
export function periodRange(period: Period, maxYear = true) {
  const bounds = boundsOf(period)
  if (period.unit === 'all') {
    if (!maxYear) return {}
    const to = new Date()
    to.setDate(to.getDate() + 1)
    const from = new Date()
    from.setDate(from.getDate() - 364)
    return { from: tashkent(from), to: tashkent(to) }
  }
  if (!bounds.from || !bounds.to) return {}
  const to = new Date(bounds.to)
  to.setDate(to.getDate() + 1)
  return { from: tashkent(bounds.from), to: tashkent(to) }
}

export async function loadAudit(filters: {
  period: Period
  q: string
  staffId: string
  section: string
  kind: string
  page: number
  limit: number
}) {
  const data = await apiGet<{ items: ApiEntry[]; total: number }>('/admin/audit', {
    ...periodRange(filters.period),
    q: filters.q,
    staff_id: filters.staffId,
    section: filters.section,
    kind: filters.kind,
    page: filters.page,
    limit: filters.limit,
  })
  return { items: data.items.map(toEntry), total: data.total }
}

type Translate = (key: TranslationKey, params?: Record<string, string>) => string

const known = (key: string): key is TranslationKey => key in dictionaries.uz

/** The sentence for an action; the raw key when the dictionary does not know it. */
export function auditText(t: Translate, entry: AuditEntry) {
  const key = actionKey(entry.action)
  return known(key) ? t(key, entry.params) : entry.action
}

/** A changed field's name: the dictionary's when there is one, else the server's key. */
export function auditChangeField(t: Translate, field: string) {
  const key = `audit.f.${field.split('.')[0]}`
  return known(key) ? t(key) : field
}

/** Where a log entry's target can be opened. Only roles have a page of their own. */
export function auditTarget(entry: AuditEntry): { href?: string } {
  return entry.entity === 'role' && entry.entityId ? { href: roleEditPath(entry.entityId) } : {}
}
