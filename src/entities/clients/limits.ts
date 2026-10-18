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

// Sample history: each limit came from scoring a day after sign-up, and a few were changed by
// hand since. Replace with the API.
function seed(): LimitChange[] {
  const out: LimitChange[] = []
  clientsStore.getAll().forEach((client, i) => {
    if (!client.limit) return
    const first = new Date(client.registeredAt.getTime() + 86_400_000)
    const manual = i % 6 === 2
    const scored = manual
      ? Math.round((client.limit.amount * 0.75) / 500_000) * 500_000
      : client.limit.amount
    out.push({
      id: `l-${client.id}`,
      clientId: client.id,
      at: first,
      source: 'scoring',
      from: null,
      to: scored,
      validUntil: client.limit.validUntil,
    })
    if (manual)
      out.push({
        id: `l-${client.id}-m`,
        clientId: client.id,
        at: new Date(first.getTime() + 9 * 86_400_000),
        source: 'manual',
        by: i % 4 ? 'Malika Rasulova' : 'Sardor Saidov',
        from: scored,
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
