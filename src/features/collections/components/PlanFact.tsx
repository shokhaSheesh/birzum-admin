import { useMemo } from 'react'
import {
  applicationsStore,
  handedAtOf,
  type Application,
} from '@/entities/applications/applications'
import { clientsStore, fullName } from '@/entities/clients/clients'
import {
  paymentsStore,
  progressOf,
  scheduleOf,
  type Payment,
} from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { applicationPath, clientPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import type { DateRange } from '@/shared/lib/dates'
import { PlanFactView, type PlanFactRow } from './PlanFactView'
import { monthsOf, nextMonth } from '@/features/collections/lib/planFact'

/**
 * Plan for a month: what is still unpaid of that month's instalment on its 1st, so a month
 * already paid ahead plans 0. Money paid ahead goes to the last instalment (the schedule's rule),
 * so paying two months at once lowers the last month, not the next one.
 */
function planOf(application: Application, own: Payment[], start: Date) {
  const before = own.filter((payment) => payment.at < start)
  const end = nextMonth(start)
  return scheduleOf(application, before, start)
    .filter((item) => item.dueDate >= start && item.dueDate < end)
    .reduce((sum, item) => sum + item.amount - item.paid, 0)
}

/** Money that came in for the nasiya during the month. */
const factOf = (own: Payment[], start: Date) => {
  const end = nextMonth(start)
  return own
    .filter((payment) => !payment.failed && payment.at >= start && payment.at < end)
    .reduce((sum, payment) => sum + payment.amount, 0)
}

/** Birzum's plan / fakt: one row per nasiya handed over. */
export function PlanFact({ bounds, today }: { bounds: DateRange; today: Date }) {
  const { t } = useI18n()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const clients = clientsStore.useAll()
  const merchants = merchantsStore.useAll()

  const running = applications.filter((a) => a.status === 'handed' || a.status === 'closed')
  const firstHanded = running.reduce<Date>((min, a) => {
    const handed = handedAtOf(a)
    return handed && handed < min ? handed : min
  }, today)
  const months = useMemo(() => monthsOf(bounds, firstHanded, today), [bounds, firstHanded, today])

  const rows = useMemo(() => {
    if (!months.length) return []
    const windowStart = months[0]
    const windowEnd = nextMonth(months[months.length - 1])
    const byApp = new Map<string, Payment[]>()
    for (const payment of payments) {
      const list = byApp.get(payment.applicationId)
      if (list) list.push(payment)
      else byApp.set(payment.applicationId, [payment])
    }
    const out: PlanFactRow[] = []
    for (const application of running) {
      const handedAt = handedAtOf(application)
      if (!handedAt || handedAt >= windowEnd) continue
      const closedAt = application.history.find((entry) => entry.status === 'closed')?.at
      if (closedAt && closedAt < windowStart) continue
      const own = byApp.get(application.id) ?? []
      const client = clients.find((item) => item.id === application.clientId)
      const progress = progressOf(application, payments, today)
      const name = client ? fullName(client) : application.client.name
      out.push({
        id: application.id,
        name,
        nameHref: clientPath(application.clientId),
        ref: `№${application.number}`,
        refHref: applicationPath(application.id),
        sub: merchants.find((item) => item.id === application.merchantId)?.name ?? '—',
        groupId: application.merchantId,
        date: handedAt,
        values: [application.installmentTotal, application.downPayment, progress.remaining],
        months: months.map((start) => ({
          plan: planOf(application, own, start),
          fact: factOf(own, start),
        })),
        debtToday: progress.overdue,
        search: `${name} ${client?.phone ?? application.client.phone} ${application.number}`,
      })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [months, running, payments, clients, merchants, today])

  return (
    <PlanFactView
      rows={rows}
      months={months}
      today={today}
      groups={merchants.map((item) => ({ value: item.id, label: item.name }))}
      labels={{
        name: t('planFact.col.client'),
        date: t('planFact.col.date'),
        values: [t('planFact.col.sum'), t('planFact.col.down'), t('planFact.col.remaining')],
        group: t('products.col.merchant'),
        allGroups: t('products.allMerchants'),
        search: t('planFact.search'),
      }}
    />
  )
}
