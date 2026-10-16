import { createStore } from '@/shared/lib/createStore'
import { applicationsStore, financedOf, handedAtOf } from '../applications/applications'
import type { Merchant } from '../merchants/merchants'

/**
 * One nasiya sale the merchant has handed over. Birzum owes the merchant its financed sum (the
 * price less the shopper's down payment) in full, until a payout covers it.
 */
export type Sale = {
  id: string
  /** The ariza number, as both apps show it. */
  number: number
  merchantId: string
  filialId: string
  client: string
  product: string
  handedAt: Date
  /** What Birzum owes for it, in UZS. */
  amount: number
  /** The payout that covers it. Missing: still owed. */
  payoutId?: string
}

export type PayoutState = 'processing' | 'paid'

/**
 * A bank transfer from Birzum to a merchant, created by an admin. It covers a set of sales and
 * is "Jarayonda" until the admin marks it sent.
 */
export type Payout = {
  id: string
  merchantId: string
  /** As it appears on the bank statement, e.g. BZ-261013-042. */
  reference: string
  date: Date
  amount: number
  saleIds: string[]
  state: PayoutState
  createdBy: string
  note?: string
  /** When it was marked sent. */
  paidAt?: Date
}

const DAY = 24 * 60 * 60 * 1000

/** BZ-YYMMDD-NNN, the sequence from how many payouts exist. */
export const referenceFor = (date: Date, sequence: number) =>
  `BZ-${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`

/** When the merchant is next due a payout: next Tuesday, or the 5th of next month. */
export function nextDueDate(merchant: Pick<Merchant, 'payoutSchedule'>, today: Date) {
  if (merchant.payoutSchedule === 'monthly')
    return new Date(today.getFullYear(), today.getMonth() + 1, 5)
  const ahead = (2 - today.getDay() + 7) % 7 || 7
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + ahead)
}

// Sample payouts worked out from the sample arizalar: weekly merchants are paid on the
// Tuesday after each week, monthly ones on the 5th. Mediapark's last weekly payout is still
// being sent; this week's sales are still owed. Replace with the API.
const SCHEDULE: Record<string, 'weekly' | 'monthly'> = {
  m1: 'weekly',
  m2: 'weekly',
  m3: 'monthly',
  m4: 'weekly',
}

function seed() {
  const sales: Sale[] = applicationsStore
    .getAll()
    .filter((application) => application.status === 'handed' || application.status === 'closed')
    .map((application) => ({
      id: application.id,
      number: application.number,
      merchantId: application.merchantId,
      filialId: application.filialId,
      client: application.client.name,
      product: application.lines.map((line) => line.name).join(', '),
      handedAt: handedAtOf(application)!,
      amount: financedOf(application),
    }))

  const payouts: Payout[] = []
  const lastMonday = new Date(2026, 9, 12)
  const add = (merchantId: string, date: Date, covered: Sale[], state: PayoutState) => {
    if (covered.length === 0) return
    const id = `po${payouts.length + 1}`
    covered.forEach((sale) => (sale.payoutId = id))
    payouts.push({
      id,
      merchantId,
      reference: referenceFor(date, payouts.length + 41),
      date,
      amount: covered.reduce((sum, sale) => sum + sale.amount, 0),
      saleIds: covered.map((sale) => sale.id),
      state,
      createdBy: payouts.length % 3 === 0 ? 'Malika Rasulova' : 'Sardor Saidov',
      paidAt: state === 'paid' ? new Date(date.getTime() + 3 * 60 * 60 * 1000) : undefined,
    })
  }
  for (const merchantId of Object.keys(SCHEDULE)) {
    const own = sales.filter((sale) => sale.merchantId === merchantId)
    if (SCHEDULE[merchantId] === 'monthly') {
      // September, paid on 5 October; October is still owed
      add(
        merchantId,
        new Date(2026, 9, 5, 11),
        own.filter((sale) => sale.handedAt.getMonth() === 8),
        'paid',
      )
      continue
    }
    for (let monday = new Date(2026, 7, 31); monday < lastMonday;) {
      const sunday = new Date(monday.getTime() + 7 * DAY)
      const tuesday = new Date(sunday.getTime() + DAY + 11 * 60 * 60 * 1000)
      const week = own.filter((sale) => sale.handedAt >= monday && sale.handedAt < sunday)
      const latest = sunday.getTime() === lastMonday.getTime()
      add(merchantId, tuesday, week, latest && merchantId === 'm1' ? 'processing' : 'paid')
      monday = sunday
    }
  }
  payouts.sort((a, b) => b.date.getTime() - a.date.getTime())
  return { sales, payouts }
}

const samples = seed()
export const salesStore = createStore<Sale>(samples.sales)
export const payoutsStore = createStore<Payout>(samples.payouts)

/** Sales no payout covers yet, oldest first. */
export const owedSales = (sales: Sale[], merchantId?: string) =>
  sales
    .filter((sale) => !sale.payoutId && (!merchantId || sale.merchantId === merchantId))
    .sort((a, b) => a.handedAt.getTime() - b.handedAt.getTime())

export const sumOf = (items: { amount: number }[]) =>
  items.reduce((sum, item) => sum + item.amount, 0)
