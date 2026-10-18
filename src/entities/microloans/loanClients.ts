import { BLOCK_REASONS, type BlockReason } from '@/entities/clients/clients'
import { loanApplicationsStore, type LoanApplication } from '@/entities/microloans/applications'
import { loansStore, type Loan } from '@/entities/microloans/loans'
import type { Brand } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'
import type { StatusTone } from '@/shared/ui/StatusBadge'

export { BLOCK_REASONS, type BlockReason }

/**
 * Everyone who signed up in a brand's app — phone, SMS code, MyID — whether they borrowed or
 * not. Arizalar and loans belong to a client by passport, which stays when the phone changes.
 */
export type LoanClient = {
  id: string
  brand: Brand
  name: string
  phone: string
  passport: string
  birthDate: string
  address: string
  registeredAt: Date
  lastSeenAt: Date
  device: { os: 'ios' | 'android'; app: string }
  /** Earlier numbers, newest first, when the client changed theirs in the app. */
  phoneHistory: { phone: string; until: Date }[]
  block?: { reason: BlockReason; comment: string; at: Date; by: string }
}

/** Where a client is with the brand, worked out from their arizalar and loans. */
export const CLIENT_SEGMENTS = ['registered', 'applied', 'active', 'late', 'repaid'] as const
export type ClientSegment = (typeof CLIENT_SEGMENTS)[number]
export const segmentTone: Record<ClientSegment, StatusTone> = {
  registered: 'neutral',
  applied: 'info',
  active: 'success',
  late: 'danger',
  repaid: 'neutral',
}

export function segmentOf(
  client: LoanClient,
  apps: LoanApplication[],
  loans: Loan[],
): ClientSegment {
  const own = loans.filter((loan) => loan.borrower.passport === client.passport)
  if (own.some((loan) => !loan.closedAt && loan.overdueSince)) return 'late'
  if (own.some((loan) => !loan.closedAt)) return 'active'
  if (own.length > 0) return 'repaid'
  return apps.some((app) => app.borrower.passport === client.passport) ? 'applied' : 'registered'
}

// ── Sample clients: everyone who sent an ariza, plus people who only signed up. Replace with the API.

const NOW = new Date()
const DAY = 86_400_000
const ADDRESSES = [
  'Toshkent sh., Chilonzor tumani, 9-kvartal, 12-uy',
  'Fargʻona sh., Mustaqillik koʻchasi, 41-uy',
  'Andijon sh., Navoiy shoh koʻchasi, 7-uy',
  'Namangan sh., Davlatobod tumani, 3-mavze, 18-uy',
  'Qarshi sh., I. Karimov koʻchasi, 120-uy',
  'Samarqand sh., Registon koʻchasi, 55-uy',
]
const ONLY_SIGNED_UP = [
  ['Aliyev Shoxrux Baxtiyor oʻgʻli', '04.03.1994'],
  ['Normatova Dildora Akram qizi', '18.11.1998'],
  ['Usmonov Sherzod Ravshan oʻgʻli', '23.07.1987'],
  ['Qosimova Lola Farhod qizi', '09.09.2000'],
  ['Joʻrayev Bobur Tohir oʻgʻli', '30.01.1991'],
  ['Tursunova Malika Sobir qizi', '12.12.1996'],
  ['Xudoyberdiyev Anvar Ilyos oʻgʻli', '15.05.1983'],
  ['Raxmatova Nilufar Usmon qizi', '27.08.1993'],
  ['Ibragimov Sanjar Kamol oʻgʻli', '06.04.2001'],
  ['Murodova Sevara Jamol qizi', '21.10.1989'],
  ['Eshmatov Ulugʻbek Saidovich', '02.02.1980'],
  ['Pulatova Gulchehra Rustam qizi', '16.06.1997'],
] as const

function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

function seed(brand: Brand, base: number): LoanClient[] {
  const next = random(base)
  const device = (): LoanClient['device'] => ({
    os: next() < 0.62 ? 'android' : 'ios',
    app: next() < 0.8 ? '1.0.0' : '0.9.4',
  })
  const people = new Map<string, LoanClient>()
  // Anyone who borrowed or sent an ariza: signed up shortly before their first one
  const firsts = [
    ...loansStore
      .getAll()
      .filter((loan) => loan.brand === brand)
      .map((loan) => ({ who: loan.borrower, at: loan.issuedAt, birth: '' })),
    ...loanApplicationsStore
      .getAll()
      .filter((app) => app.brand === brand)
      .map((app) => ({ who: app.borrower, at: app.createdAt, birth: app.borrower.birthDate })),
  ]
  for (const { who, at, birth } of firsts) {
    const known = people.get(who.passport)
    const registeredAt = new Date(at.getTime() - (1 + Math.floor(next() * 20)) * DAY)
    if (known) {
      if (registeredAt < known.registeredAt) known.registeredAt = registeredAt
      if (birth && !known.birthDate) known.birthDate = birth
      continue
    }
    people.set(who.passport, {
      id: `${brand}-${who.passport}`,
      brand,
      name: who.name,
      phone: who.phone,
      passport: who.passport,
      birthDate: birth,
      address: ADDRESSES[Math.floor(next() * ADDRESSES.length)],
      registeredAt,
      lastSeenAt: new Date(
        NOW.getTime() - Math.floor(next() * 9) * DAY - Math.floor(next() * 20) * 3_600_000,
      ),
      device: device(),
      phoneHistory: [],
    })
  }
  // People who only signed up: looked at the products, never applied
  ONLY_SIGNED_UP.forEach(([name, birthDate], i) => {
    const passport = `A${'CDEF'[i % 4]}${String(2000000 + Math.floor(next() * 7999999)).slice(0, 7)}`
    const registeredAt = new Date(NOW.getTime() - Math.floor(next() * 75) * DAY - 9 * 3_600_000)
    people.set(passport, {
      id: `${brand}-${passport}`,
      brand,
      name,
      phone: `9${1 + (i % 8)}${String(1000000 + Math.floor(next() * 8999999)).slice(0, 7)}`,
      passport,
      birthDate,
      address: ADDRESSES[i % ADDRESSES.length],
      registeredAt,
      lastSeenAt: new Date(
        Math.max(registeredAt.getTime(), NOW.getTime() - Math.floor(next() * 30) * DAY),
      ),
      device: device(),
      phoneHistory: [],
    })
  })
  const list = [...people.values()].sort(
    (a, b) => b.registeredAt.getTime() - a.registeredAt.getTime(),
  )
  // Birth dates for borrowers known only from an older loan
  list.forEach((client, i) => {
    if (!client.birthDate)
      client.birthDate = `${String(1 + (i % 27)).padStart(2, '0')}.0${1 + (i % 9)}.19${80 + (i % 19)}`
  })
  // One changed their number in the app, one was blocked
  if (list[3])
    list[3].phoneHistory = [
      {
        phone: `90${String(1000000 + Math.floor(next() * 8999999)).slice(0, 7)}`,
        until: new Date(NOW.getTime() - 40 * DAY),
      },
    ]
  const blocked = list.find((_, i) => i > 5)
  if (blocked)
    blocked.block = {
      reason: 'fraud',
      comment: 'Boshqa odamning pasporti bilan roʻyxatdan oʻtishga urindi, MyID mos kelmadi.',
      at: new Date(NOW.getTime() - 12 * DAY),
      by: 'Sardor Saidov',
    }
  return list
}

export const loanClientsStore = createStore<LoanClient>([
  ...seed('fortuna', 31),
  ...seed('vodiy', 47),
])
