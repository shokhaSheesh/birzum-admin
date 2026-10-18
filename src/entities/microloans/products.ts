import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The terms, in months, a product can offer; a product offers those between its shortest and longest. */
export const TERM_STEPS = [3, 6, 9, 12, 18, 24, 36, 48] as const

/**
 * One microloan product of a brand, as its app's calculator and Asosiy show it: name, kind, who
 * it is for, the sum range and step, the yearly rate range and the terms. Off: hidden in the app.
 */
export type LoanProduct = {
  id: string
  brand: Brand
  name: string
  kind: LocalizedText
  for: LocalizedText
  min: number
  max: number
  step: number
  /** Yearly interest, %, from and to; the same twice for one figure. */
  rateFrom: number
  rateTo: number
  termMin: number
  termMax: number
  enabled: boolean
}

const product = (p: Omit<LoanProduct, 'step' | 'enabled'> & Partial<LoanProduct>): LoanProduct => ({
  step: 500_000,
  enabled: true,
  ...p,
})

// The products the apps ship with, from fortunabiznes.uz and vodiytaraqqiyot.uz. Replace with the API.
export const loanProductsStore = createStore<LoanProduct>([
  product({
    id: 'rivoj',
    brand: 'fortuna',
    name: 'Rivoj',
    kind: { uz: 'Mikrokredit, garovsiz', ru: 'Микрокредит без залога' },
    for: {
      uz: 'Tadbirkorlik bilan shugʻullanuvchilar uchun',
      ru: 'Для тех, кто ведёт предпринимательство',
    },
    min: 1_000_000,
    max: 50_000_000,
    rateFrom: 49,
    rateTo: 54,
    termMin: 3,
    termMax: 24,
  }),
  product({
    id: 'tezkor',
    brand: 'fortuna',
    name: 'Tezkor',
    kind: { uz: 'Mikroqarz', ru: 'Микрозайм' },
    for: {
      uz: 'Rasmiy daromadi borlar uchun, garovsiz',
      ru: 'Для тех, у кого официальный доход, без залога',
    },
    min: 1_000_000,
    max: 40_000_000,
    rateFrom: 45,
    rateTo: 49,
    termMin: 3,
    termMax: 36,
  }),
  product({
    id: 'ishonch',
    brand: 'fortuna',
    name: 'Ishonch',
    kind: { uz: 'Mikroqarz', ru: 'Микрозайм' },
    for: {
      uz: 'Takroriy mijozlar uchun, 3-shaxs kafilligi asosida',
      ru: 'Для повторных клиентов, под поручительство третьего лица',
    },
    min: 1_000_000,
    max: 20_000_000,
    rateFrom: 54,
    rateTo: 54,
    termMin: 3,
    termMax: 24,
  }),
  product({
    id: 'zar',
    brand: 'vodiy',
    name: 'Zar',
    kind: { uz: 'Mikroqarz', ru: 'Микрозайм' },
    for: {
      uz: 'Har qanday maqsadga, kafil va garovsiz',
      ru: 'На любые цели, без поручителя и залога',
    },
    min: 2_000_000,
    max: 100_000_000,
    rateFrom: 48,
    rateTo: 60,
    termMin: 3,
    termMax: 12,
  }),
  product({
    id: 'v-ishonch',
    brand: 'vodiy',
    name: 'Ishonch',
    kind: { uz: 'Mikroqarz', ru: 'Микрозайм' },
    for: {
      uz: 'Takroriy mijozlar uchun, 3-shaxs kafilligi asosida',
      ru: 'Для повторных клиентов, под поручительство третьего лица',
    },
    min: 2_000_000,
    max: 100_000_000,
    rateFrom: 48,
    rateTo: 60,
    termMin: 3,
    termMax: 12,
  }),
  product({
    id: 'komak',
    brand: 'vodiy',
    name: 'Koʻmak',
    kind: { uz: 'Mikroqarz', ru: 'Микрозайм' },
    for: {
      uz: 'Garov yoki sugʻurta polisi bilan, 3 oy imtiyozli davr',
      ru: 'Под залог или страховой полис, 3 месяца льготного периода',
    },
    min: 2_000_000,
    max: 100_000_000,
    rateFrom: 50,
    rateTo: 60,
    termMin: 3,
    termMax: 12,
  }),
  product({
    id: 'imkoniyat',
    brand: 'vodiy',
    name: 'Imkoniyat',
    kind: { uz: 'Mikroqarz', ru: 'Микрозайм' },
    for: {
      uz: 'Rasmiy daromadi borlar uchun, garovsiz yoki kafillik bilan',
      ru: 'Для тех, у кого официальный доход, без залога или с поручителем',
    },
    min: 1_000_000,
    max: 20_000_000,
    rateFrom: 55,
    rateTo: 55,
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
