import { createStore } from '@/shared/lib/createStore'
import { clientsStore } from './clients'

/**
 * Every change to a shopper's limit. FlexSoft's scoring sets it; an admin may raise or lower it
 * by hand with a reason, or ask FlexSoft to work it out again.
 */
export const LIMIT_REASONS = ['income', 'history', 'risk', 'request', 'other'] as const
export type LimitReason = (typeof LIMIT_REASONS)[number]

export type LimitChange = {
  id: string
  clientId: string
  at: Date
  /** `scoring`: FlexSoft worked it out. `manual`: an admin set it. */
  source: 'scoring' | 'manual'
  /** The admin's name for a manual change. */
  by?: string
  from: number | null
  to: number
  validUntil: Date
  reason?: LimitReason
  comment?: string
}

// Sample history: the first limit came from scoring a day after sign-up, and the shopper took a
// new one (FlexSoft scored again) about every two months, the sum growing as they paid on time.
// A few were changed by hand since. Replace with the API.
const RESCORE_DAYS = 60
const round = (sum: number) => Math.max(500_000, Math.round(sum / 500_000) * 500_000)

function seed(): LimitChange[] {
  const out: LimitChange[] = []
  const today = new Date()
  clientsStore.getAll().forEach((client, i) => {
    if (!client.limit) return
    const first = new Date(client.registeredAt.getTime() + 86_400_000)
    const dates: Date[] = []
    for (let at = first; at < today; at = new Date(at.getTime() + RESCORE_DAYS * 86_400_000))
      dates.push(at)
    const manual = i % 6 === 2
    const last = manual ? round(client.limit.amount * 0.75) : client.limit.amount
    let from: number | null = null
    dates.forEach((at, k) => {
      // Earlier scorings gave less; a few went down after a late payment
      const share = dates.length === 1 ? 1 : 0.55 + (0.45 * k) / (dates.length - 1)
      const dip = k > 0 && k < dates.length - 1 && i % 5 === 1 ? 0.8 : 1
      const to = k === dates.length - 1 ? last : round(last * share * dip)
      out.push({
        id: `l-${client.id}-${k}`,
        clientId: client.id,
        at,
        source: 'scoring',
        from,
        to,
        validUntil: dates[k + 1] ?? client.limit!.validUntil,
      })
      from = to
    })
    if (manual)
      out.push({
        id: `l-${client.id}-m`,
        clientId: client.id,
        at: new Date(
          Math.min(dates.at(-1)!.getTime() + 9 * 86_400_000, today.getTime() - 3_600_000),
        ),
        source: 'manual',
        by: i % 4 ? 'Malika Rasulova' : 'Sardor Saidov',
        from: last,
        to: client.limit.amount,
        validUntil: client.limit.validUntil,
        reason: 'income',
        comment: 'Ish joyidan maosh haqida maʼlumotnoma keltirdi.',
      })
  })
  return out
}

export const limitsStore = createStore<LimitChange>(seed())

export const limitHistoryOf = (all: LimitChange[], clientId: string) =>
  all
    .filter((change) => change.clientId === clientId)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
