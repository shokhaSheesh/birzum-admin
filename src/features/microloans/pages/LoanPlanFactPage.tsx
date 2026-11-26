import { useMemo, useState } from 'react'
import { paymentsOf } from '@/entities/microloans/loanPayments'
import { lateOf, loansStore, progressOf, scheduleOf, type Loan } from '@/entities/microloans/loans'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandClientPath, brandLoanPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { startOfDay } from '@/shared/lib/dates'
import { boundsOf, type Period } from '@/shared/lib/period'
import { ExportMenu } from '@/shared/ui/ExportMenu'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { PlanFactView, type PlanFactRow } from '@/features/collections/components/PlanFactView'
import { monthsOf, nextMonth } from '@/features/collections/lib/planFact'

/**
 * Plan for a month: what is still unpaid of the monthly payments due that month, as the schedule
 * stood on its 1st. A partial early repayment made before then has already lowered the payments
 * after it (the annuity rule), so the plan follows it.
 */
function planOf(loan: Loan, start: Date) {
  if (loan.closedAt && loan.closedAt < start) return 0
  const end = nextMonth(start)
  const paidBefore = (n: number) => !!loan.paidOn[n] && loan.paidOn[n] < start
  return scheduleOf({ ...loan, prepayments: loan.prepayments.filter((p) => p.at < start) })
    .filter((item) => item.due >= start && item.due < end && !paidBefore(item.n))
    .reduce((sum, item) => sum + item.amount, 0)
}

/**
 * Plan / fakt for a microloan brand: one row per loan, and for each month what the schedule
 * expected, what came in and the difference. Same table as Birzum's.
 */
export function LoanPlanFactPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const [today] = useState(() => new Date())
  const [period, setPeriod] = useState<Period>(() => ({
    unit: 'all',
    anchor: startOfDay(new Date()),
    range: { from: null, to: null },
  }))
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const products = loanProductsStore.useAll().filter((item) => item.brand === brand)
  const bounds = boundsOf(period)

  const first = loans.reduce<Date>(
    (min, loan) => (loan.issuedAt < min ? loan.issuedAt : min),
    today,
  )
  const months = useMemo(() => monthsOf(bounds, first, today), [bounds, first, today])

  const rows = useMemo(() => {
    if (!months.length) return []
    const windowStart = months[0]
    const windowEnd = nextMonth(months[months.length - 1])
    const out: PlanFactRow[] = []
    for (const loan of loans) {
      if (loan.issuedAt >= windowEnd) continue
      if (loan.closedAt && loan.closedAt < windowStart) continue
      const paid = paymentsOf([loan]).filter((payment) => payment.ok)
      out.push({
        id: loan.id,
        name: loan.borrower.name,
        nameHref: brandClientPath(brand, `${brand}-${loan.borrower.passport}`),
        ref: loan.number,
        refHref: brandLoanPath(brand, loan.id),
        sub: products.find((item) => item.id === loan.productId)?.name ?? '—',
        groupId: loan.productId,
        date: loan.issuedAt,
        values: [loan.amount, progressOf(loan).remaining],
        months: months.map((start) => {
          const end = nextMonth(start)
          return {
            plan: planOf(loan, start),
            fact: paid
              .filter((payment) => payment.at >= start && payment.at < end)
              .reduce((sum, payment) => sum + payment.amount, 0),
          }
        }),
        debtToday: lateOf(loan, today).amount,
        search: `${loan.borrower.name} ${loan.borrower.phone} ${loan.number}`,
      })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [months, loans, products, brand, today])

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.planFact')}
        actions={<ExportMenu section="mlPlanFact" period={period} />}
      />
      <PeriodFilter value={period} onChange={setPeriod} />
      <section className="flex flex-col rounded-card border border-line bg-canvas">
        <PlanFactView
          rows={rows}
          months={months}
          today={today}
          groups={products.map((item) => ({ value: item.id, label: item.name }))}
          labels={{
            name: t('planFact.col.borrower'),
            date: t('planFact.col.issued'),
            values: [t('planFact.col.loanSum'), t('planFact.col.remaining')],
            group: t('planFact.col.product'),
            allGroups: t('planFact.allProducts'),
            search: t('planFact.searchLoan'),
          }}
        />
      </section>
    </div>
  )
}
