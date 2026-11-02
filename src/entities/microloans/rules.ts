import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

/**
 * One line of the "by application day" rule: a client who applies between the `from` and `to`
 * day of the month can pick a payment day from 1 up to `upTo`, or up to the day they apply
 * (`'appDay'`), so the choice grows one day at a time.
 */
export type PayDayRule = { from: number; to: number; upTo: number | 'appDay' }

/**
 * Which payment days the app offers. `fixed`: the same days for everyone. `byDay`: the days
 * depend on the day the client applies (the lines in `rules`); after the `after` day of the
 * month only the 1st of next month is offered.
 */
export type PayDayRules = {
  id: Brand
  mode: 'fixed' | 'byDay'
  fixedDays: number[]
  rules: PayDayRule[]
  after: number
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)

// The rule Fortuna uses in its branches today (31.10 call). Replace with the API.
const defaults = (id: Brand): PayDayRules => ({
  id,
  mode: 'byDay',
  fixedDays: range(1, 10),
  rules: [
    { from: 1, to: 5, upTo: 5 },
    { from: 6, to: 10, upTo: 10 },
    { from: 11, to: 20, upTo: 'appDay' },
  ],
  after: 20,
})
export const payDayRulesStore = createStore<PayDayRules>([defaults('fortuna'), defaults('vodiy')])

/** The payment days a client who applies on `appDay` can pick; `next1st` when only the 1st is left. */
export function payDaysFor(rules: Omit<PayDayRules, 'id'>, appDay: number) {
  if (rules.mode === 'fixed')
    return { days: [...rules.fixedDays].sort((a, b) => a - b), next1st: false }
  if (appDay > rules.after) return { days: [1], next1st: true }
  const line = rules.rules.find((rule) => appDay >= rule.from && appDay <= rule.to)
  if (!line) return { days: [1], next1st: true }
  return { days: range(1, line.upTo === 'appDay' ? appDay : line.upTo), next1st: false }
}

/** One field a save changed. */
export type RuleChange = { label: string; from: string; to: string }
/** One save of a brand's rules page: who, when, what. */
export type RuleRevision = {
  id: string
  brand: Brand
  page: 'payDay'
  at: Date
  by: string
  changes: RuleChange[]
}
export const ruleRevisionsStore = createStore<RuleRevision>([
  {
    id: 'rr1',
    brand: 'fortuna',
    page: 'payDay',
    at: new Date(2026, 9, 31, 17, 40),
    by: 'Sardor Saidov',
    changes: [{ label: 'Qanday tanlanadi', from: 'Belgilangan kunlar', to: 'Ariza kuniga qarab' }],
  },
])
