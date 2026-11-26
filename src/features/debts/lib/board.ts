import type { DebtCase, DebtStatus } from '@/entities/collections/debtCases'
import type { NextCallState } from './rows'

/**
 * One late nasiya (Birzum) or loan (Fortuna, Vodiy) as the Qarzdorlar board and table show it.
 * Each workspace maps its own data onto this.
 */
export type BoardRow = {
  file: DebtCase
  name: string
  phone: string
  initials: string
  photoUrl?: string
  /** Same for all of one person's debts, to find their other late ones. */
  personKey: string
  /** "№231014" or the contract number. */
  ref: string
  /** Under the number: the goods and shop, or the loan product. */
  sub: string
  /** What the group filter matches: the merchant or the product. */
  groupId: string
  overdue: number
  overdueCount: number
  days: number
  remaining: number
  lastNote?: { text: string; at: Date }
  operatorName?: string
  nextCallState: NextCallState
  openedAt: Date
  href: string
}

/** What the shared dialogs need to know about the workspace a debt belongs to. */
export type DebtTarget = {
  /** The person's name, for the dialog's eyebrow and the log. */
  name: string
  /** The debt's page, for the log's link. */
  href: string
  /** The audit section: `debts` for Birzum, `mlOverdue` for a brand. */
  section: string
  store: {
    getAll: () => DebtCase[]
    update: (id: string, patch: Partial<DebtCase>) => void
  }
  operators: { id: string; name: string }[]
}

export type MoveHandler = (row: BoardRow, to: DebtStatus) => void

/** Moves a debt to another status and writes it into the file's history. */
export function moveIn(
  store: DebtTarget['store'],
  file: DebtCase,
  to: DebtStatus,
  by: string,
  comment?: string,
) {
  if (file.status === to) return
  const fresh = store.getAll().find((item) => item.id === file.id) ?? file
  store.update(file.id, {
    status: to,
    history: [...fresh.history, { at: new Date(), by, from: fresh.status, to, comment }],
  })
}
