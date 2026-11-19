import { operatorsOf } from '@/entities/collections/debtCases'
import { loanContactsStore } from '@/entities/microloans/loanContacts'
import { loanDebtsStore } from '@/entities/microloans/loanDebts'
import { paymentsOf } from '@/entities/microloans/loanPayments'
import { loansStore } from '@/entities/microloans/loans'
import type { Brand } from '@/shared/config/workspaces'
import type { DateRange } from '@/shared/lib/dates'
import { ReportsView } from '@/features/collections/components/CollectionReports'

/** A brand's Hisobot: promises by month and each operator's work, on its loans. */
export function LoanReports({
  brand,
  bounds,
  today,
}: {
  brand: Brand
  bounds: DateRange
  today: Date
}) {
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const ids = new Set(loans.map((loan) => loan.id))
  const contacts = loanContactsStore.useAll()
  const cases = loanDebtsStore.useAll().filter((file) => file.brand === brand)
  return (
    <ReportsView
      bounds={bounds}
      today={today}
      calls={contacts
        .filter((contact) => contact.channel === 'call' && ids.has(contact.loanId))
        .map((call) => ({ ...call, debtId: call.loanId }))}
      payments={paymentsOf(loans)
        .filter((payment) => payment.ok)
        .map((payment) => ({ debtId: payment.loan.id, at: payment.at, amount: payment.amount }))}
      cases={cases}
      operators={operatorsOf(brand)}
    />
  )
}
