import { useEffect } from 'react'
import {
  operatorsOf,
  statusAfterCall,
  SYSTEM_ACTOR,
  type DebtCase,
  type DebtStatus,
  type StatusChange,
} from '@/entities/collections/debtCases'
import { loanContactsStore } from '@/entities/microloans/loanContacts'
import { lateOf, loansStore, type Loan } from '@/entities/microloans/loans'
import type { Brand } from '@/shared/config/workspaces'
import { addDays, startOfDay } from '@/shared/lib/dates'
import { createStore } from '@/shared/lib/createStore'

/**
 * The collectors' file on one late loan of Fortuna or Vodiy: the same statuses and rules as
 * Birzum's Qarzdorlar. The system opens it when a payment is missed, closes it when nothing is late
 * any more, and reopens the same file if the loan goes late again. `clientId` is the borrower's
 * client id in the brand (`fortuna-<passport>`).
 */
export type LoanDebt = DebtCase & { brand: Brand }

const clientIdOf = (loan: Loan) => `${loan.brand}-${loan.borrower.passport}`

function synced(files: LoanDebt[], loans: Loan[], today: Date) {
  let changed = false
  const byId = new Map(files.map((item) => [item.id, item]))
  const next = [...files]
  for (const loan of loans) {
    const late = lateOf(loan, today).amount > 0
    const file = byId.get(loan.id)
    if (late) {
      if (!file) {
        changed = true
        next.push({
          id: loan.id,
          brand: loan.brand,
          clientId: clientIdOf(loan),
          status: 'new',
          history: [{ at: loan.overdueSince ?? today, by: SYSTEM_ACTOR, to: 'new' }],
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
  return changed ? next : files
}

// Sample files: one for every late loan, where the last call left it, operators spread over the
// brand's collectors, and a few repaid ones closed. Replace with the API.
function seed(): LoanDebt[] {
  const today = new Date()
  const loans = loansStore.getAll()
  const contacts = loanContactsStore.getAll()
  const start = startOfDay(today)
  const files = synced([], loans, today).map((file, i): LoanDebt => {
    const operators = operatorsOf(file.brand)
    const call = contacts.find((c) => c.loanId === file.id && c.channel === 'call')
    const operator =
      i % 3 === 2 ? undefined : operators[(i - Math.floor(i / 3)) % Math.max(1, operators.length)]
    let status: DebtStatus = 'new'
    if (call?.result) status = statusAfterCall(call.result, 'new')
    else if (i % 5 === 1)
      status = (['firstCall', 'repeatCall', 'court', 'phoneOff'] as const)[i % 4]
    const history: StatusChange[] = [...file.history]
    if (status !== 'new')
      history.push({
        at: call?.at ?? addDays(file.history[0].at, 2),
        by: call?.by ?? operator?.name ?? 'Dilshod Karimov',
        from: 'new',
        to: status,
      })
    return {
      ...file,
      status,
      operatorId: operator?.id,
      history,
      nextCall:
        status === 'new' || status === 'court'
          ? undefined
          : {
              at:
                i % 3 === 0
                  ? new Date(addDays(start, -1).getTime() + (10 + (i % 8)) * 3_600_000)
                  : i % 3 === 1
                    ? new Date(today.getTime() + (1 + (i % 3)) * 3_600_000)
                    : new Date(addDays(start, 1).getTime() + (10 + (i % 8)) * 3_600_000),
            },
    }
  })
  // A few loans that were late and are paid up now
  for (const brand of ['fortuna', 'vodiy'] as const) {
    const operators = operatorsOf(brand)
    loans
      .filter((loan) => loan.brand === brand && !loan.overdueSince && loan.paidCount > 1)
      .slice(0, 2)
      .forEach((loan, i) => {
        const paidAt = loan.paidOn[loan.paidCount] ?? addDays(today, -10)
        const opened = addDays(paidAt, -9 - i * 4)
        files.push({
          id: loan.id,
          brand,
          clientId: clientIdOf(loan),
          status: 'closed',
          operatorId: operators[0]?.id,
          history: [
            { at: opened, by: SYSTEM_ACTOR, to: 'new' },
            {
              at: addDays(opened, 1),
              by: operators[0]?.name ?? 'Dilshod Karimov',
              from: 'new',
              to: 'promised',
              comment: 'Hafta oxirigacha toʻlashini aytdi.',
            },
            { at: paidAt, by: SYSTEM_ACTOR, from: 'promised', to: 'closed' },
          ],
        })
      })
  }
  return files
}

export const loanDebtsStore = createStore<LoanDebt>(seed())

/** The system's opening and closing, run whenever the loans change. */
export function useSyncedLoanDebts(today: Date) {
  const loans = loansStore.useAll()
  const files = loanDebtsStore.useAll()
  useEffect(() => {
    const next = synced(loanDebtsStore.getAll(), loans, today)
    if (next !== loanDebtsStore.getAll()) loanDebtsStore.replaceAll(next)
  }, [loans, today])
  return files
}
