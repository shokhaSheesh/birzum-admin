import { createStore } from '@/shared/lib/createStore'

/**
 * How Birzum decides on an ariza. FlexSoft's scoring gives a base score out of 100 from the
 * credit bureau, income and MyID; Birzum then takes points off for warning signs it sees in its
 * own data. The final score picks the way:
 *
 *   final = FlexSoft score − penalties of the signs found
 *   final ≥ approveFrom  → approved on its own
 *   final < rejectBelow  → rejected on its own
 *   otherwise            → an admin decides
 *
 * A sign marked "always manual" sends the ariza to an admin whatever the score. The admin edits
 * every number on the Qoidalar page; new rules apply to arizalar that come in after saving.
 */
export const CHECK_FLAGS = [
  'overdue',
  'nearLimit',
  'newClient',
  'manyRunning',
  'bigAmount',
] as const
export type CheckFlag = (typeof CHECK_FLAGS)[number]

export type FlagRule = {
  on: boolean
  /** Points taken off the FlexSoft score. */
  penalty: number
  alwaysManual: boolean
  /**
   * The sign's own number: % of the limit for nearLimit, days since sign-up for newClient,
   * open nasiyalar for manyRunning, the sum in UZS for bigAmount. Unused for overdue.
   */
  threshold: number
}

export type CheckRules = {
  id: 'rules'
  approveFrom: number
  rejectBelow: number
  flags: Record<CheckFlag, FlagRule>
}

export const DEFAULT_RULES: CheckRules = {
  id: 'rules',
  approveFrom: 70,
  rejectBelow: 35,
  flags: {
    overdue: { on: true, penalty: 25, alwaysManual: true, threshold: 0 },
    nearLimit: { on: true, penalty: 10, alwaysManual: false, threshold: 80 },
    newClient: { on: true, penalty: 8, alwaysManual: false, threshold: 14 },
    manyRunning: { on: true, penalty: 8, alwaysManual: false, threshold: 3 },
    bigAmount: { on: true, penalty: 5, alwaysManual: true, threshold: 18_000_000 },
  },
}

export const rulesStore = createStore<CheckRules>([DEFAULT_RULES])
export const getRules = () => rulesStore.getAll()[0]
export const useRules = () => rulesStore.useAll()[0]

/** One saved change of the rules, for the history under the form. */
export type RulesChange = {
  id: string
  at: Date
  by: string
  changes: { label: string; from: string; to: string }[]
}
export const rulesHistoryStore = createStore<RulesChange>([
  {
    id: 'h1',
    at: new Date(2026, 8, 20, 11, 5),
    by: 'Sardor Saidov',
    changes: [
      { label: 'Avtomatik tasdiqlash', from: '75', to: '70' },
      { label: 'Katta summa', from: '15 000 000 UZS', to: '18 000 000 UZS' },
    ],
  },
])

/** The points a sign takes off under these rules; 0 when the rule is off. */
export const penaltyOf = (flag: CheckFlag, rules: CheckRules) =>
  rules.flags[flag].on ? rules.flags[flag].penalty : 0

export const finalScore = (base: number, flags: CheckFlag[], rules: CheckRules) =>
  Math.max(0, base - flags.reduce((sum, flag) => sum + penaltyOf(flag, rules), 0))

export type Verdict = 'approve' | 'manual' | 'reject'

/** What the rules say about a final score and its signs. */
export function verdictOf(score: number, flags: CheckFlag[], rules: CheckRules): Verdict {
  if (score < rules.rejectBelow) return 'reject'
  if (flags.some((flag) => rules.flags[flag].on && rules.flags[flag].alwaysManual)) return 'manual'
  return score >= rules.approveFrom ? 'approve' : 'manual'
}
