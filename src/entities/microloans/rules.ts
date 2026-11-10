import type { Brand } from '@/shared/config/workspaces'

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
  /** Who saved it last and when; none on the initial values. */
  updatedAt?: Date
  updatedBy?: string
  mode: 'fixed' | 'byDay'
  fixedDays: number[]
  rules: PayDayRule[]
  after: number
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)

/** The payment days a client who applies on `appDay` can pick; `next1st` when only the 1st is left. */
export function payDaysFor(rules: Omit<PayDayRules, 'id'>, appDay: number) {
  if (rules.mode === 'fixed')
    return { days: [...rules.fixedDays].sort((a, b) => a - b), next1st: false }
  if (appDay > rules.after) return { days: [1], next1st: true }
  const line = rules.rules.find((rule) => appDay >= rule.from && appDay <= rule.to)
  if (!line) return { days: [1], next1st: true }
  return { days: range(1, line.upTo === 'appDay' ? appDay : line.upTo), next1st: false }
}
