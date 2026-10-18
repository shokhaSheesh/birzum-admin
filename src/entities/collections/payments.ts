import { createStore, newId } from '@/shared/lib/createStore'
import { addDays, startOfDay } from '@/shared/lib/dates'
import { applicationsStore, handedAtOf, type Application } from '../applications/applications'
import { clientsStore } from '../clients/clients'

/**
 * `monthly`: the payment of the month. `extra`: "Boshqa summa" in the client app; it comes off
 * the last payments, so the nasiya ends sooner. `full`: "Toʻliq yopish", the whole rest.
 */
export const PAYMENT_KINDS = ['monthly', 'extra', 'full'] as const
export type PaymentKind = (typeof PAYMENT_KINDS)[number]

/**
 * `auto`: Birzum took it from the card on the payment day. `app`: the shopper paid in the app.
 * `charge`: an admin took it from the card by hand. `cash` and `transfer`: paid outside the
 * apps (at a shop, or to Birzum's bank account) and entered by an admin.
 */
export const PAYMENT_METHODS = ['auto', 'app', 'charge', 'cash', 'transfer'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
/** Methods an admin enters by hand, with a document number. */
export const MANUAL_METHODS = ['cash', 'transfer'] as const
export type ManualMethod = (typeof MANUAL_METHODS)[number]

export const FAIL_REASONS = ['funds', 'cardBlocked', 'cardExpired'] as const
export type FailReason = (typeof FAIL_REASONS)[number]

/** Money coming in from a shopper, or a card charge that failed. */
export type Payment = {
  id: string
  applicationId: string
  clientId: string
  merchantId: string
  at: Date
  amount: number
  kind: PaymentKind
  method: PaymentMethod
  /** The card charged; none for cash and transfers. */
  cardId?: string
  /** Set when the charge did not go through; no money came in. */
  failed?: FailReason
  /** The receipt or payment order number of a cash or bank payment. */
  reference?: string
  /** The admin who charged the card or entered the payment. */
  by?: string
  note?: string
}

export type InstallmentState = 'paid' | 'due' | 'overdue'
export type Installment = {
  number: number
  dueDate: Date
  amount: number
  /** How much of it is paid so far. */
  paid: number
  state: InstallmentState
  paidAt?: Date
}

/** Payment days of a nasiya: one a month from the month after the hand-over. */
function dueDatesOf(application: Application) {
  const handed = handedAtOf(application)
  if (!handed) return []
  return Array.from(
    { length: application.term },
    (_, i) => new Date(handed.getFullYear(), handed.getMonth() + 1 + i, application.paymentDay),
  )
}

/** Every monthly payment of a nasiya, with what is paid. The last one takes the rounding. */
export function scheduleOf(
  application: Application,
  payments: Payment[],
  today: Date,
): Installment[] {
  const dates = dueDatesOf(application)
  const items: Installment[] = dates.map((dueDate, i) => ({
    number: i + 1,
    dueDate,
    amount:
      i === dates.length - 1
        ? application.installmentTotal - application.monthlyPayment * (dates.length - 1)
        : application.monthlyPayment,
    paid: 0,
    state: 'due',
  }))
  const own = payments
    .filter((payment) => payment.applicationId === application.id && !payment.failed)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
  for (const payment of own) {
    let left = payment.amount
    // A monthly payment settles the earliest open month; money paid ahead settles the last
    const order = payment.kind === 'extra' ? [...items].reverse() : items
    for (const item of order) {
      if (left <= 0) break
      const part = Math.min(left, item.amount - item.paid)
      if (part <= 0) continue
      item.paid += part
      left -= part
      if (item.paid >= item.amount) item.paidAt = payment.at
    }
  }
  const day = startOfDay(today)
  for (const item of items)
    item.state = item.paid >= item.amount ? 'paid' : item.dueDate < day ? 'overdue' : 'due'
  return items
}

/** A nasiya in figures: months paid, the rest, what is late and since when, the next date. */
export function progressOf(application: Application, payments: Payment[], today: Date) {
  const items = scheduleOf(application, payments, today)
  const late = items.filter((item) => item.state === 'overdue')
  return {
    items,
    paid: items.filter((item) => item.state === 'paid').length,
    remaining: items.reduce((sum, item) => sum + item.amount - item.paid, 0),
    overdue: late.reduce((sum, item) => sum + item.amount - item.paid, 0),
    overdueCount: late.length,
    overdueSince: late[0]?.dueDate ?? null,
    next: items.find((item) => item.state === 'due')?.dueDate ?? null,
  }
}

/** Whole days between a payment day and today. */
export const daysLate = (since: Date, today: Date) =>
  Math.round((startOfDay(today).getTime() - startOfDay(since).getTime()) / 86_400_000)

// Invented sample payments, worked out from the sample arizalar up to the moment the samples
// were made: everything due is paid, except the latest payment of a shopper marked late.
// Replace with the API.
const SAMPLED_AT = new Date(2026, 9, 16, 15)

function seed(): Payment[] {
  let state = 29
  const rand = () => (state = (state * 48271) % 2147483647) / 2147483647
  const out: Payment[] = []
  let n = 0
  const add = (payment: Omit<Payment, 'id'>) => out.push({ id: `p${++n}`, ...payment })
  const at = (day: Date, hour: number) =>
    new Date(day.getTime() + Math.round((hour + rand()) * 60) * 60_000)

  for (const application of applicationsStore.getAll()) {
    if (application.status !== 'handed' && application.status !== 'closed') continue
    const client = clientsStore.get(application.clientId)
    if (!client) continue
    const base = {
      applicationId: application.id,
      clientId: client.id,
      merchantId: application.merchantId,
      cardId: client.cards[0].id,
    }
    const closedAt = application.history.find((entry) => entry.status === 'closed')?.at
    const until = closedAt ?? SAMPLED_AT
    const dates = dueDatesOf(application).filter((date) => date <= until)
    const inApp = rand() < 0.35
    let paidSum = 0

    dates.forEach((dueDate, i) => {
      const amount = application.monthlyPayment
      const missed = !closedAt && client.late && i === dates.length - 1
      if (missed) {
        // The card is tried on the day and every three days after
        for (let day = dueDate; day <= SAMPLED_AT; day = addDays(day, 3))
          add({
            ...base,
            at: at(day, 8),
            amount,
            kind: 'monthly',
            method: 'auto',
            failed: rand() < 0.8 ? 'funds' : 'cardBlocked',
          })
        return
      }
      paidSum += amount
      if (inApp) {
        add({
          ...base,
          at: at(addDays(dueDate, -Math.floor(rand() * 3)), 10 + rand() * 10),
          amount,
          kind: 'monthly',
          method: 'app',
        })
      } else if (rand() < 0.12) {
        // Not enough on the card on the day; the shopper paid a day or two later
        add({
          ...base,
          at: at(dueDate, 8),
          amount,
          kind: 'monthly',
          method: 'auto',
          failed: 'funds',
        })
        add({
          ...base,
          at: at(addDays(dueDate, 1 + Math.floor(rand() * 2)), 12 + rand() * 8),
          amount,
          kind: 'monthly',
          method: 'app',
        })
      } else add({ ...base, at: at(dueDate, 8), amount, kind: 'monthly', method: 'auto' })
    })

    if (closedAt) {
      add({
        ...base,
        at: closedAt,
        amount: application.installmentTotal - paidSum,
        kind: 'full',
        method: 'app',
      })
    } else if (!client.late && rand() < 0.14) {
      // Some pay ahead in the middle of the month
      const day = new Date(2026, 9, 11 + Math.floor(rand() * 5))
      const amount = Math.min(
        (5 + Math.floor(rand() * 16)) * 100_000,
        application.installmentTotal - paidSum - application.monthlyPayment,
      )
      if (amount > 0 && day > (handedAtOf(application) ?? day))
        add({ ...base, at: at(day, 11 + rand() * 9), amount, kind: 'extra', method: 'app' })
    }
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime())
}

export const paymentsStore = createStore<Payment>(seed())

type Entry = Pick<Payment, 'at' | 'amount' | 'method' | 'cardId' | 'reference' | 'by' | 'note'>

/**
 * Records money in for one nasiya. It settles the earliest open months; when it covers the
 * whole rest it is "Toʻliq yopish" and the nasiya closes.
 */
export function recordPayment(application: Application, entry: Entry, today: Date) {
  const { remaining } = progressOf(application, paymentsStore.getAll(), today)
  const full = entry.amount >= remaining
  paymentsStore.save({
    id: newId(),
    applicationId: application.id,
    clientId: application.clientId,
    merchantId: application.merchantId,
    kind: full ? 'full' : 'monthly',
    ...entry,
    amount: Math.min(entry.amount, remaining),
  })
  if (full)
    applicationsStore.update(application.id, {
      status: 'closed',
      history: [
        ...application.history,
        { status: 'closed', at: entry.at, by: { kind: 'system', name: 'Birzum' } },
      ],
    })
}

/** Records a failed charge an admin tried, so it shows among the payments. */
export function recordFailedCharge(
  application: Application,
  entry: Entry & { failed: FailReason },
) {
  paymentsStore.save({
    id: newId(),
    applicationId: application.id,
    clientId: application.clientId,
    merchantId: application.merchantId,
    kind: 'monthly',
    ...entry,
  })
}
