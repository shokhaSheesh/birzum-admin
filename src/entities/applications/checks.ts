import { createStore } from '@/shared/lib/createStore'
import { clientsStore, type Client } from '../clients/clients'
import { applicationsStore, type Application } from './applications'

/**
 * Birzum's check of an ariza before the goods can be handed over. FlexSoft's scoring gives it a
 * score out of 100: from 70 it is approved on its own; below that, or with a late payment now
 * or a very large sum, it waits for an admin, who approves or rejects it.
 */
export const PASS_SCORE = 70

/** Warning signs that send an ariza to an admin. */
export const CHECK_FLAGS = [
  'overdue',
  'nearLimit',
  'newClient',
  'manyRunning',
  'bigAmount',
] as const
export type CheckFlag = (typeof CHECK_FLAGS)[number]

export const CHECK_REJECT_REASONS = ['income', 'history', 'data', 'fraud', 'other'] as const
export type CheckRejectReason = (typeof CHECK_REJECT_REASONS)[number]

export type CheckState = 'waiting' | 'approved' | 'rejected'

export type Check = {
  /** The ariza's id. */
  id: string
  /** `auto`: the scoring decided. `manual`: an admin did. */
  mode: 'auto' | 'manual'
  state: CheckState
  score: number
  flags: CheckFlag[]
  checkedAt: Date
  decidedAt?: Date
  decidedBy?: string
  reason?: CheckRejectReason
  comment?: string
}

const DAY = 86_400_000
/** Arizalar from this sum up are large enough to always get a second look. */
export const BIG_AMOUNT = 18_000_000

/** The warning signs for one ariza, from the shopper's state when it came in. */
export function flagsOf(application: Application, client: Client, all: Application[]): CheckFlag[] {
  const financed = application.goodsTotal - application.downPayment
  const running = all.filter(
    (other) =>
      other.clientId === client.id && other.id !== application.id && other.status === 'handed',
  ).length
  const flags: CheckFlag[] = []
  if (client.late) flags.push('overdue')
  if (client.limit && financed > client.limit.amount * 0.8) flags.push('nearLimit')
  if (application.createdAt.getTime() - client.registeredAt.getTime() < 14 * DAY)
    flags.push('newClient')
  if (running >= 3) flags.push('manyRunning')
  if (financed >= BIG_AMOUNT) flags.push('bigAmount')
  return flags
}

/** From 70 the scoring decides alone, except a late payment now or a very large sum. */
export const passesOnItsOwn = (score: number, flags: CheckFlag[]) =>
  score >= PASS_SCORE && !flags.includes('overdue') && !flags.includes('bigAmount')

// Sample checks worked out from the arizalar: everything the merchant took on was checked; the
// newest ones with warning signs are still waiting. Replace with the API.
function seed(): Check[] {
  const all = applicationsStore.getAll()
  const clients = clientsStore.getAll()
  const newest = Math.max(...all.map((a) => a.createdAt.getTime()))
  const admins = ['Malika Rasulova', 'Sardor Saidov', 'Nodira Aliyeva']
  const out: Check[] = []
  const rejected: { id: string; comment: string }[] = []
  for (const application of all) {
    if (application.status === 'pending') continue
    // A few older ones the merchant could not hand over because Birzum said no
    if (application.status === 'rejected') {
      const n = Number(application.number)
      if (application.rejection?.reason !== 'limit' || n % 2) continue
      const decidedAt = application.history.at(-1)!.at
      const comment = 'Oylik toʻlov daromadning yarmidan oshadi, boshqa nasiyalari ham bor.'
      out.push({
        id: application.id,
        mode: 'manual',
        state: 'rejected',
        score: 41 + (n % 20),
        flags: ['nearLimit', 'manyRunning'],
        checkedAt: new Date(decidedAt.getTime() - 40 * 60_000),
        decidedAt,
        decidedBy: admins[n % admins.length],
        reason: 'income',
        comment,
      })
      rejected.push({ id: application.id, comment })
      continue
    }
    const client = clients.find((c) => c.id === application.clientId)
    if (!client) continue
    const recent = newest - application.createdAt.getTime() < 4 * DAY
    // "Late now" says nothing about an ariza from weeks ago
    const flags = flagsOf(application, client, all).filter((f) => recent || f !== 'overdue')
    const n = Number(application.number)
    const score = Math.max(28, Math.min(97, 97 - flags.length * 8 - ((n * 37) % 31)))
    const checkedAt = new Date(application.createdAt.getTime() + 20 * 60_000)
    const auto = passesOnItsOwn(score, flags)
    if (application.status === 'processing' && recent && !auto) {
      out.push({ id: application.id, mode: 'manual', state: 'waiting', score, flags, checkedAt })
      continue
    }
    if (application.status === 'cancelled' && !auto) continue
    out.push({
      id: application.id,
      mode: auto ? 'auto' : 'manual',
      state: 'approved',
      score,
      flags,
      checkedAt,
      decidedAt: auto ? checkedAt : new Date(checkedAt.getTime() + (n % 5) * 900_000 + 600_000),
      decidedBy: auto ? undefined : admins[n % admins.length],
    })
  }
  // Those arizalar say so too: rejected by Birzum, not by the shop
  for (const { id, comment } of rejected) {
    const application = applicationsStore.get(id)!
    applicationsStore.update(id, {
      rejection: { reason: 'risk', comment },
      history: [
        ...application.history.slice(0, -1),
        { ...application.history.at(-1)!, by: { kind: 'system', name: 'Birzum' }, comment },
      ],
    })
  }
  return out
}

export const checksStore = createStore<Check>(seed())
