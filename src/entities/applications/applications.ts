import { createStore } from '@/shared/lib/createStore'
import { productsStore } from '../catalog/products'
import { ratesStore } from '../pricing/pricing'

/** The same statuses as the merchant and client apps. */
export const APPLICATION_STATUSES = [
  'pending',
  'processing',
  'handed',
  'closed',
  'rejected',
  'cancelled',
] as const
/**
 * `pending`: a shopper sent it from the client app, the merchant has not taken it yet.
 * `processing`: the merchant is drawing up the contract. `handed`: goods given, nasiya running.
 * `closed`: fully paid. `rejected` and `cancelled` are final.
 */
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const REJECT_REASONS = ['noStock', 'unverified', 'limit', 'clientDeclined', 'other'] as const
export type RejectReason = (typeof REJECT_REASONS)[number]

/** Who made a change: merchant staff, the shopper, or the system. */
export type Actor = { kind: 'staff' | 'customer' | 'system'; name: string }
export type HistoryEntry = { status: ApplicationStatus; at: Date; by: Actor; comment?: string }

export type ApplicationLine = { name: string; variant?: string; price: number; quantity: number }

export type Application = {
  id: string
  /** As every app shows it, e.g. 231063. */
  number: number
  merchantId: string
  filialId: string
  /** Where it started: a shopper in the client app, or a seller in the merchant app. */
  source: 'client' | 'merchant'
  client: { name: string; phone: string; pinfl: string }
  createdAt: Date
  status: ApplicationStatus
  lines: ApplicationLine[]
  goodsTotal: number
  downPayment: number
  term: number
  markupPercent: number
  /** Financed sum plus markup. */
  installmentTotal: number
  monthlyPayment: number
  /** Day of the month the payment is taken, 1 to 10. */
  paymentDay: number
  fulfilment: { method: 'pickup' | 'delivery'; address?: string }
  contractNumber?: string
  rejection?: { reason: RejectReason; comment: string }
  cancelComment?: string
  /** Every status change, oldest first. */
  history: HistoryEntry[]
}

/** The part Birzum finances, and owes the merchant once the goods are handed over. */
export const financedOf = (application: Application) =>
  application.goodsTotal - application.downPayment

/** When the goods were handed over, if they were. */
export const handedAtOf = (application: Application) =>
  application.history.find((entry) => entry.status === 'handed')?.at

// Invented sample arizalar from 1 September to today, worked out from a few rules so
// statuses, history and payouts agree. Replace with the API.
const DAY = 24 * 60 * 60 * 1000
const CLIENTS: [string, string][] = [
  ['Dilnoza Rahimova', '901234567'],
  ['Jasur Toshmatov', '935557711'],
  ['Malika Yusupova', '977001122'],
  ['Otabek Karimov', '909876543'],
  ['Nigora Saidova', '881112233'],
  ['Sardor Aliyev', '946663344'],
  ['Kamola Ergasheva', '998887766'],
  ['Bekzod Mirzayev', '915554433'],
  ['Shahnoza Qodirova', '933332211'],
  ['Ulugʻbek Nazarov', '971239876'],
  ['Feruza Abdullayeva', '903334455'],
  ['Javohir Rasulov', '950001199'],
]
const STAFF: Record<string, string[]> = {
  m1: ['Aziz Karimov', 'Laylo Sobirova', 'Rustam Olimov'],
  m2: ['Nodira Yusupova', 'Timur Ahmedov'],
  m3: ['Bekzod Qodirov'],
  m4: ['Sherzod Aliyev'],
}
const FILIALS: Record<string, string[]> = {
  m1: ['f1', 'f2', 'f3'],
  m2: ['f4', 'f5'],
  m3: ['f6'],
  m4: ['f7', 'f8'],
}
const ADDRESSES = [
  'Toshkent, Chilonzor 19-kvartal, 7-uy',
  'Toshkent, Yunusobod 11-mavze, 23-uy',
  'Samarqand, Rudakiy koʻchasi, 44',
  'Toshkent, Mirzo Ulugʻbek, Buyuk Ipak Yoʻli 150',
]
const NOTES: Record<RejectReason, string> = {
  noStock: 'Bu rang tugab qoldi, yangi partiya 2 haftada.',
  unverified: 'Pasport rasmi MyID bilan mos kelmadi.',
  limit: 'Limit yetmadi, klient boshlangʻich toʻlovni oshirmadi.',
  clientDeclined: 'Klient boshqa modelni tanlamoqchi.',
  other: 'Klient telefonni koʻtarmadi.',
}

function seed(): Application[] {
  // A fixed pseudo-random sequence, so the samples are the same on every load
  let state = 11
  const rand = () => (state = (state * 48271) % 2147483647) / 2147483647
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)]
  const rates = ratesStore.getAll().filter((rate) => rate.enabled)
  const products = productsStore.getAll()
  const out: Application[] = []
  let number = 231000
  const end = new Date(2026, 9, 16, 15).getTime()
  const lastDay = new Date(2026, 9, 16).getTime()

  for (let day = new Date(2026, 8, 1).getTime(); day <= end; day += DAY) {
    // Today brings a few extra, still open, so the waiting tabs are not empty
    const extra = day === lastDay ? ['m1', 'm2', 'm1', 'm3', 'm2', 'm1'] : []
    for (const merchantId of [...Object.keys(FILIALS), ...extra]) {
      // Texno Dunyo stopped selling at the end of September
      if (merchantId === 'm4' && day >= new Date(2026, 9, 1).getTime()) continue
      const per = merchantId === 'm4' ? 0.2 : merchantId === 'm3' ? 0.55 : 0.75
      if (rand() > per && day !== lastDay) continue
      const own = products.filter((product) => product.merchantId === merchantId)
      if (own.length === 0) continue
      const hours = day === lastDay ? 9 + rand() * 5.5 : 9 + Math.floor(rand() * 10)
      const createdAt = new Date(day + Math.round(hours * 60) * 60 * 1000)
      if (createdAt.getTime() > end) continue
      const age = (end - createdAt.getTime()) / DAY

      const lines: ApplicationLine[] = Array.from({ length: rand() > 0.8 ? 2 : 1 }, () => {
        const product = pick(own)
        const variant = pick(product.variants)
        return {
          name: product.name.uz,
          variant: variant.label.uz || undefined,
          price: variant.price,
          quantity: 1,
        }
      })
      const goodsTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
      const downPayment =
        rand() > 0.6 ? Math.round((goodsTotal * (0.1 + rand() * 0.2)) / 100_000) * 100_000 : 0
      const rate = pick(rates)
      const installmentTotal = Math.round((goodsTotal - downPayment) * (1 + rate.markup / 100))
      const [name, phone] = pick(CLIENTS)
      const source = rand() > 0.55 ? 'client' : 'merchant'
      const staff: Actor = { kind: 'staff', name: pick(STAFF[merchantId]) }
      const customer: Actor = { kind: 'customer', name }
      const at = (hours: number) => new Date(createdAt.getTime() + hours * 3600 * 1000)

      // Older arizalar have reached an end; the last day or two are still open
      const roll = rand()
      let status: ApplicationStatus
      if (age < 0.25 || (day === lastDay && roll < 0.6))
        status = source === 'client' ? 'pending' : 'processing'
      else if (age < 1.5) status = roll < 0.5 ? 'processing' : roll < 0.9 ? 'handed' : 'rejected'
      else
        status =
          roll < 0.74
            ? rate.term === 3 && age > 30
              ? 'closed'
              : 'handed'
            : roll < 0.88
              ? 'rejected'
              : 'cancelled'

      const history: HistoryEntry[] = [
        source === 'client'
          ? { status: 'pending', at: createdAt, by: customer }
          : { status: 'processing', at: createdAt, by: staff },
      ]
      if (source === 'client' && status !== 'pending' && status !== 'rejected')
        history.push({ status: 'processing', at: at(0.5), by: staff })
      const reason = pick([...REJECT_REASONS])
      if (status === 'rejected')
        history.push({ status: 'rejected', at: at(1), by: staff, comment: NOTES[reason] })
      if (status === 'cancelled')
        history.push({
          status: 'cancelled',
          at: at(2),
          by: rand() > 0.5 ? customer : staff,
          comment: 'Klient keyinroq olishini aytdi.',
        })
      if (status === 'handed' || status === 'closed')
        history.push({ status: 'handed', at: at(1.5), by: staff })
      if (status === 'closed')
        history.push({ status: 'closed', at: at(24 * 28), by: { kind: 'system', name: 'Birzum' } })

      const method = rand() > 0.7 ? 'delivery' : 'pickup'
      out.push({
        id: String(number),
        number,
        merchantId,
        filialId: pick(FILIALS[merchantId]),
        source,
        client: { name, phone, pinfl: `3${String(number).padStart(13, '0').slice(-13)}` },
        createdAt,
        status,
        lines,
        goodsTotal,
        downPayment,
        term: rate.term,
        markupPercent: rate.markup,
        installmentTotal,
        monthlyPayment: Math.floor(installmentTotal / rate.term),
        paymentDay: 1 + Math.floor(rand() * 10),
        fulfilment: method === 'delivery' ? { method, address: pick(ADDRESSES) } : { method },
        contractNumber: status === 'handed' || status === 'closed' ? `NS-${number}` : undefined,
        rejection: status === 'rejected' ? { reason, comment: NOTES[reason] } : undefined,
        cancelComment: status === 'cancelled' ? 'Klient keyinroq olishini aytdi.' : undefined,
        history,
      })
      number++
    }
  }
  return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export const applicationsStore = createStore<Application>(seed())
