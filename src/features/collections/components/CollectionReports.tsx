import { contactsStore, REACHED_RESULTS, type CallResult } from '@/entities/collections/contacts'
import { debtCasesStore, operatorsOf } from '@/entities/collections/debtCases'
import { paymentsStore } from '@/entities/collections/payments'
import { useI18n } from '@/shared/i18n/useI18n'
import { addDays, inRange, MONTHS, startOfDay, type DateRange } from '@/shared/lib/dates'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'

const th = 'px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase'
const td = 'px-4 py-3 text-right tabular-nums whitespace-nowrap'

const share = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : '—'

/** A promise is kept when money came in for that nasiya between the call and the promised day. */
/** A call as the reports read it: about which debt, when, by whom, and what came of it. */
export type ReportCall = {
  debtId?: string
  at: Date
  by: string
  result?: CallResult
  promiseDate?: Date
}
/** Money that came in on a debt (refused charges left out). */
export type ReportPayment = { debtId: string; at: Date; amount: number }

const keptOf = (call: ReportCall, payments: ReportPayment[]) =>
  !!call.promiseDate &&
  payments.some(
    (payment) =>
      payment.debtId === call.debtId &&
      payment.at >= call.at &&
      payment.at < addDays(startOfDay(call.promiseDate!), 1),
  )

/**
 * How the collectors' work goes, for the page's period: promises month by month (given, due,
 * kept) and each operator's calls, reach, promises and the money in on their debts.
 */
export function ReportsView({
  bounds,
  today,
  calls,
  payments,
  cases,
  operators,
}: {
  bounds: DateRange
  today: Date
  calls: ReportCall[]
  payments: ReportPayment[]
  cases: { id: string; operatorId?: string }[]
  operators: { id: string; name: string }[]
}) {
  const { t, lang } = useI18n()
  const inPeriod = calls.filter((call) => inRange(call.at, bounds))
  const promises = calls.filter((call) => call.promiseDate)

  // Months of the period, up to this month
  const first = bounds.from ?? calls.reduce((min, call) => (call.at < min ? call.at : min), today)
  const last = bounds.to && bounds.to < today ? bounds.to : today
  const months: Date[] = []
  for (
    let month = new Date(first.getFullYear(), first.getMonth(), 1);
    month <= last;
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  )
    months.push(month)
  const monthRows = months
    .map((start) => {
      const range = { from: start, to: new Date(start.getFullYear(), start.getMonth() + 1, 0) }
      const own = calls.filter((call) => inRange(call.at, range))
      const due = promises.filter(
        (call) => inRange(call.promiseDate!, range) && call.promiseDate! < startOfDay(today),
      )
      return {
        start,
        calls: own.length,
        reached: own.filter((call) => call.result && REACHED_RESULTS.includes(call.result)).length,
        given: own.filter((call) => call.promiseDate).length,
        due: due.length,
        kept: due.filter((call) => keptOf(call, payments)).length,
      }
    })
    .reverse()

  // Operators: everyone who may work debts, plus anyone who called in the period
  const names = new Set([
    ...operators.map((admin) => admin.name),
    ...inPeriod.map((call) => call.by),
  ])
  const collectedOn = (ids: Set<string>) =>
    payments
      .filter((payment) => ids.has(payment.debtId) && inRange(payment.at, bounds))
      .reduce((sum, payment) => sum + payment.amount, 0)
  const operatorRows = [...names].map((name) => {
    const own = inPeriod.filter((call) => call.by === name)
    const admin = operators.find((item) => item.name === name)
    const assigned = new Set(
      cases.filter((file) => admin && file.operatorId === admin.id).map((file) => file.id),
    )
    const given = own.filter((call) => call.promiseDate)
    return {
      name,
      calls: own.length,
      debts: new Set(own.map((call) => call.debtId)).size,
      reached: own.filter((call) => call.result && REACHED_RESULTS.includes(call.result)).length,
      given: given.length,
      kept: given.filter((call) => keptOf(call, payments)).length,
      collected: collectedOn(assigned),
    }
  })
  const unassigned = new Set(cases.filter((file) => !file.operatorId).map((file) => file.id))
  const total = operatorRows.reduce(
    (sum, row) => ({
      calls: sum.calls + row.calls,
      debts: sum.debts + row.debts,
      reached: sum.reached + row.reached,
      given: sum.given + row.given,
      kept: sum.kept + row.kept,
      collected: sum.collected + row.collected,
    }),
    { calls: 0, debts: 0, reached: 0, given: 0, kept: 0, collected: collectedOn(unassigned) },
  )

  return (
    <div className="flex flex-col gap-8 py-4">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5 px-4">
          <h2 className="text-lg font-bold">{t('reports.promises.title')}</h2>
          <p className="text-sm text-ink-muted">{t('reports.promises.note')}</p>
        </div>
        {monthRows.length === 0 ? (
          <EmptyState title={t('reports.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${th} text-left!`}>{t('reports.month')}</th>
                  <th className={th}>{t('reports.calls')}</th>
                  <th className={th}>{t('reports.reached')}</th>
                  <th className={th}>{t('reports.reachRate')}</th>
                  <th className={th}>{t('reports.given')}</th>
                  <th className={th}>{t('reports.due')}</th>
                  <th className={th}>{t('reports.kept')}</th>
                  <th className={th}>{t('reports.keptRate')}</th>
                </tr>
              </thead>
              <tbody>
                {monthRows.map((row) => (
                  <tr
                    key={row.start.toISOString()}
                    className="border-b border-line last:border-b-0"
                  >
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {MONTHS[lang][row.start.getMonth()]} {row.start.getFullYear()}
                    </td>
                    <td className={td}>{groupDigits(row.calls)}</td>
                    <td className={td}>{groupDigits(row.reached)}</td>
                    <td className={td}>{share(row.reached, row.calls)}</td>
                    <td className={td}>{groupDigits(row.given)}</td>
                    <td className={td}>{groupDigits(row.due)}</td>
                    <td className={td}>{groupDigits(row.kept)}</td>
                    <td className={`${td} font-semibold`}>{share(row.kept, row.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5 px-4">
          <h2 className="text-lg font-bold">{t('reports.operators.title')}</h2>
          <p className="text-sm text-ink-muted">{t('reports.operators.note')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={`${th} text-left!`}>{t('debts.operator')}</th>
                <th className={th}>{t('reports.calls')}</th>
                <th className={th}>{t('reports.debts')}</th>
                <th className={th}>{t('reports.reached')}</th>
                <th className={th}>{t('reports.reachRate')}</th>
                <th className={th}>{t('reports.given')}</th>
                <th className={th}>{t('reports.kept')}</th>
                <th className={th}>{t('reports.keptRate')}</th>
                <th className={th}>{t('reports.collected')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line bg-surface/60 font-semibold">
                <td className="px-4 py-3">{t('reports.total')}</td>
                <td className={td}>{groupDigits(total.calls)}</td>
                <td className={td}>{groupDigits(total.debts)}</td>
                <td className={td}>{groupDigits(total.reached)}</td>
                <td className={td}>{share(total.reached, total.calls)}</td>
                <td className={td}>{groupDigits(total.given)}</td>
                <td className={td}>{groupDigits(total.kept)}</td>
                <td className={td}>{share(total.kept, total.given)}</td>
                <td className={td}>{formatSum(total.collected)}</td>
              </tr>
              {operatorRows.map((row) => (
                <tr key={row.name} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{row.name}</td>
                  <td className={td}>{groupDigits(row.calls)}</td>
                  <td className={td}>{groupDigits(row.debts)}</td>
                  <td className={td}>{groupDigits(row.reached)}</td>
                  <td className={td}>{share(row.reached, row.calls)}</td>
                  <td className={td}>{groupDigits(row.given)}</td>
                  <td className={td}>{groupDigits(row.kept)}</td>
                  <td className={td}>{share(row.kept, row.given)}</td>
                  <td className={td}>{formatSum(row.collected)}</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3 text-ink-muted">{t('debts.operator.none')}</td>
                <td className={td} colSpan={7} />
                <td className={td}>{formatSum(collectedOn(unassigned))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/** Birzum's Hisobot: calls on nasiyalar and money in on them. */
export function CollectionReports({ bounds, today }: { bounds: DateRange; today: Date }) {
  const contacts = contactsStore.useAll()
  const payments = paymentsStore.useAll()
  const cases = debtCasesStore.useAll()
  return (
    <ReportsView
      bounds={bounds}
      today={today}
      calls={contacts
        .filter((contact) => contact.channel === 'call')
        .map((call) => ({ ...call, debtId: call.applicationId }))}
      payments={payments
        .filter((payment) => !payment.failed)
        .map((payment) => ({
          debtId: payment.applicationId,
          at: payment.at,
          amount: payment.amount,
        }))}
      cases={cases}
      operators={operatorsOf('birzum')}
    />
  )
}
