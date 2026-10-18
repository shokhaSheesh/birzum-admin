import {
  loanApplicationsStore,
  sumOf,
  type LoanApplication,
} from '@/entities/microloans/applications'
import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'
import type { StatusTone } from '@/shared/ui/StatusBadge'

/** An early repayment: `afterPaid` is how many monthly payments had been made when it came. */
export type Prepayment = { at: Date; amount: number; kind: 'partial' | 'full'; afterPaid: number }

/**
 * A microloan paid out to a borrower's card, as the app keeps it: the terms, how many monthly
 * payments are made (and when), early repayments, and a late one if any. The schedule is worked
 * out from the sum, rate and term, the same way the app does.
 */
export type Loan = {
  id: string
  brand: Brand
  /** Contract number, e.g. "FB-2026-004512". */
  number: string
  /** The ariza it came from, when it came through the app. */
  applicationId?: string
  borrower: { name: string; phone: string; passport: string }
  productId: string
  amount: number
  /** Yearly interest, %. */
  rate: number
  term: number
  issuedAt: Date
  /** Day of the month payments are due. */
  payDay: number
  card: { brand: 'uzcard' | 'humo'; last4: string }
  paidCount: number
  /** When each monthly payment was made, by its number. */
  paidOn: Record<number, Date>
  prepayments: Prepayment[]
  /** Set while a payment is late: the due day it was missed on. */
  overdueSince?: Date
  closedAt?: Date
}

export const LOAN_STATES = ['active', 'overdue', 'closed'] as const
export type LoanState = (typeof LOAN_STATES)[number]
export const loanStateTone: Record<LoanState, StatusTone> = {
  active: 'info',
  overdue: 'danger',
  closed: 'success',
}
export const stateOf = (loan: Loan): LoanState =>
  loan.closedAt ? 'closed' : loan.overdueSince ? 'overdue' : 'active'

export type Installment = {
  n: number
  due: Date
  amount: number
  principal: number
  interest: number
}

const annuity = (sum: number, r: number, months: number) =>
  r === 0 ? sum / months : (sum * r) / (1 - (1 + r) ** -months)

/** Equal monthly payments; a partial early repayment lowers the ones after it, the end stays. */
export function scheduleOf(
  loan: Pick<Loan, 'amount' | 'rate' | 'term' | 'issuedAt' | 'payDay' | 'prepayments'>,
) {
  const r = loan.rate / 100 / 12
  let left = loan.amount
  let payment = annuity(left, r, loan.term)
  const out: Installment[] = []
  for (let i = 0; i < loan.term && left > 0.5; i++) {
    for (const extra of loan.prepayments) {
      if (extra.kind !== 'partial' || extra.afterPaid !== i) continue
      left -= extra.amount
      payment = annuity(left, r, loan.term - i)
    }
    const interest = left * r
    const principal = i === loan.term - 1 ? left : payment - interest
    left -= principal
    const due = new Date(loan.issuedAt.getFullYear(), loan.issuedAt.getMonth() + i + 1, loan.payDay)
    out.push({ n: i + 1, due, amount: Math.round(principal + interest), principal, interest })
  }
  return out
}

/** Where a loan stands: what is left, the next payment, how far along. */
export function progressOf(loan: Loan) {
  const schedule = scheduleOf(loan)
  const left = loan.closedAt ? [] : schedule.slice(loan.paidCount)
  return {
    schedule,
    next: left[0],
    remaining: Math.round(left.reduce((sum, item) => sum + item.amount, 0)),
    principalLeft: Math.round(left.reduce((sum, item) => sum + item.principal, 0)),
    paid: loan.paidCount,
    total: schedule.length,
  }
}

/** Whole days a late payment has been late. */
export const daysLate = (loan: Loan, today: Date) =>
  loan.overdueSince
    ? Math.max(1, Math.floor((today.getTime() - loan.overdueSince.getTime()) / 86_400_000))
    : 0

// ── Sample loans: one for every ariza the app paid out, plus older ones. Replace with the API.

const NOW = new Date()
const at9 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0)

function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

function build(
  brand: Brand,
  number: string,
  base: Omit<Loan, 'brand' | 'number' | 'paidCount' | 'paidOn' | 'prepayments' | 'id'>,
  next: () => number,
): Loan {
  const loan: Loan = {
    ...base,
    id: number,
    brand,
    number,
    paidCount: 0,
    paidOn: {},
    prepayments: [],
  }
  const schedule = scheduleOf(loan)
  const due = schedule.filter((item) => item.due <= NOW).length
  const roll = next()
  if (due >= schedule.length && roll < 0.9) {
    // Ran its course and was paid off
    loan.paidCount = schedule.length
    loan.closedAt = at9(schedule.at(-1)!.due)
  } else if (roll < 0.12 && due >= 2) {
    // Closed early in one payment, a few months in
    const after = Math.max(1, Math.floor(due / 2))
    loan.paidCount = after
    const when = new Date(schedule[after - 1].due.getTime() + 12 * 86_400_000)
    const left = schedule.slice(after).reduce((sum, item) => sum + item.principal, 0)
    loan.prepayments = [{ at: when, amount: Math.round(left), kind: 'full', afterPaid: after }]
    loan.closedAt = when
  } else if (roll < 0.3 && due >= 1) {
    // Missed the latest payment
    loan.paidCount = due - 1
    loan.overdueSince = schedule[due - 1].due
  } else loan.paidCount = Math.min(due, schedule.length)
  for (let n = 1; n <= loan.paidCount; n++) loan.paidOn[n] = at9(schedule[n - 1].due)
  return loan
}

function seed(brand: Brand, base: number, prefix: string): Loan[] {
  const next = random(base)
  const fromApps = loanApplicationsStore
    .getAll()
    .filter(
      (app): app is LoanApplication & { loanNumber: string } =>
        app.brand === brand && !!app.loanNumber,
    )
    .map((app) => {
      const paid = app.history.find((event) => event.status === 'paidOut')?.at ?? app.createdAt
      return build(
        brand,
        app.loanNumber,
        {
          applicationId: app.id,
          borrower: {
            name: app.borrower.name,
            phone: app.borrower.phone,
            passport: app.borrower.passport,
          },
          productId: app.productId,
          amount: sumOf(app),
          rate: app.rate,
          term: app.term,
          issuedAt: paid,
          payDay: Math.min(28, paid.getDate()),
          card: app.card,
        },
        next,
      )
    })
  // Older loans, from before the app's sample arizalar: a year and more back
  const older = fromApps.slice(0, 18).map((recent, i) => {
    const issuedAt = new Date(
      NOW.getFullYear(),
      NOW.getMonth() - 3 - Math.floor(next() * 22),
      1 + Math.floor(next() * 27),
      11,
    )
    const number = `${prefix}-${issuedAt.getFullYear()}-${String(base * 1000 + i * 37).padStart(6, '0')}`
    return build(
      brand,
      number,
      {
        borrower: recent.borrower,
        productId: recent.productId,
        amount: recent.amount + 1_000_000 * (i % 4),
        rate: recent.rate,
        term: recent.term,
        issuedAt,
        payDay: Math.min(28, issuedAt.getDate()),
        card: recent.card,
      },
      next,
    )
  })
  return [...fromApps, ...older].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
}

export const loansStore = createStore<Loan>([
  ...seed('fortuna', 7, 'FB'),
  ...seed('vodiy', 19, 'VT'),
])
