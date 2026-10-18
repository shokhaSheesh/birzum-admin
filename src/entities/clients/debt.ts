import type { Application } from '../applications/applications'
import { daysLate, progressOf, type Payment } from '../collections/payments'
import type { Client } from './clients'

/**
 * A shopper's money with Birzum: running nasiyalar, what is left, what is late and for how
 * long, and the next payment day. Worked out from the schedule and the payments.
 */
export function debtOf(
  client: Client,
  applications: Application[],
  payments: Payment[],
  today: Date,
) {
  const running = applications.filter(
    (application) => application.clientId === client.id && application.status === 'handed',
  )
  const progress = running.map((application) => progressOf(application, payments, today))
  const nexts = progress.map((item) => item.next).filter((date): date is Date => !!date)
  const since = progress.map((item) => item.overdueSince).filter((date): date is Date => !!date)
  const oldest = since.length ? new Date(Math.min(...since.map((date) => date.getTime()))) : null
  return {
    running: running.length,
    remaining: progress.reduce((sum, item) => sum + item.remaining, 0),
    overdue: progress.reduce((sum, item) => sum + item.overdue, 0),
    overdueCount: progress.reduce((sum, item) => sum + item.overdueCount, 0),
    overdueDays: oldest ? daysLate(oldest, today) : 0,
    /** Arizalar with a late payment. */
    lateApplications: running.filter((_, i) => progress[i].overdue > 0),
    next: nexts.length ? new Date(Math.min(...nexts.map((date) => date.getTime()))) : null,
  }
}

export type Debt = ReturnType<typeof debtOf>

export type ClientStatus = 'blocked' | 'overdue' | 'running' | 'idle'
export const CLIENT_STATUSES: ClientStatus[] = ['running', 'overdue', 'blocked', 'idle']

/** Blocked first, then late, then paying on time, then nothing running. */
export const clientStatusOf = (client: Client, debt: Debt): ClientStatus =>
  client.block ? 'blocked' : debt.overdue > 0 ? 'overdue' : debt.running > 0 ? 'running' : 'idle'

/** How late a debtor is, in the groups the collections page counts by. */
export const AGE_BUCKETS = ['d7', 'd14', 'd30', 'd30plus'] as const
export type AgeBucket = (typeof AGE_BUCKETS)[number]
export const ageBucketOf = (days: number): AgeBucket =>
  days <= 7 ? 'd7' : days <= 14 ? 'd14' : days <= 30 ? 'd30' : 'd30plus'
