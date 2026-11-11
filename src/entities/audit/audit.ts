import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { groupDigits } from '@/shared/lib/format'

/** What kind of thing an admin did, for the coloured badge and the filter. */
export const AUDIT_KINDS = ['create', 'update', 'delete', 'money', 'access'] as const
export type AuditKind = (typeof AUDIT_KINDS)[number]

/** One field an action changed, shown as before → after in the entry's details. */
export type AuditChange = { field: string; from: string; to: string }

/** One thing someone did in the admin panel, as `GET /admin/audit` returns it. Only ever added. */
export type AuditEntry = {
  id: string
  at: Date
  staffId: string
  /** Who did it: their name, kept as it was at the time. */
  admin: string
  company: string
  /** The panel page it happened on, a key of the role sections. */
  section: string
  kind: AuditKind
  /** The server's action key without prefix, e.g. `adminSaved`; the text is `audit.a.<action>`. */
  action: string
  params: Record<string, string>
  /** What it was done to, e.g. the client's name. */
  target: string
  entity: string
  entityId: string
  changes: AuditChange[]
  ip: string
}

/** The text of an action: the dictionary's when there is one, the raw key otherwise. */
export const actionKey = (action: string) => `audit.a.${action}` as TranslationKey

/**
 * The server writes the activity log itself on every change (admin doc, 5.3), so the pages no
 * longer record anything. Kept so the pages that are still sample data compile.
 */
export function logAction(_entry: unknown) {}

/** "12 500 000 UZS", for action params. */
export const sumParam = (amount: number) => `${groupDigits(amount)} UZS`
