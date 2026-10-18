import { scheduleOf, type Loan } from '@/entities/microloans/loans'
import type { Brand } from '@/shared/config/workspaces'

/** What a payment was for. */
export type LoanPaymentKind = 'monthly' | 'full' | 'partial'
/** How it came: taken from the card on the day, or paid by the borrower in the app. */
export type LoanPaymentMethod = 'auto' | 'app'
/** Why the card could not be charged. */
export const FAIL_REASONS = ['funds', 'blocked', 'expired'] as const
export type FailReason = (typeof FAIL_REASONS)[number]

/**
 * One money movement on a loan: a payment that went through, or an automatic charge the card
 * refused. Worked out from the loans, so a payment taken later shows up here by itself.
 */
export type LoanPayment = {
  id: string
  brand: Brand
  loan: Loan
  at: Date
  amount: number
  kind: LoanPaymentKind
  /** The monthly payment's number, for "monthly". */
  n?: number
  method: LoanPaymentMethod
  ok: boolean
  reason?: FailReason
}

/** Every payment and refused charge on the loans, newest first. */
export function paymentsOf(loans: Loan[]): LoanPayment[] {
  const out: LoanPayment[] = []
  for (const loan of loans) {
    const schedule = scheduleOf(loan)
    for (let n = 1; n <= loan.paidCount; n++) {
      const paidAt = loan.paidOn[n] ?? schedule[n - 1].due
      out.push({
        id: `${loan.id}-m${n}`,
        brand: loan.brand,
        loan,
        at: paidAt,
        amount: schedule[n - 1].amount,
        kind: 'monthly',
        n,
        method: paidAt.getHours() === 9 && paidAt.getMinutes() === 0 ? 'auto' : 'app',
        ok: true,
      })
    }
    loan.prepayments.forEach((extra, i) =>
      out.push({
        id: `${loan.id}-e${i}`,
        brand: loan.brand,
        loan,
        at: extra.at,
        amount: extra.amount,
        kind: extra.kind,
        method: 'app',
        ok: true,
      }),
    )
    loan.refused.forEach((attempt, i) =>
      out.push({
        id: `${loan.id}-f${i}`,
        brand: loan.brand,
        loan,
        at: attempt.at,
        amount: attempt.amount,
        kind: 'monthly',
        n: attempt.n,
        method: 'auto',
        ok: false,
        reason: attempt.reason,
      }),
    )
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime())
}
