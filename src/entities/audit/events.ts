import { applicationsStore, type Application } from '@/entities/applications/applications'
import { limitsStore } from '@/entities/clients/limits'
import { clientsStore, fullName } from '@/entities/clients/clients'
import { paymentsStore } from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { loanApplicationsStore } from '@/entities/microloans/applications'
import { loanClientsStore } from '@/entities/microloans/loanClients'
import { paymentsOf } from '@/entities/microloans/loanPayments'
import { loansStore } from '@/entities/microloans/loans'
import { reviewsStore } from '@/entities/reviews/reviews'
import { chatsStore } from '@/entities/support/chats'
import { applicationPath, clientPath, merchantPath } from '@/shared/config/routes'
import {
  brandClientPath,
  brandLoanPath,
  loanAppPath,
  type Workspace,
} from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'
import { groupDigits } from '@/shared/lib/format'

/**
 * Every step in the apps and integrations, by workspace: what a client, a merchant's seller or
 * the system did, which outside service answered, and on failure the full error. Admin actions
 * stay in the audit log's own list (`audit.ts`). Entries are only ever added.
 */
export const EVENT_GROUPS = [
  'auth',
  'myid',
  'cards',
  'scoring',
  'ariza',
  'payments',
  'support',
] as const
export type EventGroup = (typeof EVENT_GROUPS)[number]

export const EVENT_STEPS = {
  auth: [
    'otpSent',
    'otpVerified',
    'otpWrong',
    'signedUp',
    'signedIn',
    'newDevice',
    'passwordReset',
    'pinSet',
    'signedOut',
    'phoneChanged',
  ],
  myid: ['myidPassport', 'myidFace'],
  cards: ['cardAdded', 'cardRemoved'],
  scoring: ['scoring', 'limitGiven', 'limitRefused'],
  ariza: [
    'arizaCreated',
    'arizaAccepted',
    'arizaRejected',
    'arizaTimeout',
    'arizaSent',
    'contractCreated',
    'goodsReceived',
    'handedOver',
    'arizaCancelled',
    'goodsReturned',
    'loanAppSent',
    'loanApproved',
    'loanCounter',
    'loanDeclined',
    'offerRefused',
    'offerExpired',
    'signedMyId',
    'payout',
  ],
  payments: ['paidApp', 'autoDebit', 'paidOffice', 'overdueStarted', 'loanClosed'],
  support: ['chatOpened', 'reviewLeft', 'reviewReplied'],
} as const satisfies Record<EventGroup, readonly string[]>
export type EventStep = (typeof EVENT_STEPS)[EventGroup][number]
export const groupOf = (step: EventStep) =>
  EVENT_GROUPS.find((group) => (EVENT_STEPS[group] as readonly string[]).includes(step))!

export const EVENT_ACTORS = ['client', 'merchant', 'system'] as const
export type EventActor = (typeof EVENT_ACTORS)[number]
export const SERVICES = ['SMS', 'MyID', 'FlexSoft', 'Atmos'] as const
export type Service = (typeof SERVICES)[number]

export type EventEntry = {
  id: string
  at: Date
  workspace: Workspace
  /** Who did it: the client, a merchant's seller, or the system on its own (timers, jobs). */
  actor: { kind: EventActor; name: string }
  step: EventStep
  /** Words for the step's text, e.g. the sum or the card. */
  params?: Record<string, string>
  ok: boolean
  /** The outside service the step called, if any. */
  service?: Service
  /** How long the call took, ms. */
  ms?: number
  /** The client it is about, with a link to their page. */
  client?: { name: string; href: string }
  /** The ariza, loan or merchant it is about. */
  object?: { label: string; href: string }
  device?: string
  ip?: string
  /** What was sent to the service and what came back, as JSON. */
  request?: string
  response?: string
  /** On failure: the service's code and message, and what the client saw. */
  error?: { code: string; message: string; shown?: string }
}

// ── Sample log, generated with a fixed seed from the other sample data. Replace with the API.

let state = 20261118
const random = () => {
  state = (state * 1103515245 + 12345) % 2147483648
  return state / 2147483648
}
const chance = (p: number) => random() < p
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]
const later = (at: Date, minutes: number) => new Date(at.getTime() + minutes * 60_000)
const json = (value: unknown) => JSON.stringify(value, null, 2)
const masked = (phone: string) => `${phone.slice(0, 6)}***${phone.slice(-2)}`
const ip = () =>
  `${pick(['84.54', '213.230', '195.158', '37.110'])}.${Math.floor(random() * 250)}.${Math.floor(random() * 250)}`
const DEVICES = [
  'iOS 18.1 · iPhone 14',
  'Android 14 · Galaxy A54',
  'Android 13 · Redmi Note 12',
  'iOS 17.6 · iPhone 12',
]
const sum = (n: number) => `${groupDigits(n)} UZS`

function seed(): EventEntry[] {
  const out: EventEntry[] = []
  let n = 0
  const now = new Date()
  const add = (entry: Omit<EventEntry, 'id'>) => {
    if (entry.at <= now) out.push({ ...entry, id: `e${++n}` })
  }

  // ── Birzum: shoppers
  const clients = clientsStore.getAll()
  const merchants = merchantsStore.getAll()
  for (const c of clients) {
    const client = { name: fullName(c), href: clientPath(c.id) }
    const who = { kind: 'client' as const, name: client.name }
    const device = pick(DEVICES)
    const base = { workspace: 'birzum' as const, actor: who, client, device, ip: ip() }
    let at = c.registeredAt
    const otp = (t: Date) =>
      add({
        ...base,
        at: t,
        step: 'otpSent',
        ok: true,
        service: 'SMS',
        ms: 300 + Math.floor(random() * 500),
        request: json({ phone: masked(c.phone), template: 'otp_login' }),
        response: json({ status: 'DELIVERED', messageId: `sms-${n + 1}` }),
      })
    otp(at)
    if (chance(0.2)) {
      at = later(at, 1)
      add({
        ...base,
        at,
        step: 'otpWrong',
        ok: false,
        error: { code: 'OTP_INVALID', message: 'Code does not match', shown: 'Kod notoʻgʻri' },
      })
    }
    at = later(at, 1)
    add({ ...base, at, step: 'otpVerified', ok: true })
    // MyID: passport, then the face; some needed a second try
    at = later(at, 2)
    add({
      ...base,
      at,
      step: 'myidPassport',
      ok: true,
      service: 'MyID',
      ms: 900 + Math.floor(random() * 900),
      request: json({
        passport: `${c.passport.slice(0, 2)}*****${c.passport.slice(-2)}`,
        birthDate: '••.••.••••',
      }),
      response: json({ result: 'FOUND', pinfl: `${c.pinfl.slice(0, 4)}**********` }),
    })
    if (chance(0.15)) {
      at = later(at, 1)
      add({
        ...base,
        at,
        step: 'myidFace',
        ok: false,
        service: 'MyID',
        ms: 2400,
        request: json({ job: `myid-${n}`, liveness: true }),
        response: json({ result: 'REJECTED', score: 0.41, threshold: 0.75 }),
        error: {
          code: 'FACE_NOT_MATCHED',
          message: 'Face similarity 0.41 below threshold 0.75',
          shown: 'Yuz pasportdagi suratga mos kelmadi. Qayta urinib koʻring',
        },
      })
    }
    at = later(at, 2)
    add({
      ...base,
      at,
      step: 'myidFace',
      ok: true,
      service: 'MyID',
      ms: 1800 + Math.floor(random() * 900),
      request: json({ job: `myid-${n}`, liveness: true }),
      response: json({ result: 'MATCHED', score: 0.93 }),
    })
    at = later(at, 1)
    add({ ...base, at, step: 'signedUp', ok: true })
    at = later(at, 1)
    add({ ...base, at, step: 'pinSet', ok: true })
    for (const card of c.cards) {
      at = later(at, 3)
      add({
        ...base,
        at,
        step: 'cardAdded',
        params: { card: `•••• ${card.last4}` },
        ok: true,
        service: 'Atmos',
        ms: 700,
        request: json({ pan: `•••• ${card.last4}`, expiry: card.expiry, otp: '••••••' }),
        response: json({ status: 'BOUND', ownerPinflMatch: true, token: 'tok_•••' }),
      })
    }
    // Each limit came from a FlexSoft scoring
    for (const change of limitsStore
      .getAll()
      .filter((l) => l.clientId === c.id && l.source === 'scoring')) {
      if (chance(0.1))
        add({
          ...base,
          actor: { kind: 'system', name: 'Birzum' },
          at: later(change.at, -3),
          step: 'scoring',
          ok: false,
          service: 'FlexSoft',
          ms: 30_000,
          request: json({ pinfl: `${c.pinfl.slice(0, 4)}**********`, product: 'nasiya' }),
          response: json({ error: 'Gateway Timeout' }),
          error: {
            code: 'HTTP_504',
            message: 'FlexSoft scoring did not answer in 30 s',
            shown: 'Limit hisoblanmoqda, biroz kuting',
          },
        })
      add({
        ...base,
        actor: { kind: 'system', name: 'Birzum' },
        at: change.at,
        step: 'scoring',
        ok: true,
        service: 'FlexSoft',
        ms: 2100 + Math.floor(random() * 3000),
        request: json({ pinfl: `${c.pinfl.slice(0, 4)}**********`, product: 'nasiya' }),
        response: json({
          decision: 'APPROVED',
          limit: change.to,
          validUntil: change.validUntil.toISOString().slice(0, 10),
        }),
      })
      add({
        ...base,
        at: later(change.at, 0.1),
        actor: { kind: 'system', name: 'FlexSoft' },
        step: 'limitGiven',
        params: { sum: sum(change.to) },
        ok: true,
      })
    }
    if (!c.limit && chance(0.6))
      add({
        ...base,
        actor: { kind: 'system', name: 'FlexSoft' },
        at: later(c.registeredAt, 60 * 24),
        step: 'limitRefused',
        ok: false,
        service: 'FlexSoft',
        response: json({ decision: 'DECLINED', reason: 'CREDIT_HISTORY' }),
        error: {
          code: 'DECLINED',
          message: 'Credit history: 3 late payments in 12 months',
          shown: 'Hozircha limit berilmadi',
        },
      })
    // Later sign-ins, some from a new phone
    let seen = later(c.registeredAt, 60 * 24 * 3)
    while (seen < now && chance(0.85)) {
      const fresh = chance(0.12)
      if (fresh) {
        otp(seen)
        add({ ...base, at: later(seen, 1), step: 'newDevice', ok: true, device: pick(DEVICES) })
      } else if (chance(0.06)) {
        // Forgot the PIN: a new code by SMS, then a new PIN
        otp(seen)
        add({ ...base, at: later(seen, 2), step: 'passwordReset', ok: true })
      } else add({ ...base, at: seen, step: 'signedIn', ok: true })
      if (chance(0.05)) add({ ...base, at: later(seen, 30), step: 'signedOut', ok: true })
      if (chance(0.03) && c.cards[0])
        add({
          ...base,
          at: later(seen, 10),
          step: 'cardRemoved',
          params: { card: `•••• ${c.cards[0].last4}` },
          ok: true,
        })
      seen = later(seen, 60 * 24 * (4 + random() * 10))
    }
  }

  // ── Birzum: arizalar, from their history
  const shop = (a: Application) => merchants.find((m) => m.id === a.merchantId)
  for (const a of applicationsStore.getAll()) {
    const client = { name: a.client.name, href: clientPath(a.clientId) }
    const object = { label: `№ ${groupDigits(a.number)}`, href: applicationPath(a.id) }
    const base = { workspace: 'birzum' as const, client, object, ip: ip() }
    const actorOf = (kind: string, name: string) =>
      kind === 'customer'
        ? { kind: 'client' as const, name }
        : kind === 'staff'
          ? { kind: 'merchant' as const, name: `${name} (${shop(a)?.name ?? ''})` }
          : { kind: 'system' as const, name }
    for (const entry of a.history) {
      const actor = actorOf(entry.by.kind, entry.by.name)
      if (entry.status === 'pending')
        add({
          ...base,
          actor,
          at: entry.at,
          step: 'arizaCreated',
          params: { sum: sum(a.goodsTotal) },
          ok: true,
        })
      else if (entry.status === 'creating') {
        add({
          ...base,
          actor,
          at: entry.at,
          step: a.source === 'client' ? 'arizaAccepted' : 'arizaCreated',
          params: { sum: sum(a.goodsTotal) },
          ok: true,
        })
        add({
          ...base,
          actor: { kind: 'system', name: 'Birzum' },
          at: later(entry.at, 0.2),
          step: 'arizaSent',
          ok: true,
          service: 'FlexSoft',
          ms: 600 + Math.floor(random() * 800),
          request: json({
            application: a.number,
            pinfl: `${a.client.pinfl.slice(0, 4)}**********`,
            financed: a.goodsTotal - a.downPayment,
            term: a.term,
          }),
          response: json({ status: 'ACCEPTED', id: `fs-${a.number}` }),
        })
      } else if (entry.status === 'processing')
        add({
          ...base,
          actor: { kind: 'system', name: 'FlexSoft' },
          at: entry.at,
          step: 'contractCreated',
          params: { number: a.contractNumber ?? '' },
          ok: true,
          service: 'FlexSoft',
          response: json({
            contract: a.contractNumber,
            schedule: `${a.term} x ${a.monthlyPayment}`,
          }),
        })
      else if (entry.status === 'received')
        add({ ...base, actor, at: entry.at, step: 'goodsReceived', ok: true })
      else if (entry.status === 'handed')
        add({
          ...base,
          actor,
          at: entry.at,
          step: 'handedOver',
          params: { photos: String(a.handoverPhotos?.length ?? 0) },
          ok: true,
        })
      else if (entry.status === 'rejected')
        add({
          ...base,
          actor,
          at: entry.at,
          step: a.rejection?.reason === 'timeout' ? 'arizaTimeout' : 'arizaRejected',
          ok: false,
          error: {
            code:
              a.rejection?.reason === 'timeout'
                ? 'CONFIRM_TIMEOUT'
                : `REJECTED_${(a.rejection?.reason ?? 'other').toUpperCase()}`,
            message:
              a.rejection?.reason === 'timeout'
                ? 'The shop did not answer in 24 hours'
                : a.rejection?.comment || 'Rejected by the shop',
          },
        })
      else if (entry.status === 'cancelled')
        add({
          ...base,
          actor,
          at: entry.at,
          step: a.returnReason ? 'goodsReturned' : 'arizaCancelled',
          ok: true,
          params: { note: entry.comment ?? '' },
        })
      else if (entry.status === 'closed')
        add({
          ...base,
          actor: { kind: 'system', name: 'Birzum' },
          at: entry.at,
          step: 'loanClosed',
          ok: true,
        })
    }
  }

  // ── Birzum: payments
  for (const p of paymentsStore.getAll()) {
    const c = clients.find((x) => x.id === p.clientId)
    if (!c) continue
    const a = applicationsStore.get(p.applicationId)
    const card = c.cards.find((x) => x.id === p.cardId)
    const base = {
      workspace: 'birzum' as const,
      client: { name: fullName(c), href: clientPath(c.id) },
      object: a ? { label: `№ ${groupDigits(a.number)}`, href: applicationPath(a.id) } : undefined,
      params: { sum: sum(p.amount), card: card ? `•••• ${card.last4}` : '—' },
    }
    if (p.method === 'cash' || p.method === 'transfer') {
      add({
        ...base,
        actor: { kind: 'system', name: p.by ?? 'Birzum' },
        at: p.at,
        step: 'paidOffice',
        ok: !p.failed,
      })
      continue
    }
    const step = p.method === 'auto' ? 'autoDebit' : 'paidApp'
    add({
      ...base,
      actor:
        step === 'autoDebit'
          ? { kind: 'system', name: 'Birzum' }
          : { kind: 'client', name: fullName(c) },
      at: p.at,
      step,
      ok: !p.failed,
      service: 'Atmos',
      ms: 800 + Math.floor(random() * 1200),
      request: json({
        token: 'tok_•••',
        amount: p.amount,
        ...(step === 'paidApp' ? { otp: '••••••' } : {}),
      }),
      response: p.failed
        ? json({
            status: 'DECLINED',
            code: p.failed === 'funds' ? 51 : p.failed === 'cardBlocked' ? 62 : 54,
          })
        : json({ status: 'SUCCESS', transactionId: `atm-${n + 1}` }),
      error: p.failed
        ? {
            code:
              p.failed === 'funds'
                ? 'INSUFFICIENT_FUNDS'
                : p.failed === 'cardBlocked'
                  ? 'CARD_BLOCKED'
                  : 'CARD_EXPIRED',
            message:
              p.failed === 'funds'
                ? 'Not enough money on the card'
                : p.failed === 'cardBlocked'
                  ? 'The card is blocked by the bank'
                  : 'The card has expired',
            shown: 'Toʻlov oʻtmadi',
          }
        : undefined,
    })
  }

  // ── Birzum: reviews
  for (const r of reviewsStore.getAll()) {
    const client = { name: r.author, href: clientPath(r.clientId) }
    const object = { label: r.productName, href: applicationPath(r.applicationId) }
    add({
      workspace: 'birzum',
      actor: { kind: 'client', name: r.author },
      client,
      object,
      at: r.at,
      step: 'reviewLeft',
      params: { stars: String(r.rating) },
      ok: true,
    })
    if (r.reply) {
      const m = merchants.find((x) => x.id === r.merchantId)
      add({
        workspace: 'birzum',
        actor: { kind: 'merchant', name: m?.name ?? '—' },
        client,
        object: m ? { label: m.name, href: merchantPath(m.id) } : object,
        at: r.reply.at,
        step: 'reviewReplied',
        ok: true,
      })
    }
  }

  // ── Fortuna and Vodiy: borrowers, arizalar, payouts, payments
  for (const c of loanClientsStore.getAll()) {
    const client = { name: c.name, href: brandClientPath(c.brand, c.id) }
    const who = { kind: 'client' as const, name: c.name }
    const device = `${c.device.os === 'ios' ? 'iOS' : 'Android'} · ${c.device.app}`
    const base = { workspace: c.brand, actor: who, client, device, ip: ip() }
    let at = c.registeredAt
    add({
      ...base,
      at,
      step: 'otpSent',
      ok: true,
      service: 'SMS',
      ms: 400,
      request: json({ phone: masked(c.phone) }),
      response: json({ status: 'DELIVERED' }),
    })
    at = later(at, 1)
    add({ ...base, at, step: 'otpVerified', ok: true })
    at = later(at, 2)
    if (chance(0.12)) {
      add({
        ...base,
        at,
        step: 'myidFace',
        ok: false,
        service: 'MyID',
        ms: 2600,
        response: json({ result: 'LIVENESS_FAILED' }),
        error: {
          code: 'LIVENESS_FAILED',
          message: 'Liveness check failed: photo of a photo',
          shown: 'Yuzni aniqlab boʻlmadi. Yorugʻroq joyda qayta urinib koʻring',
        },
      })
      at = later(at, 2)
    }
    add({
      ...base,
      at,
      step: 'myidFace',
      ok: true,
      service: 'MyID',
      ms: 1900,
      response: json({ result: 'MATCHED', score: 0.91 }),
    })
    at = later(at, 1)
    add({ ...base, at, step: 'signedUp', ok: true })
    for (const old of c.phoneHistory)
      add({
        ...base,
        at: old.until,
        step: 'phoneChanged',
        params: { phone: masked(c.phone) },
        ok: true,
      })
  }
  for (const app of loanApplicationsStore.getAll()) {
    const id = `${app.brand}-${app.borrower.passport}`
    const client = { name: app.borrower.name, href: brandClientPath(app.brand, id) }
    const object = { label: `№ ${groupDigits(app.number)}`, href: loanAppPath(app.brand, app.id) }
    const base = { workspace: app.brand, client, object, ip: ip() }
    const me = { kind: 'client' as const, name: app.borrower.name }
    for (const e of app.history) {
      if (e.status === 'review') {
        if (chance(0.2))
          add({
            ...base,
            actor: me,
            at: later(e.at, -2),
            step: 'cardAdded',
            params: { card: `•••• 0000` },
            ok: false,
            service: 'Atmos',
            ms: 900,
            request: json({ pan: '•••• 0000', otp: '••••••' }),
            response: json({ status: 'BOUND', ownerPinflMatch: false }),
            error: {
              code: 'PINFL_MISMATCH',
              message: 'Card owner PINFL differs from the client',
              shown: 'Karta sizning nomingizga emas',
            },
          })
        add({
          ...base,
          actor: me,
          at: e.at,
          step: 'loanAppSent',
          params: { sum: sum(app.amount) },
          ok: true,
        })
      } else if (e.status === 'approved' || e.status === 'counter' || e.status === 'declined')
        add({
          ...base,
          actor: { kind: 'system', name: 'FlexSoft' },
          at: e.at,
          step:
            e.status === 'approved'
              ? 'loanApproved'
              : e.status === 'counter'
                ? 'loanCounter'
                : 'loanDeclined',
          params: { sum: sum(app.offered ?? app.amount), asked: sum(app.amount) },
          ok: e.status !== 'declined',
          service: 'FlexSoft',
          ms: 3000 + Math.floor(random() * 4000),
          request: json({
            application: app.number,
            amount: app.amount,
            term: app.term,
            income: app.income,
          }),
          response: json({
            decision: e.status.toUpperCase(),
            offered: app.offered ?? app.amount,
            load: app.checks.load,
          }),
          error:
            e.status === 'declined'
              ? {
                  code: `DECLINED_${(app.decline?.reason ?? 'other').toUpperCase()}`,
                  message: app.decline?.comment ?? `Declined: ${app.decline?.reason ?? 'other'}`,
                }
              : undefined,
        })
      else if (e.status === 'signed')
        add({
          ...base,
          actor: me,
          at: e.at,
          step: 'signedMyId',
          ok: true,
          service: 'MyID',
          ms: 2100,
          response: json({
            result: 'MATCHED',
            score: 0.94,
            document: `contract-${app.number}.pdf`,
          }),
        })
      else if (e.status === 'paidOut') {
        const failed = chance(0.1)
        if (failed)
          add({
            ...base,
            actor: { kind: 'system', name: 'Atmos' },
            at: later(e.at, -2),
            step: 'payout',
            params: { sum: sum(app.offered ?? app.amount), card: `•••• ${app.card.last4}` },
            ok: false,
            service: 'Atmos',
            ms: 15_000,
            request: json({ card: `•••• ${app.card.last4}`, amount: app.offered ?? app.amount }),
            response: json({ status: 'ERROR', code: 91 }),
            error: {
              code: 'ISSUER_UNAVAILABLE',
              message: 'Card issuer bank did not answer (code 91)',
              shown: 'Pul oʻtkazilmoqda',
            },
          })
        add({
          ...base,
          actor: { kind: 'system', name: 'Atmos' },
          at: e.at,
          step: 'payout',
          params: { sum: sum(app.offered ?? app.amount), card: `•••• ${app.card.last4}` },
          ok: true,
          service: 'Atmos',
          ms: 1500,
          request: json({ card: `•••• ${app.card.last4}`, amount: app.offered ?? app.amount }),
          response: json({ status: 'SUCCESS', transactionId: `atm-${n + 1}` }),
        })
      } else if (e.status === 'refused')
        add({
          ...base,
          actor: me,
          at: e.at,
          step: 'offerRefused',
          params: { note: app.refusal?.note ?? app.refusal?.reason ?? '' },
          ok: true,
        })
      else if (e.status === 'expired')
        add({
          ...base,
          actor: { kind: 'system', name: 'Birzum' },
          at: e.at,
          step: 'offerExpired',
          ok: false,
          error: { code: 'OFFER_EXPIRED', message: 'The offer was not signed in time' },
        })
    }
  }
  const loans = loansStore.getAll()
  for (const p of paymentsOf(loans)) {
    const loan = p.loan
    const client = {
      name: loan.borrower.name,
      href: brandClientPath(loan.brand, `${loan.brand}-${loan.borrower.passport}`),
    }
    const object = { label: loan.number, href: brandLoanPath(loan.brand, loan.id) }
    const base = {
      workspace: loan.brand,
      client,
      object,
      params: { sum: sum(p.amount), card: `•••• ${loan.card.last4}` },
    }
    if (p.method === 'cash' || p.method === 'transfer') {
      add({
        ...base,
        actor: {
          kind: 'system',
          name: loan.brand === 'fortuna' ? 'Fortuna Biznes' : 'Vodiy Taraqqiyot',
        },
        at: p.at,
        step: 'paidOffice',
        ok: p.ok,
      })
      continue
    }
    const step = p.method === 'auto' ? 'autoDebit' : 'paidApp'
    add({
      ...base,
      actor:
        step === 'autoDebit'
          ? { kind: 'system', name: 'Birzum' }
          : { kind: 'client', name: loan.borrower.name },
      at: p.at,
      step,
      ok: p.ok,
      service: 'Atmos',
      ms: 900 + Math.floor(random() * 900),
      request: json({
        token: 'tok_•••',
        amount: p.amount,
        ...(step === 'paidApp' ? { otp: '••••••' } : {}),
      }),
      response: p.ok
        ? json({ status: 'SUCCESS' })
        : json({
            status: 'DECLINED',
            code: p.reason === 'funds' ? 51 : p.reason === 'blocked' ? 62 : 54,
          }),
      error: p.ok
        ? undefined
        : {
            code:
              p.reason === 'funds'
                ? 'INSUFFICIENT_FUNDS'
                : p.reason === 'blocked'
                  ? 'CARD_BLOCKED'
                  : 'CARD_EXPIRED',
            message:
              p.reason === 'funds'
                ? 'Not enough money on the card'
                : p.reason === 'blocked'
                  ? 'The card is blocked by the bank'
                  : 'The card has expired',
            shown: 'Toʻlov oʻtmadi',
          },
    })
  }
  for (const loan of loans) {
    const client = {
      name: loan.borrower.name,
      href: brandClientPath(loan.brand, `${loan.brand}-${loan.borrower.passport}`),
    }
    const object = { label: loan.number, href: brandLoanPath(loan.brand, loan.id) }
    const system = { kind: 'system' as const, name: 'Birzum' }
    if (loan.overdueSince)
      add({
        workspace: loan.brand,
        actor: system,
        client,
        object,
        at: loan.overdueSince,
        step: 'overdueStarted',
        ok: false,
        error: { code: 'OVERDUE', message: 'The monthly payment was not paid on its day' },
      })
    if (loan.closedAt)
      add({
        workspace: loan.brand,
        actor: system,
        client,
        object,
        at: loan.closedAt,
        step: 'loanClosed',
        ok: true,
      })
  }

  // ── Support chats opened from the apps
  for (const chat of chatsStore.getAll()) {
    const first = chat.messages.find((m) => m.from === 'client')
    if (!first) continue
    const person =
      chat.app === 'birzum'
        ? clients.find((x) => x.id === chat.clientId)
        : loanClientsStore.get(chat.clientId)
    if (!person) continue
    const name = 'name' in person ? person.name : fullName(person)
    add({
      workspace: chat.app,
      actor: { kind: 'client', name },
      client: {
        name,
        href:
          chat.app === 'birzum'
            ? clientPath(chat.clientId)
            : brandClientPath(chat.app, chat.clientId),
      },
      at: first.at,
      step: 'chatOpened',
      params: { topic: chat.topic },
      ok: true,
    })
  }

  return out.sort((a, b) => b.at.getTime() - a.at.getTime())
}

export const eventsStore = createStore<EventEntry>(seed())
