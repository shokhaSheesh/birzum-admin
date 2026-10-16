import { createStore } from '@/shared/lib/createStore'
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

// Invented sample sales and payouts, worked out from a few rules so they add up: weekly
// merchants are paid on the Tuesday after each week, monthly ones on the 5th. The last
// weekly payout of Mediapark is still being sent; this week's sales are still owed.
// Replace with the API.
const CLIENTS = [
  'Dilnoza Rahimova',
  'Jasur Toshmatov',
  'Malika Yusupova',
  'Otabek Karimov',
  'Nigora Saidova',
  'Sardor Aliyev',
  'Kamola Ergasheva',
  'Bekzod Mirzayev',
  'Shahnoza Qodirova',
  'Ulugʻbek Nazarov',
]
const PRODUCTS: Record<string, string[]> = {
  m1: ['iPhone 18 Pro', 'Televizor 43', 'Artel kir yuvish mashinasi', 'Xiaomi Redmi 15'],
  m2: ['LG kir yuvish mashinasi', 'Lenovo IdeaPad noutbuk', 'iPhone 18 Pro Max'],
  m3: ['iPhone 18', 'Televizor 55 Smart', 'HP 15 noutbuk', 'iPhone 18 Pro'],
  m4: ['Samsung muzlatgich'],
}
const FILIALS: Record<string, string[]> = {
  m1: ['f1', 'f2', 'f3'],
  m2: ['f4', 'f5'],
  m3: ['f6'],
  m4: ['f7', 'f8'],
}
const SCHEDULE: Record<string, 'weekly' | 'monthly'> = {
  m1: 'weekly',
  m2: 'weekly',
  m3: 'monthly',
  m4: 'weekly',
}

function seed() {
  // A fixed pseudo-random sequence, so the samples are the same on every load
  let state = 7
  const next = () => (state = (state * 48271) % 2147483647) / 2147483647
  const sales: Sale[] = []
  let number = 231000
  const start = new Date(2026, 8, 1)
  const end = new Date(2026, 9, 16)
  for (let day = start.getTime(); day <= end.getTime(); day += DAY) {
    for (const merchantId of Object.keys(PRODUCTS)) {
      // Texno Dunyo stopped selling at the end of September
      if (merchantId === 'm4' && day >= new Date(2026, 9, 1).getTime()) continue
      if (next() > (merchantId === 'm4' ? 0.15 : 0.45)) continue
      const products = PRODUCTS[merchantId]
      const filials = FILIALS[merchantId]
      sales.push({
        id: String(number),
        number: number++,
        merchantId,
        filialId: filials[Math.floor(next() * filials.length)],
        client: CLIENTS[Math.floor(next() * CLIENTS.length)],
        product: products[Math.floor(next() * products.length)],
        handedAt: new Date(day + (10 + Math.floor(next() * 9)) * 60 * 60 * 1000),
        amount: Math.round((2 + next() * 16) * 10) * 100_000,
      })
    }
  }

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
  for (const merchantId of Object.keys(PRODUCTS)) {
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
