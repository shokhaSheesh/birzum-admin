import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** Where the shopper's income comes from, as MyID and the tax office report it. */
export const INCOME_SOURCES = ['salary', 'business', 'pension', 'other'] as const
export type IncomeSource = (typeof INCOME_SOURCES)[number]

/**
 * How a shopper's limit is worked out. One set for the whole platform.
 * Base limit = monthly income × the multiplier for its source, capped at `maxLimit`.
 * Each term gets its share of the base. Below `minLimit` no limit is given.
 */
export type ScoringRules = {
  id: 'rules'
  multipliers: Record<IncomeSource, number>
  /** Percent of the base limit, by term in months. A term missing here gets 100%. */
  shares: Record<number, number>
  minLimit: number
  maxLimit: number
  /** Months a calculated limit stays valid before the shopper recalculates it. */
  validMonths: number
  minAge: number
  maxAge: number
  /** Reject when the credit history (KATM) has a payment late by more days than this. */
  maxLateDays: number
  /** Reject when the shopper is overdue on a loan elsewhere right now. */
  rejectOpenOverdue: boolean
}

// The rules the apps use today. Replace with the API.
export const scoringStore = createStore<ScoringRules>([
  {
    id: 'rules',
    multipliers: { salary: 5, business: 4, pension: 3, other: 3 },
    shares: { 3: 60, 6: 80, 9: 90, 12: 100, 18: 100, 24: 100 },
    minLimit: 500_000,
    maxLimit: 50_000_000,
    validMonths: 6,
    minAge: 18,
    maxAge: 70,
    maxLateDays: 30,
    rejectOpenOverdue: true,
  },
])

export const shareOf = (rules: ScoringRules, term: number) => rules.shares[term] ?? 100

export type Applicant = { income: number; source: IncomeSource; age: number }

export type Decision =
  | { approved: true; base: number; limits: { term: number; limit: number }[] }
  | { approved: false; reason: 'age' | 'low' }

/** The decision the apps would show, for the terms on offer. Limits round down to 100 000. */
export function decide(rules: ScoringRules, applicant: Applicant, terms: number[]): Decision {
  if (applicant.age < rules.minAge || applicant.age > rules.maxAge)
    return { approved: false, reason: 'age' }
  const base = Math.min(rules.maxLimit, applicant.income * rules.multipliers[applicant.source])
  if (base < rules.minLimit) return { approved: false, reason: 'low' }
  const round = (sum: number) => Math.floor(sum / 100_000) * 100_000
  return {
    approved: true,
    base: round(base),
    limits: terms.map((term) => ({ term, limit: round((base * shareOf(rules, term)) / 100) })),
  }
}

/** One changed value: what it is called, and before and after as shown. */
export type ScoringChange = {
  label: TranslationKey
  params?: Record<string, string>
  from: string
  to: string
}
export type ScoringRevision = { id: string; date: Date; admin: string; changes: ScoringChange[] }

// Invented history. Replace with the API.
export const scoringRevisionsStore = createStore<ScoringRevision>([
  {
    id: 's2',
    date: new Date(2026, 8, 20, 11, 5),
    admin: 'Sardor Saidov',
    changes: [{ label: 'scoring.maxLimit', from: '40 000 000 UZS', to: '50 000 000 UZS' }],
  },
  {
    id: 's1',
    date: new Date(2026, 6, 2, 9, 30),
    admin: 'Malika Rasulova',
    changes: [
      { label: 'scoring.multiplier', params: { source: 'salary' }, from: '4×', to: '5×' },
      { label: 'scoring.share', params: { term: '3' }, from: '50%', to: '60%' },
    ],
  },
])
