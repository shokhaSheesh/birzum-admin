import { useEffect } from 'react'
import { adminsStore, roleIn } from '../admins/admins'
import { rolesStore } from '../admins/roles'
import { applicationsStore, type Application } from '../applications/applications'
import { contactsStore, type CallResult } from './contacts'
import { daysLate, paymentsStore, progressOf, type Payment } from './payments'
import type { Workspace } from '@/shared/config/workspaces'
import { addDays, startOfDay } from '@/shared/lib/dates'
import { createStore } from '@/shared/lib/createStore'

/**
 * Where a late nasiya stands in the collectors' work, as columns on the Qarzdorlar board.
 * `new` and `closed` are set by the system only: a nasiya that goes late opens as `new`,
 * one whose late amount reaches 0 closes, and a closed one that goes late again reopens.
 */
export const DEBT_STATUSES = [
  'new',
  'firstCall',
  'repeatCall',
  'promised',
  'noAnswer',
  'refused',
  'court',
  'phoneOff',
  'closed',
] as const
export type DebtStatus = (typeof DEBT_STATUSES)[number]

/** Statuses only the system sets; an admin cannot pick or drop onto them. */
export const AUTO_STATUSES: readonly DebtStatus[] = ['new', 'closed']
export const MANUAL_STATUSES = DEBT_STATUSES.filter((status) => !AUTO_STATUSES.includes(status))

export const DEBT_TONES: Record<DebtStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> =
  {
    new: 'info',
    firstCall: 'neutral',
    repeatCall: 'neutral',
    promised: 'success',
    noAnswer: 'warning',
    refused: 'danger',
    court: 'danger',
    phoneOff: 'warning',
    closed: 'success',
  }

/** From this many days late a debt is "Kritik". */
export const CRITICAL_DAYS = 8

/** Who the system's own changes are written as. */
export const SYSTEM_ACTOR = 'Tizim'

export type StatusChange = {
  at: Date
  by: string
  from?: DebtStatus
  to: DebtStatus
  comment?: string
}

/**
 * The collectors' file on one late nasiya. One per nasiya for its whole life: closing and
 * reopening happen on the same file, so its history stays in one place.
 */
export type DebtCase = {
  /** The nasiya's (ariza's) id. */
  id: string
  clientId: string
  status: DebtStatus
  /** The admin in charge; none until someone assigns it. */
  operatorId?: string
  nextCall?: { at: Date; note?: string }
  /** Every status change, oldest first. */
  history: StatusChange[]
}

/** The status a call result moves a debt to, unless the admin picks another one. */
export const statusAfterCall = (result: CallResult, current: DebtStatus): DebtStatus => {
  const map: Partial<Record<CallResult, DebtStatus>> = {
    promised: 'promised',
    askedDelay: 'promised',
    noAnswer: 'noAnswer',
    unavailable: 'phoneOff',
    refused: 'refused',
    answered: 'repeatCall',
  }
  const next = map[result]
  if (next) return next
  // Already paid, other: stays, or leaves "new" for "first call"
  return current === 'new' || current === 'closed' ? 'firstCall' : current
}

/**
 * Active admins who may work on a workspace's debts: Birzum's Qarzdorlar (`debts`), or a brand's
 * (`mlOverdue`, the brands' Qarzdorlar).
 */
export function operatorsOf(workspace: Workspace = 'birzum') {
  const section = workspace === 'birzum' ? 'debts' : 'mlOverdue'
  const roles = rolesStore.getAll()
  return adminsStore
    .getAll()
    .filter((admin) => admin.status === 'active')
    .filter((admin) => {
      const role = roles.find((item) => item.id === roleIn(admin, workspace))
      return !!role?.access[section]?.includes('update')
    })
}

const isRunning = (application: Application) =>
  application.status === 'handed' || application.status === 'closed'

/**
 * Opens a file for every nasiya that went late, closes the ones whose late amount reached 0 and
 * reopens closed ones that went late again. Returns the list unchanged when nothing moved.
 */
function synced(cases: DebtCase[], applications: Application[], payments: Payment[], today: Date) {
  let changed = false
  const byId = new Map(cases.map((item) => [item.id, item]))
  const next = [...cases]
  for (const application of applications) {
    if (!isRunning(application)) continue
    const progress = progressOf(application, payments, today)
    const file = byId.get(application.id)
    if (progress.overdue > 0) {
      if (!file) {
        changed = true
        next.push({
          id: application.id,
          clientId: application.clientId,
          status: 'new',
          history: [{ at: progress.overdueSince ?? today, by: SYSTEM_ACTOR, to: 'new' }],
        })
      } else if (file.status === 'closed') {
        changed = true
        next[next.indexOf(file)] = {
          ...file,
          status: 'new',
          history: [...file.history, { at: today, by: SYSTEM_ACTOR, from: 'closed', to: 'new' }],
        }
      }
    } else if (file && file.status !== 'closed') {
      changed = true
      next[next.indexOf(file)] = {
        ...file,
        status: 'closed',
        nextCall: undefined,
        history: [
          ...file.history,
          { at: today, by: SYSTEM_ACTOR, from: file.status, to: 'closed' },
        ],
      }
    }
  }
  return changed ? next : cases
}

// Sample files: the system opens one for every late nasiya; the late shoppers' calls set where
// theirs stand, a few move on by hand, and a few repaid ones show as closed. Replace with the API.
function seed(): DebtCase[] {
  const today = new Date()
  const applications = applicationsStore.getAll()
  const payments = paymentsStore.getAll()
  const contacts = contactsStore.getAll()
  const operators = operatorsOf()
  const files = synced([], applications, payments, today)

  const extra: DebtStatus[] = ['firstCall', 'repeatCall', 'court', 'phoneOff']
  const out = files.map((file, i) => {
    const call = contacts.find((c) => c.applicationId === file.id && c.channel === 'call')
    const opened = file.history[0].at
    // A third of the files nobody has taken yet; the rest spread over the operators
    const operator =
      i % 3 === 2 ? undefined : operators[(i - Math.floor(i / 3)) % Math.max(1, operators.length)]
    let status: DebtStatus = 'new'
    if (call?.result) status = statusAfterCall(call.result, 'new')
    else if (i % 5 === 1) status = extra[Math.floor(i / 5) % extra.length]
    const history: StatusChange[] = [...file.history]
    if (status !== 'new')
      history.push({
        at: call?.at ?? addDays(opened, 2),
        by: call?.by ?? operator?.name ?? 'Dilshod Karimov',
        from: 'new',
        to: status,
        comment:
          status === 'court' ? 'Uch oy javob bermadi, hujjatlar yuristga berildi.' : undefined,
      })
    const start = startOfDay(today)
    const nextCall =
      status === 'new' || status === 'court'
        ? undefined
        : {
            // Some missed yesterday, some later today, some tomorrow
            at:
              i % 3 === 0
                ? new Date(addDays(start, -1).getTime() + (10 + (i % 8)) * 3_600_000)
                : i % 3 === 1
                  ? new Date(today.getTime() + (1 + (i % 3)) * 3_600_000)
                  : new Date(addDays(start, 1).getTime() + (10 + (i % 8)) * 3_600_000),
            note: i % 2 ? 'Maoshdan keyin qayta qoʻngʻiroq' : undefined,
          }
    return {
      ...file,
      status,
      operatorId: operator?.id,
      nextCall,
      history,
    }
  })

  // A few nasiyas that were late and are repaid now
  applications
    .filter((application) => application.status === 'closed')
    .slice(0, 4)
    .forEach((application, i) => {
      const closedAt = application.history.find((entry) => entry.status === 'closed')?.at ?? today
      const opened = addDays(closedAt, -12 - i * 3)
      out.push({
        id: application.id,
        clientId: application.clientId,
        status: 'closed',
        operatorId: operators[i % Math.max(1, operators.length)]?.id,
        nextCall: undefined,
        history: [
          { at: opened, by: SYSTEM_ACTOR, to: 'new' },
          {
            at: addDays(opened, 1),
            by: operators[i % Math.max(1, operators.length)]?.name ?? 'Dilshod Karimov',
            from: 'new',
            to: 'promised',
            comment: 'Hafta oxirigacha toʻlashini aytdi.',
          },
          { at: closedAt, by: SYSTEM_ACTOR, from: 'promised', to: 'closed' },
        ],
      })
    })
  return out
}

export const debtCasesStore = createStore<DebtCase>(seed())

/** Runs the system's opening and closing whenever the nasiyalar or payments change. */
export function useSyncedDebtCases(today: Date) {
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const cases = debtCasesStore.useAll()
  useEffect(() => {
    const next = synced(debtCasesStore.getAll(), applications, payments, today)
    if (next !== debtCasesStore.getAll()) debtCasesStore.replaceAll(next)
  }, [applications, payments, today])
  return cases
}

/** A nasiya's late figures for the board and the file. */
export function lateOf(application: Application, payments: Payment[], today: Date) {
  const progress = progressOf(application, payments, today)
  return {
    progress,
    overdue: progress.overdue,
    overdueCount: progress.overdueCount,
    since: progress.overdueSince,
    days: progress.overdueSince ? daysLate(progress.overdueSince, today) : 0,
    remaining: progress.remaining,
  }
}
