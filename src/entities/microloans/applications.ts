import { loanProductsStore, monthlyOf, rateOf, termsOf } from '@/entities/microloans/products'
import { decisionRulesOf } from '@/entities/microloans/rules'
import type { StatusTone } from '@/shared/ui/StatusBadge'
import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

/**
 * Where a microloan ariza is, in the order it moves:
 * - review: the app's checks are running (MyID, credit history, income)
 * - manual: the rules could not decide; an admin has to
 * - approved / counter: offered as asked, or a smaller sum; waiting for the borrower to sign
 * - signed: signed with the SMS code, money on its way to the card
 * - paidOut: the money reached the card; the loan is open
 * - declined, expired (the offer was not signed in time)
 */
export const LOAN_APP_STATUSES = [
  'review',
  'manual',
  'approved',
  'counter',
  'signed',
  'paidOut',
  'declined',
  'expired',
] as const
export type LoanAppStatus = (typeof LOAN_APP_STATUSES)[number]

export const loanAppStatusTone: Record<LoanAppStatus, StatusTone> = {
  review: 'info',
  manual: 'warning',
  approved: 'info',
  counter: 'info',
  signed: 'info',
  paidOut: 'success',
  declined: 'danger',
  expired: 'neutral',
}

/** Waiting for the borrower: the offer they have not signed yet. */
export const isOffer = (status: LoanAppStatus) => status === 'approved' || status === 'counter'

export const PURPOSES = ['business', 'repair', 'education', 'health', 'family', 'other'] as const
export type Purpose = (typeof PURPOSES)[number]

export const DECLINE_REASONS = ['income', 'credit', 'myid', 'debt', 'other'] as const
export type DeclineReason = (typeof DECLINE_REASONS)[number]

/** What the app's checks found before any decision. */
export type LoanChecks = {
  myid: 'ok' | 'mismatch'
  /** Credit bureau: no loans before, loans paid on time, or late payments in the last 5 years. */
  credit: 'none' | 'good' | 'late'
  /** Late payments found, for "late". */
  lateCount?: number
  /** The monthly payment as a share of the stated income, %. */
  load: number
}

export type LoanAppEvent = {
  at: Date
  status: LoanAppStatus
  /** Who moved it: the app's rules, the borrower, or an admin by name. */
  by: 'rules' | 'borrower' | 'system' | { admin: string }
  note?: string
}

/** One microloan application from a brand's app. */
export type LoanApplication = {
  id: string
  brand: Brand
  number: number
  createdAt: Date
  borrower: { name: string; phone: string; passport: string; birthDate: string }
  productId: string
  /** Asked for. */
  amount: number
  term: number
  rate: number
  purpose: Purpose
  income: number
  workplace: string
  card: { brand: 'uzcard' | 'humo'; last4: string }
  checks: LoanChecks
  status: LoanAppStatus
  /** The sum offered when it is smaller than asked (counter-offer). */
  offered?: number
  decline?: { reason: DeclineReason; comment?: string }
  /** The offer stands until then. */
  offerUntil?: Date
  /** The loan this ariza opened, once paid out. */
  loanNumber?: string
  history: LoanAppEvent[]
}

/** The sum the loan is (or would be) for: the counter-offer if there is one. */
export const sumOf = (app: Pick<LoanApplication, 'amount' | 'offered'>) => app.offered ?? app.amount
export const monthlyOfApp = (app: LoanApplication) => monthlyOf(sumOf(app), app.rate, app.term)

// ── Sample data: about forty arizalar per brand over the last two months. Replace with the API.

const PEOPLE = [
  ['Karimova Dilnoza Rustam qizi', '12.05.1995'],
  ['Toshmatov Jasur Bahodir oʻgʻli', '03.11.1988'],
  ['Yusupova Madina Akmal qizi', '21.07.1992'],
  ['Rahimov Sardor Olim oʻgʻli', '09.02.1985'],
  ['Abdullayeva Nigora Shavkat qizi', '30.09.1990'],
  ['Qodirov Bekzod Anvar oʻgʻli', '17.04.1997'],
  ['Ergasheva Gulnora Rustamovna', '05.12.1979'],
  ['Mirzayev Javlon Ulugʻbek oʻgʻli', '26.06.1993'],
  ['Saidova Kamola Ilhom qizi', '14.01.1999'],
  ['Nazarov Otabek Shuhrat oʻgʻli', '08.08.1986'],
  ['Xolmatova Zarina Baxtiyor qizi', '19.03.1994'],
  ['Hasanov Doniyor Erkin oʻgʻli', '02.10.1982'],
  ['Turgʻunova Shahnoza Alisher qizi', '27.05.1991'],
  ['Ismoilov Akmal Nodir oʻgʻli', '11.11.1989'],
  ['Sobirova Feruza Komil qizi', '06.06.1996'],
] as const
const WORK = [
  'Oʻz biznesim — oziq-ovqat doʻkoni',
  'Toshkent shahar 45-maktab, oʻqituvchi',
  'Artel Electronics, operator',
  'Yakka tartibdagi tadbirkor, taksi',
  'Respublika shifoxonasi, hamshira',
  'Bozorda savdo, kiyim-kechak',
  'Qurilish firmasi, usta',
  'Xalq banki, kassir',
] as const

// Same numbers every load
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

const NOW = new Date()
const ago = (days: number, hour: number, minute: number) => {
  const at = new Date(NOW)
  at.setDate(at.getDate() - days)
  at.setHours(hour, minute, 0, 0)
  return at
}
const later = (from: Date, minutes: number) => new Date(from.getTime() + minutes * 60_000)

function seed(brand: Brand, base: number, prefix: string): LoanApplication[] {
  const next = random(base)
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]
  const products = loanProductsStore.getAll().filter((p) => p.brand === brand && p.enabled)
  const rules = decisionRulesOf(brand)
  const list: LoanApplication[] = []
  for (let i = 0; i < 40; i++) {
    const product = pick(products)
    const [name, birthDate] = PEOPLE[(i * 7 + base) % PEOPLE.length]
    // More of them recently, as with any app that grows
    const days = Math.floor((i / 40) ** 1.6 * 60)
    const createdAt = ago(days, 8 + Math.floor(next() * 11), Math.floor(next() * 60))
    const steps = Math.max(1, Math.floor((product.max - product.min) / 1_000_000 / 4))
    const amount = product.min + Math.floor(next() * steps) * 1_000_000 * 2
    const term = pick(termsOf(product))
    const rate = rateOf(product, amount, term)
    const monthly = monthlyOf(amount, rate, term)
    const income = Math.round(monthly / (0.18 + next() * 0.42) / 100_000) * 100_000
    const load = Math.round((monthly / income) * 100)
    const credit = pick(['good', 'good', 'good', 'none', 'late'] as const)
    const myid = next() < 0.05 ? 'mismatch' : 'ok'
    const checks: LoanChecks = {
      myid,
      credit,
      lateCount: credit === 'late' ? 1 + Math.floor(next() * 3) : undefined,
      load,
    }

    // What the rules made of it, then how far it got since
    const fresh = days === 0
    let status: LoanAppStatus
    let offered: number | undefined
    let decline: LoanApplication['decline']
    const history: LoanAppEvent[] = [{ at: createdAt, status: 'review', by: 'borrower' }]
    const decidedAt = later(createdAt, 2)
    if (fresh && i % 4 === 0) status = 'review'
    else if (myid === 'mismatch') {
      status = 'declined'
      decline = { reason: 'myid' }
    } else if (credit === 'late' && checks.lateCount! > rules.lateManualUpTo) {
      status = 'declined'
      decline = { reason: 'credit' }
    } else if (credit === 'late' || (load > rules.approveUpTo && load <= rules.manualUpTo))
      status = 'manual'
    else if (load > rules.manualUpTo) {
      // The largest sum whose payment fits in half the income
      const fits =
        Math.floor((((income * (rules.counterTarget / 100)) / monthly) * amount) / 1_000_000) *
        1_000_000
      if (fits >= product.min) {
        status = 'counter'
        offered = fits
      } else {
        status = 'declined'
        decline = { reason: 'income' }
      }
    } else status = 'approved'

    // Older ones that were offered moved on: signed and paid out, or the offer ran out
    if (status !== 'review') history.push({ at: decidedAt, status, by: 'rules' })
    if ((status === 'approved' || status === 'counter') && days === 1 && i % 2 === 0) {
      // Signed a moment ago; the money is on its way
      history.push({ at: later(decidedAt, 40), status: 'signed', by: 'borrower' })
      status = 'signed'
    } else if ((status === 'approved' || status === 'counter') && days > 3) {
      if (next() < 0.8) {
        const signedAt = later(decidedAt, 30 + Math.floor(next() * 600))
        history.push({ at: signedAt, status: 'signed', by: 'borrower' })
        history.push({ at: later(signedAt, 3), status: 'paidOut', by: 'system' })
        status = 'paidOut'
      } else {
        history.push({
          at: later(decidedAt, rules.offerDays * 24 * 60),
          status: 'expired',
          by: 'system',
        })
        status = 'expired'
      }
    } else if (status === 'manual' && days > 7) {
      // An admin decided these already
      const admin = { admin: pick(['Sardor Saidov', 'Malika Rasulova']) }
      const at = later(createdAt, 90 + Math.floor(next() * 300))
      if (next() < 0.6) {
        history.push({ at, status: 'approved', by: admin })
        const signedAt = later(at, 120)
        history.push({ at: signedAt, status: 'signed', by: 'borrower' })
        history.push({ at: later(signedAt, 3), status: 'paidOut', by: 'system' })
        status = 'paidOut'
      } else {
        history.push({ at, status: 'declined', by: admin, note: 'Kredit tarixida kechikishlar' })
        status = 'declined'
        decline = { reason: 'credit', comment: 'Kredit tarixida kechikishlar' }
      }
    }

    const number = base * 100 + 4000 + (40 - i)
    list.push({
      id: `${brand}-${number}`,
      brand,
      number,
      createdAt,
      borrower: {
        name,
        phone: `9${(1 + (i % 8)) * 1}${String(1000000 + Math.floor(next() * 8999999)).slice(0, 7)}`,
        passport: `A${'BCDE'[i % 4]}${String(1000000 + Math.floor(next() * 8999999)).slice(0, 7)}`,
        birthDate,
      },
      productId: product.id,
      amount,
      term,
      rate,
      purpose: pick(PURPOSES),
      income,
      workplace: pick(WORK),
      card: {
        brand: next() < 0.5 ? 'humo' : 'uzcard',
        last4: String(1000 + Math.floor(next() * 8999)),
      },
      checks,
      status,
      offered,
      decline,
      offerUntil: isOffer(status) ? later(decidedAt, rules.offerDays * 24 * 60) : undefined,
      loanNumber:
        status === 'paidOut'
          ? `${prefix}-${createdAt.getFullYear()}-${String(number * 3).padStart(6, '0')}`
          : undefined,
      history,
    })
  }
  return list
}

export const loanApplicationsStore = createStore<LoanApplication>([
  ...seed('fortuna', 11, 'FB'),
  ...seed('vodiy', 23, 'VT'),
])
