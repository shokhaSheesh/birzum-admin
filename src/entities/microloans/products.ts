import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The terms, in months, a product can offer; a product offers those between its shortest and longest. */
export const TERM_STEPS = [3, 6, 9, 12, 18, 24, 36, 48] as const

/**
 * What the yearly rate depends on: one rate for every loan, the term, the sum, or both. The app
 * shows the range; each loan gets the exact rate from the table.
 */
export const RATE_MODES = ['fixed', 'term', 'amount', 'both'] as const
export type RateMode = (typeof RATE_MODES)[number]

/**
 * One row of the rate table: sums up to `upTo` (the last row reaches the product's largest sum),
 * and the yearly rate, %, for each term. With 'fixed' and 'amount' every term has the same rate.
 */
export type RateBand = { upTo: number; byTerm: Record<number, number> }

/**
 * One microloan product of a brand, as its app's calculator and Asosiy show it: name, who it is
 * for, the sum range, the terms, and the yearly rate table. Off: hidden in the app. Every product
 * is a microloan, so there is no kind to pick.
 */
export type LoanProduct = {
  id: string
  brand: Brand
  name: string
  for: LocalizedText
  min: number
  max: number
  termMin: number
  termMax: number
  rateMode: RateMode
  rates: RateBand[]
  enabled: boolean
}

const product = (p: Omit<LoanProduct, 'enabled'>): LoanProduct => ({ enabled: true, ...p })

/** One rate for every term. */
const flat = (upTo: number, rate: number, terms: readonly number[]): RateBand => ({
  upTo,
  byTerm: Object.fromEntries(terms.map((n) => [n, rate])),
})
/** A rate per term, in the order of the terms. */
const perTerm = (upTo: number, terms: readonly number[], rates: number[]): RateBand => ({
  upTo,
  byTerm: Object.fromEntries(terms.map((n, i) => [n, rates[i]])),
})
const T3_12 = [3, 6, 9, 12] as const
const T3_24 = [3, 6, 9, 12, 18, 24] as const
const T3_36 = [3, 6, 9, 12, 18, 24, 36] as const

// The products the apps ship with, from fortunabiznes.uz and vodiytaraqqiyot.uz. Replace with the API.
export const loanProductsStore = createStore<LoanProduct>([
  product({
    id: 'rivoj',
    brand: 'fortuna',
    name: 'Rivoj',
    for: {
      uz: 'Tadbirkorlik bilan shugʻullanuvchilar uchun',
      ru: 'Для тех, кто ведёт предпринимательство',
    },
    min: 1_000_000,
    max: 50_000_000,
    // Up to 12 months the lower rate, longer the higher one
    rateMode: 'term',
    rates: [perTerm(50_000_000, T3_24, [49, 49, 49, 49, 54, 54])],
    termMin: 3,
    termMax: 24,
  }),
  product({
    id: 'tezkor',
    brand: 'fortuna',
    name: 'Tezkor',
    for: {
      uz: 'Rasmiy daromadi borlar uchun, garovsiz',
      ru: 'Для тех, у кого официальный доход, без залога',
    },
    min: 1_000_000,
    max: 40_000_000,
    rateMode: 'term',
    rates: [perTerm(40_000_000, T3_36, [45, 45, 45, 45, 47, 47, 49])],
    termMin: 3,
    termMax: 36,
  }),
  product({
    id: 'ishonch',
    brand: 'fortuna',
    name: 'Ishonch',
    for: {
      uz: 'Takroriy mijozlar uchun, 3-shaxs kafilligi asosida',
      ru: 'Для повторных клиентов, под поручительство третьего лица',
    },
    min: 1_000_000,
    max: 20_000_000,
    rateMode: 'fixed',
    rates: [flat(20_000_000, 54, T3_24)],
    termMin: 3,
    termMax: 24,
  }),
  product({
    id: 'zar',
    brand: 'vodiy',
    name: 'Zar',
    for: {
      uz: 'Har qanday maqsadga, kafil va garovsiz',
      ru: 'На любые цели, без поручителя и залога',
    },
    min: 2_000_000,
    max: 100_000_000,
    // Bigger sums are cheaper
    rateMode: 'amount',
    rates: [flat(20_000_000, 60, T3_12), flat(50_000_000, 54, T3_12), flat(100_000_000, 48, T3_12)],
    termMin: 3,
    termMax: 12,
  }),
  product({
    id: 'v-ishonch',
    brand: 'vodiy',
    name: 'Ishonch',
    for: {
      uz: 'Takroriy mijozlar uchun, 3-shaxs kafilligi asosida',
      ru: 'Для повторных клиентов, под поручительство третьего лица',
    },
    min: 2_000_000,
    max: 100_000_000,
    rateMode: 'term',
    rates: [perTerm(100_000_000, T3_12, [48, 52, 56, 60])],
    termMin: 3,
    termMax: 12,
  }),
  product({
    id: 'komak',
    brand: 'vodiy',
    name: 'Koʻmak',
    for: {
      uz: 'Garov yoki sugʻurta polisi bilan, 3 oy imtiyozli davr',
      ru: 'Под залог или страховой полис, 3 месяца льготного периода',
    },
    min: 2_000_000,
    max: 100_000_000,
    // Both: bigger sums and shorter terms are cheaper
    rateMode: 'both',
    rates: [
      perTerm(30_000_000, T3_12, [56, 58, 59, 60]),
      perTerm(70_000_000, T3_12, [53, 55, 56, 57]),
      perTerm(100_000_000, T3_12, [50, 52, 53, 54]),
    ],
    termMin: 3,
    termMax: 12,
  }),
  product({
    id: 'imkoniyat',
    brand: 'vodiy',
    name: 'Imkoniyat',
    for: {
      uz: 'Rasmiy daromadi borlar uchun, garovsiz yoki kafillik bilan',
      ru: 'Для тех, у кого официальный доход, без залога или с поручителем',
    },
    min: 1_000_000,
    max: 20_000_000,
    // 0.15% a day on the site
    rateMode: 'fixed',
    rates: [flat(20_000_000, 55, T3_36)],
    termMin: 3,
    termMax: 36,
  }),
])

/** The terms a product offers, in months. */
export const termsOf = (p: Pick<LoanProduct, 'termMin' | 'termMax'>) =>
  TERM_STEPS.filter((n) => n >= p.termMin && n <= p.termMax)

/** The monthly payment the app's calculator shows for a sum, yearly rate and term (annuity). */
export function monthlyOf(amount: number, rate: number, term: number) {
  const r = rate / 100 / 12
  return Math.round((amount * r) / (1 - (1 + r) ** -term))
}

/** The exact yearly rate for a sum and term: the first band the sum fits in, that term's rate. */
export function rateOf(p: Pick<LoanProduct, 'rates'>, amount: number, term: number) {
  const band = p.rates.find((row) => amount <= row.upTo) ?? p.rates.at(-1)!
  return band.byTerm[term] ?? Object.values(band.byTerm)[0] ?? 0
}

/** The lowest and highest rate in the table, for the list and the app's product card. */
export function rateRangeOf(p: Pick<LoanProduct, 'rates' | 'termMin' | 'termMax'>) {
  const terms = termsOf(p)
  const all = p.rates.flatMap((row) =>
    terms.map((n) => row.byTerm[n]).filter((v) => v !== undefined),
  )
  return { from: Math.min(...all), to: Math.max(...all) }
}
