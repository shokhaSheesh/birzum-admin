import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

/**
 * The contract and payment terms of a brand's loans: when the card is charged and how often
 * again, early repayment, and which cards are taken. The payment day is not set here: the client
 * picks 1–10 in the app's calculator. A partial early repayment always keeps the end date and
 * lowers the payments (user decision).
 */
export type ContractRules = {
  id: Brand
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
export const contractRulesStore = createStore<ContractRules>([
  {
    id: 'fortuna',
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
  page: 'contract'
  at: Date
  by: string
  changes: RuleChange[]
}
export const ruleRevisionsStore = createStore<RuleRevision>([
  {
    id: 'rr1',
    brand: 'fortuna',
    page: 'contract',
    at: new Date(2026, 8, 20, 15, 10),
    by: 'Sardor Saidov',
    changes: [{ label: 'Takroriy urinishlar', from: '3', to: '2' }],
  },
])
