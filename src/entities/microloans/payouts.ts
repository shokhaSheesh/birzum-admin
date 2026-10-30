import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

/** Why Atmos could not send the money, as the bank answered. */
export const PAYOUT_REASONS = ['bankTimeout', 'cardBlocked', 'cardExpired', 'cardLimit'] as const
export type PayoutReason = (typeof PAYOUT_REASONS)[number]

/**
 * A payout that did not reach the card after the contract was signed. Atmos retries on its own
 * (`attempts` so far); the admin can send it again by hand. `sent`: the last try went through.
 */
export type FailedPayout = {
  id: string
  brand: Brand
  applicationNumber: string
  borrower: { name: string; phone: string }
  amount: number
  card: { brand: 'uzcard' | 'humo'; last4: string }
  reason: PayoutReason
  attempts: number
  lastTryAt: Date
  status: 'failed' | 'sent'
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000)

// Invented sample. Replace with the API.
export const failedPayoutsStore = createStore<FailedPayout>([
  {
    id: 'fp1',
    brand: 'fortuna',
    applicationNumber: 'FB-2026-803789',
    borrower: { name: 'Karimova Dilnoza', phone: '901234567' },
    amount: 10_000_000,
    card: { brand: 'uzcard', last4: '8812' },
    reason: 'bankTimeout',
    attempts: 3,
    lastTryAt: hoursAgo(0.5),
    status: 'failed',
  },
  {
    id: 'fp2',
    brand: 'fortuna',
    applicationNumber: 'FB-2026-799412',
    borrower: { name: 'Rahimov Sardor', phone: '935554433' },
    amount: 6_500_000,
    card: { brand: 'humo', last4: '3390' },
    reason: 'cardBlocked',
    attempts: 2,
    lastTryAt: hoursAgo(5),
    status: 'failed',
  },
  {
    id: 'fp3',
    brand: 'fortuna',
    applicationNumber: 'FB-2026-795001',
    borrower: { name: 'Yoʻldosheva Malika', phone: '991112233' },
    amount: 15_000_000,
    card: { brand: 'uzcard', last4: '5121' },
    reason: 'cardLimit',
    attempts: 4,
    lastTryAt: hoursAgo(26),
    status: 'failed',
  },
  {
    id: 'fp4',
    brand: 'vodiy',
    applicationNumber: 'VT-2026-011902',
    borrower: { name: 'Qodirov Bobur', phone: '945556677' },
    amount: 20_000_000,
    card: { brand: 'humo', last4: '0925' },
    reason: 'cardExpired',
    attempts: 1,
    lastTryAt: hoursAgo(2),
    status: 'failed',
  },
])
