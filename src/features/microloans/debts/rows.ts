import { useMemo } from 'react'
import { adminsStore } from '@/entities/admins/admins'
import { operatorsOf } from '@/entities/collections/debtCases'
import type { Relation } from '@/entities/people/contacts'
import { loanClientsStore, type LoanClient } from '@/entities/microloans/loanClients'
import { loanContactsStore, type LoanContact } from '@/entities/microloans/loanContacts'
import { loanDebtsStore, useSyncedLoanDebts, type LoanDebt } from '@/entities/microloans/loanDebts'
import { daysLate, lateOf, loansStore, progressOf, type Loan } from '@/entities/microloans/loans'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandPath, type Brand } from '@/shared/config/workspaces'
import { newId } from '@/shared/lib/createStore'
import type { CallEntry } from '@/features/debts/components/DebtDialogs'
import type { BoardRow, DebtTarget } from '@/features/debts/lib/board'
import { nextCallStateOf, type NextCallState } from '@/features/debts/lib/rows'

export const loanDebtPath = (brand: Brand, id: string) => brandPath(brand, `debts/${id}`)

/** Everything a brand's board and file show about one late loan. */
export type LoanDebtRow = {
  file: LoanDebt
  loan: Loan
  client?: LoanClient
  productName: string
  late: ReturnType<typeof lateOf>
  days: number
  progress: ReturnType<typeof progressOf>
  contacts: LoanContact[]
  lastNote?: { text: string; at: Date }
  operatorName?: string
  nextCallState: NextCallState
  openedAt: Date
}

const initialsOfName = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()

/** A brand's late loans, kept in step with the system's opening and closing of files. */
export function useLoanDebtRows(brand: Brand, today: Date) {
  const files = useSyncedLoanDebts(today)
  const loans = loansStore.useAll()
  const clients = loanClientsStore.useAll()
  const contacts = loanContactsStore.useAll()
  const products = loanProductsStore.useAll()
  const admins = adminsStore.useAll()
  return useMemo(() => {
    const rows: LoanDebtRow[] = []
    for (const file of files) {
      if (file.brand !== brand) continue
      const loan = loans.find((item) => item.id === file.id)
      if (!loan) continue
      const own = contacts
        .filter((contact) => contact.loanId === loan.id)
        .sort((a, b) => b.at.getTime() - a.at.getTime())
      const noted = own.find((contact) => contact.comment || contact.clientAnswer)
      rows.push({
        file,
        loan,
        client: clients.find((item) => item.id === file.clientId),
        productName: products.find((item) => item.id === loan.productId)?.name ?? '—',
        late: lateOf(loan, today),
        days: daysLate(loan, today),
        progress: progressOf(loan),
        contacts: own,
        lastNote: noted
          ? { text: (noted.clientAnswer ?? noted.comment)!, at: noted.at }
          : undefined,
        operatorName: admins.find((admin) => admin.id === file.operatorId)?.name,
        nextCallState: nextCallStateOf(file, today),
        openedAt: file.history[0]?.at ?? today,
      })
    }
    return rows.sort((a, b) => b.days - a.days || b.late.amount - a.late.amount)
  }, [files, loans, clients, contacts, products, admins, brand, today])
}

export const toLoanBoardRow = (brand: Brand, row: LoanDebtRow): BoardRow => ({
  file: row.file,
  name: row.loan.borrower.name,
  phone: row.loan.borrower.phone,
  initials: initialsOfName(row.loan.borrower.name),
  personKey: row.loan.borrower.passport,
  ref: row.loan.number,
  sub: `${row.productName} · ${row.loan.term} oy`,
  groupId: row.loan.productId,
  overdue: row.late.amount,
  overdueCount: row.late.months.length,
  days: row.file.status === 'closed' ? 0 : row.days,
  remaining: row.progress.remaining,
  lastNote: row.lastNote,
  operatorName: row.operatorName,
  nextCallState: row.nextCallState,
  openedAt: row.openedAt,
  href: loanDebtPath(brand, row.file.id),
})

export const loanTarget = (brand: Brand, name: string, id: string): DebtTarget => ({
  name,
  href: loanDebtPath(brand, id),
  section: 'mlOverdue',
  store: loanDebtsStore,
  operators: operatorsOf(brand),
})

/** Who can be called about a loan: the borrower, then their contacts. */
export function peopleOf(
  row: LoanDebtRow,
  borrowerLabel: string,
  relationLabel: (r: Relation) => string,
) {
  return [
    { value: 'borrower', label: `${row.loan.borrower.name} (${borrowerLabel})` },
    ...(row.client?.contacts ?? []).map((person) => ({
      value: person.phone,
      label: `${person.name ?? person.phone} (${relationLabel(person.relation)})`,
    })),
  ]
}

/** Keeps a call on a loan. */
export const saveLoanCall = (fileId: string, entry: CallEntry) =>
  loanContactsStore.save({ id: newId(), loanId: fileId, channel: 'call', ...entry })
