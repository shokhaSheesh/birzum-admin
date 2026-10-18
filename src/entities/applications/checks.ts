import { createStore } from '@/shared/lib/createStore'
import { clientsStore, type Client } from '../clients/clients'
import { applicationsStore, type Application, type HistoryEntry } from './applications'
import {
  DEFAULT_RULES,
  finalScore,
  penaltyOf,
  verdictOf,
  type CheckFlag,
  type CheckRules,
} from './checkRules'

export { CHECK_FLAGS, type CheckFlag } from './checkRules'

/**
 * Birzum's check of an ariza, the first thing that happens to it: before the merchant confirms
 * a shopper's order, and before the seller draws up the contract for one made in the shop.
 * The rules (`checkRules`) turn FlexSoft's score and Birzum's warning signs into a decision;
 * whatever they do not decide waits in Tekshiruv for an admin.
 */
export const CHECK_REJECT_REASONS = ['income', 'history', 'data', 'fraud', 'other'] as const
export type CheckRejectReason = (typeof CHECK_REJECT_REASONS)[number]

export type CheckState = 'waiting' | 'approved' | 'rejected'

export type Check = {
  /** The ariza's id. */
  id: string
  /** `auto`: the rules decided. `manual`: an admin did. */
  mode: 'auto' | 'manual'
  state: CheckState
  /** FlexSoft's score, before Birzum's penalties. */
  baseScore: number
  /** The final score under the rules of the day it came in. */
  score: number
  flags: CheckFlag[]
  /** Points each sign took off, as the rules were then. */
  penalties: Partial<Record<CheckFlag, number>>
  checkedAt: Date
  decidedAt?: Date
  decidedBy?: string
  reason?: CheckRejectReason
  comment?: string
}

const DAY = 86_400_000

/** The warning signs for one ariza under the given rules, from the shopper's state. */
export function flagsOf(
  application: Application,
  client: Client,
  all: Application[],
  rules: CheckRules,
): CheckFlag[] {
  const financed = application.goodsTotal - application.downPayment
  const running = all.filter(
    (other) =>
      other.clientId === client.id && other.id !== application.id && other.status === 'handed',
  ).length
  const f = rules.flags
  const flags: CheckFlag[] = []
  if (f.overdue.on && client.late) flags.push('overdue')
  if (
    f.nearLimit.on &&
    client.limit &&
    financed > (client.limit.amount * f.nearLimit.threshold) / 100
  )
    flags.push('nearLimit')
  if (
    f.newClient.on &&
    application.createdAt.getTime() - client.registeredAt.getTime() < f.newClient.threshold * DAY
  )
    flags.push('newClient')
  if (f.manyRunning.on && running >= f.manyRunning.threshold) flags.push('manyRunning')
  if (f.bigAmount.on && financed >= f.bigAmount.threshold) flags.push('bigAmount')
  return flags
}

// Sample checks worked out from the arizalar under the default rules. The newest ones the rules
// could not decide are still waiting, so those arizalar move back to "Birzum tekshirmoqda".
// Replace with the API.
function seed(): Check[] {
  const rules = DEFAULT_RULES
  const all = applicationsStore.getAll()
  const clients = clientsStore.getAll()
  const newest = Math.max(...all.map((a) => a.createdAt.getTime()))
  const admins = ['Malika Rasulova', 'Sardor Saidov', 'Nodira Aliyeva']
  const birzum = { kind: 'system' as const, name: 'Birzum' }
  const out: Check[] = []
  const patches = new Map<string, Partial<Application>>()

  for (const application of all) {
    const client = clients.find((c) => c.id === application.clientId)
    if (!client) continue
    const n = Number(application.number)
    const recent = newest - application.createdAt.getTime() < 4 * DAY
    const checkedAt = new Date(application.createdAt.getTime() + 2 * 60_000)
    const [first, ...rest] = application.history
    const start: HistoryEntry = { status: 'checking', at: application.createdAt, by: first.by }

    // A few older ones the shop never saw: Birzum said no
    if (
      application.status === 'rejected' &&
      application.rejection?.reason === 'limit' &&
      n % 2 === 0
    ) {
      const comment = 'Oylik toʻlov daromadning yarmidan oshadi, boshqa nasiyalari ham bor.'
      const decidedAt = new Date(application.createdAt.getTime() + 40 * 60_000)
      out.push({
        id: application.id,
        mode: 'manual',
        state: 'rejected',
        baseScore: 66,
        score: 48,
        flags: ['nearLimit', 'manyRunning'],
        penalties: { nearLimit: 10, manyRunning: 8 },
        checkedAt,
        decidedAt,
        decidedBy: admins[n % admins.length],
        reason: 'income',
        comment,
      })
      patches.set(application.id, {
        rejection: { reason: 'risk', comment },
        history: [start, { status: 'rejected', at: decidedAt, by: birzum, comment }],
      })
      continue
    }

    // "Late now" says nothing about an ariza from weeks ago
    const flags = flagsOf(application, client, all, rules).filter((f) => recent || f !== 'overdue')
    let base = 97 - ((n * 37) % 31)
    let score = finalScore(base, flags, rules)
    // Everything that went ahead passed: lift the old samples above the reject line
    if (score < rules.rejectBelow) {
      base += rules.rejectBelow - score + 4
      score = finalScore(base, flags, rules)
    }
    const verdict = verdictOf(score, flags, rules)
    const penalties = Object.fromEntries(flags.map((f) => [f, penaltyOf(f, rules)]))
    const open = application.status === 'pending' || application.status === 'processing'

    if (open && recent && verdict === 'manual') {
      out.push({
        id: application.id,
        mode: 'manual',
        state: 'waiting',
        baseScore: base,
        score,
        flags,
        penalties,
        checkedAt,
      })
      patches.set(application.id, { status: 'checking', history: [start] })
      continue
    }
    const auto = verdict === 'approve'
    const decidedAt = auto ? checkedAt : new Date(checkedAt.getTime() + ((n % 5) + 1) * 900_000)
    out.push({
      id: application.id,
      mode: auto ? 'auto' : 'manual',
      state: 'approved',
      baseScore: base,
      score,
      flags,
      penalties,
      checkedAt,
      decidedAt,
      decidedBy: auto ? undefined : admins[n % admins.length],
    })
    // The approval is the step between "Birzum tekshirmoqda" and what came next
    patches.set(application.id, {
      history: [
        start,
        { ...first, at: new Date(Math.max(first.at.getTime(), decidedAt.getTime())) },
        ...rest,
      ],
    })
  }
  patches.forEach((patch, id) => applicationsStore.update(id, patch))
  return out
}

export const checksStore = createStore<Check>(seed())
