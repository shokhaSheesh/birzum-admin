import { handedAtOf, type Application } from '../applications/applications'
import type { Client } from './clients'

/** How far one running nasiya has got: payments made, what is left, and the next payment day. */
export function progressOf(application: Application, client: Client, today: Date) {
  const handed = handedAtOf(application)
  if (!handed || application.status !== 'handed')
    return { paid: application.term, remaining: 0, next: null }
  // Payment days come once a month, from the month after the hand-over
  let due = 0
  for (let month = 1; month <= application.term; month++) {
    const day = new Date(handed.getFullYear(), handed.getMonth() + month, application.paymentDay)
    if (day <= today) due++
  }
  // A shopper who is late has missed the last one
  const paid = Math.max(0, due - (client.overdueDays > 0 ? 1 : 0))
  const next = new Date(handed.getFullYear(), handed.getMonth() + due + 1, application.paymentDay)
  return {
    paid,
    remaining: Math.max(0, application.installmentTotal - paid * application.monthlyPayment),
    next: due < application.term ? next : null,
  }
}

/** A shopper's money with Birzum: running nasiyalar, what is left, and what is late. */
export function debtOf(client: Client, applications: Application[], today: Date) {
  const running = applications.filter(
    (application) => application.clientId === client.id && application.status === 'handed',
  )
  const progress = running.map((application) => progressOf(application, client, today))
  const nexts = progress.map((item) => item.next).filter((date): date is Date => !!date)
  return {
    running: running.length,
    remaining: progress.reduce((sum, item) => sum + item.remaining, 0),
    overdue:
      client.overdueDays > 0
        ? running.reduce((sum, application) => sum + application.monthlyPayment, 0)
        : 0,
    next: nexts.length ? new Date(Math.min(...nexts.map((date) => date.getTime()))) : null,
  }
}

export type ClientStatus = 'blocked' | 'overdue' | 'running' | 'idle'
export const CLIENT_STATUSES: ClientStatus[] = ['running', 'overdue', 'blocked', 'idle']

/** Blocked first, then late, then paying on time, then nothing running. */
export const clientStatusOf = (client: Client, running: number): ClientStatus =>
  client.block
    ? 'blocked'
    : client.overdueDays > 0 && running > 0
      ? 'overdue'
      : running > 0
        ? 'running'
        : 'idle'
