import { createStore } from '@/shared/lib/createStore'

/** An installment length in months. The admin adds and removes them on the Ustama page. */
export type Term = number

/** Shortest and longest term the admin may add. */
export const TERM_RANGE = { min: 1, max: 60 }

/**
 * One installment term the apps offer, with its markup: added once to the financed sum, then
 * split into monthly payments. One rate for every merchant and category.
 */
export type TermRate = {
  id: string
  term: Term
  /** Percent of the financed sum. */
  markup: number
  /** Off: shoppers and merchants cannot pick this term for new arizalar. */
  enabled: boolean
}

// The rates the apps use today. Replace with the API.
export const ratesStore = createStore<TermRate>([
  { id: '3', term: 3, markup: 15, enabled: true },
  { id: '6', term: 6, markup: 25, enabled: true },
  { id: '9', term: 9, markup: 30, enabled: true },
  { id: '12', term: 12, markup: 38, enabled: true },
  { id: '18', term: 18, markup: 55, enabled: true },
  { id: '24', term: 24, markup: 72, enabled: true },
])

export type RateChange =
  | { term: Term; field: 'markup'; from: number; to: number }
  | { term: Term; field: 'enabled'; to: boolean }
  | { term: Term; field: 'added'; to: number }
  | { term: Term; field: 'removed' }

/** One save on the Ustama page: who, when, and every term it changed. */
export type RateRevision = { id: string; date: Date; admin: string; changes: RateChange[] }

// Invented history. Replace with the API.
export const revisionsStore = createStore<RateRevision>([
  {
    id: 'r2',
    date: new Date(2026, 8, 1, 10, 14),
    admin: 'Sardor Saidov',
    changes: [{ term: 12, field: 'markup', from: 36, to: 38 }],
  },
  {
    id: 'r1',
    date: new Date(2026, 5, 15, 16, 40),
    admin: 'Malika Rasulova',
    changes: [
      { term: 24, field: 'enabled', to: true },
      { term: 24, field: 'markup', from: 70, to: 72 },
    ],
  },
])

/** What the shopper pays for a financed sum over a term, as the apps work it out. */
export function quote(financed: number, term: Term, markup: number) {
  const total = Math.round(financed * (1 + markup / 100))
  return { total, monthly: Math.floor(total / term) }
}
