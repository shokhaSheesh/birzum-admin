import type { Tariff } from '../merchants/merchants'

/** The installment terms the apps offer, in months. */
export const TERMS = [3, 6, 9, 12, 18, 24] as const
export type Term = (typeof TERMS)[number]

/**
 * The markup for each tariff and term, in percent of the financed sum: added once, then split
 * into monthly payments. A merchant's tariff picks the column. FlexSoft owns these rates and
 * changes them there; the panel only shows them. The same numbers as the merchant and client
 * apps. Replace with the API.
 */
export const MARKUPS: Record<Tariff, Record<Term, number>> = {
  A: { 3: 15, 6: 25, 9: 30, 12: 38, 18: 55, 24: 72 },
  B: { 3: 12, 6: 22, 9: 27, 12: 34, 18: 50, 24: 66 },
  C: { 3: 10, 6: 19, 9: 24, 12: 30, 18: 45, 24: 60 },
}
