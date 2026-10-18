import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

/**
 * How a brand's app decides an ariza, in the order it checks:
 * 1. MyID: a face that does not match the passport is declined, always.
 * 2. Age: outside the range is declined.
 * 3. Credit history: up to `lateManualUpTo` late payments in 5 years go to an admin, more are
 *    declined; no history at all is decided by the rules or sent to an admin.
 * 4. Load (the monthly payment as a share of income): up to `approveUpTo` is approved, up to
 *    `manualUpTo` goes to an admin, above it the app offers the largest sum whose payment is
 *    `counterTarget` of the income (if counter-offers are on and that sum is at least the
 *    product's smallest), else declines.
 * An offer stands `offerDays` days; after a decline the client can apply again in `reapplyDays`.
 */
export type DecisionRules = {
  id: Brand
  approveUpTo: number
  manualUpTo: number
  counterOffer: boolean
  counterTarget: number
  lateManualUpTo: number
  noHistory: 'auto' | 'manual'
  ageMin: number
  ageMax: number
  offerDays: number
  reapplyDays: number
}

/**
 * The contract and payment terms of a brand's loans: the payment day, when the card is charged
 * and how often again, early repayment, and which cards are taken. A partial early
 * repayment always keeps the end date and lowers the payments (user decision).
 */
export type ContractRules = {
  id: Brand
  payDayMode: 'issueDay' | 'fixed'
  /** For "fixed": the day of the month, 1–28. */
  payDay: number
  /** Hour of the automatic charge on the day. */
  chargeHour: number
  /** How many more mornings a refused charge is tried. */
  retries: number
  /** Early repayment allowed from this many days after payout. */
  earlyAfterDays: number
  earlyPartialMin: number
  /** Fee for repaying early, % of the sum paid early. */
  earlyFee: number
  uzcard: boolean
  humo: boolean
}

// What the apps and the sample data use today. Replace with the API.
const decision = (id: Brand): DecisionRules => ({
  id,
  approveUpTo: 45,
  manualUpTo: 55,
  counterOffer: true,
  counterTarget: 50,
  lateManualUpTo: 2,
  noHistory: 'auto',
  ageMin: 18,
  ageMax: 65,
  offerDays: 3,
  reapplyDays: 30,
})
export const decisionRulesStore = createStore<DecisionRules>([
  decision('fortuna'),
  decision('vodiy'),
])

export const contractRulesStore = createStore<ContractRules>([
  {
    id: 'fortuna',
    payDayMode: 'fixed',
    payDay: 5,
    chargeHour: 9,
    retries: 2,
    earlyAfterDays: 0,
    earlyPartialMin: 100_000,
    earlyFee: 0,
    uzcard: true,
    humo: true,
  },
  {
    id: 'vodiy',
    payDayMode: 'issueDay',
    payDay: 5,
    chargeHour: 9,
    retries: 2,
    earlyAfterDays: 0,
    earlyPartialMin: 100_000,
    earlyFee: 0,
    uzcard: true,
    humo: true,
  },
])

/** One field a save changed. */
export type RuleChange = { label: string; from: string; to: string }
/** One save of a brand's rules page: who, when, what. */
export type RuleRevision = {
  id: string
  brand: Brand
  page: 'decision' | 'contract'
  at: Date
  by: string
  changes: RuleChange[]
}
export const ruleRevisionsStore = createStore<RuleRevision>([
  {
    id: 'rr1',
    brand: 'fortuna',
    page: 'decision',
    at: new Date(2026, 8, 20, 15, 10),
    by: 'Sardor Saidov',
    changes: [{ label: 'Taklif amal qilish muddati', from: '5 kun', to: '3 kun' }],
  },
])

export const decisionRulesOf = (brand: Brand) =>
  decisionRulesStore.getAll().find((rules) => rules.id === brand)!
export const contractRulesOf = (brand: Brand) =>
  contractRulesStore.getAll().find((rules) => rules.id === brand)!

/** What the rules make of an ariza's numbers, for the tester on the page. */
export type Verdict = 'approve' | 'manual' | 'counter' | 'decline'
export function verdictOf(
  rules: Omit<DecisionRules, 'id'>,
  input: { load: number; late: number; noHistory: boolean; age: number; counterFits: boolean },
): {
  verdict: Verdict
  why: 'age' | 'credit' | 'creditManual' | 'noHistory' | 'load' | 'loadManual' | 'counter' | 'ok'
} {
  if (input.age < rules.ageMin || input.age > rules.ageMax)
    return { verdict: 'decline', why: 'age' }
  if (input.late > rules.lateManualUpTo) return { verdict: 'decline', why: 'credit' }
  if (input.late > 0) return { verdict: 'manual', why: 'creditManual' }
  if (input.noHistory && rules.noHistory === 'manual')
    return { verdict: 'manual', why: 'noHistory' }
  if (input.load <= rules.approveUpTo) return { verdict: 'approve', why: 'ok' }
  if (input.load <= rules.manualUpTo) return { verdict: 'manual', why: 'loadManual' }
  if (rules.counterOffer && input.counterFits) return { verdict: 'counter', why: 'counter' }
  return { verdict: 'decline', why: 'load' }
}
