import { adminsStore } from '@/entities/admins/admins'
import { clientsStore, fullName } from '@/entities/clients/clients'
import { merchantsStore } from '@/entities/merchants/merchants'
import { getAdmin } from '@/entities/session/session'
import { clientPath, merchantPath } from '@/shared/config/routes'
import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { createStore, newId } from '@/shared/lib/createStore'
import { groupDigits } from '@/shared/lib/format'

/** What kind of thing an admin did, for the coloured badge and the filter. */
export const AUDIT_KINDS = ['create', 'update', 'delete', 'money', 'access'] as const
export type AuditKind = (typeof AUDIT_KINDS)[number]

/** One field an action changed, shown as before → after in the entry's details. */
export type AuditChange = { field: TranslationKey; from: string; to: string }

/** One thing someone did in the admin panel. Entries are only ever added, never edited. */
export type AuditEntry = {
  id: string
  at: Date
  /** Who did it: their name, kept as it was at the time. */
  admin: string
  /** The panel page it happened on, a key of the role sections. */
  section: string
  kind: AuditKind
  /** What happened, e.g. "Klientni blokladi". */
  action: TranslationKey
  params?: Record<string, string>
  /** What it was done to, e.g. the client's name, with a link to it when it still exists. */
  target?: string
  href?: string
  changes?: AuditChange[]
  ip: string
}

export const auditStore = createStore<AuditEntry>([])

type NewEntry = Omit<AuditEntry, 'id' | 'at' | 'admin' | 'ip'>

/** Records an action by the signed-in admin. Call it right where the action succeeds. */
export function logAction(entry: NewEntry) {
  auditStore.save({
    ...entry,
    id: newId(),
    at: new Date(),
    admin: getAdmin()?.name ?? '—',
    ip: '84.54.70.12',
  })
}

/** "12 500 000 UZS", for action params. */
export const sumParam = (amount: number) => `${groupDigits(amount)} UZS`

// Sample history: about a month of believable work by the sample admins, generated with a
// fixed seed so every load shows the same log. Replace with the API.
function seed(): AuditEntry[] {
  let state = 20261018
  const random = () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]
  const admins = adminsStore.getAll().filter((admin) => admin.status === 'active')
  const clients = clientsStore.getAll()
  const merchants = merchantsStore.getAll()
  const client = () => {
    const c = pick(clients)
    return { target: fullName(c), href: clientPath(c.id) }
  }
  const merchant = () => {
    const m = pick(merchants)
    return { target: m.name, href: merchantPath(m.id) }
  }
  const sum = (min: number, max: number) =>
    sumParam(Math.round((min + random() * (max - min)) / 50_000) * 50_000)

  const kinds: (() => NewEntry)[] = [
    () => ({
      section: 'collections',
      kind: 'money',
      action: 'audit.a.charged',
      params: { sum: sum(400_000, 2_500_000) },
      ...client(),
    }),
    () => ({
      section: 'collections',
      kind: 'money',
      action: 'audit.a.paymentEntered',
      params: { sum: sum(300_000, 3_000_000) },
      ...client(),
    }),
    () => ({ section: 'collections', kind: 'update', action: 'audit.a.contactSaved', ...client() }),
    () => ({ section: 'collections', kind: 'update', action: 'audit.a.reminded', ...client() }),
    () => ({
      section: 'customers',
      kind: 'update',
      action: 'audit.a.clientBlocked',
      ...client(),
      changes: [{ field: 'audit.f.status', from: 'Faol', to: 'Bloklangan' }],
    }),
    () => ({
      section: 'customers',
      kind: 'update',
      action: 'audit.a.clientUnblocked',
      ...client(),
      changes: [{ field: 'audit.f.status', from: 'Bloklangan', to: 'Faol' }],
    }),
    () => ({
      section: 'payouts',
      kind: 'money',
      action: 'audit.a.payoutCreated',
      params: { sum: sum(8_000_000, 90_000_000) },
      ...merchant(),
    }),
    () => ({
      section: 'payouts',
      kind: 'money',
      action: 'audit.a.payoutSent',
      params: { sum: sum(8_000_000, 90_000_000) },
      ...merchant(),
    }),
    () => ({
      section: 'merchants',
      kind: 'update',
      action: 'audit.a.merchantUpdated',
      ...merchant(),
      changes: [{ field: 'audit.f.phone', from: '+998 71 200 11 22', to: '+998 71 200 11 33' }],
    }),
    () => ({ section: 'reviews', kind: 'update', action: 'audit.a.reviewHidden', ...merchant() }),
    () => ({
      section: 'categories',
      kind: 'update',
      action: 'audit.a.categorySaved',
      target: pick(['Telefonlar', 'Noutbuklar', 'Maishiy texnika', 'Televizorlar']),
    }),
    () => ({
      section: 'brands',
      kind: 'create',
      action: 'audit.a.brandCreated',
      target: pick(['Xiaomi', 'Artel', 'Samsung', 'Lenovo']),
    }),
    () => ({
      section: 'pricing',
      kind: 'update',
      action: 'audit.a.pricingSaved',
      changes: [{ field: 'audit.f.markup12', from: '38%', to: '36%' }],
    }),
    () => ({
      section: 'broadcasts',
      kind: 'create',
      action: 'audit.a.broadcastSent',
      target: pick(['Yangi yil chegirmalari', 'Toʻlov eslatmasi', 'Yangi doʻkonlar']),
    }),
    () => ({
      section: 'faq',
      kind: 'update',
      action: 'audit.a.faqSaved',
      target: 'Limit qanday hisoblanadi?',
    }),
    () => ({ section: 'support', kind: 'update', action: 'audit.a.chatClosed', ...client() }),
    () => ({ section: 'admins', kind: 'access', action: 'audit.a.signedIn' }),
    () => ({ section: 'admins', kind: 'access', action: 'audit.a.signedIn' }),
  ]

  const now = Date.now()
  const entries: AuditEntry[] = []
  for (let i = 0; i < 160; i++) {
    const admin = pick(admins)
    // Working hours, 09:00 to 19:00, spread over the last 30 days
    const day = new Date(now - Math.floor(random() * 30) * 86_400_000)
    day.setHours(9 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0)
    if (day.getTime() > now) day.setTime(now - Math.floor(random() * 3_600_000))
    entries.push({
      ...pick(kinds)(),
      id: `log-${i}`,
      at: day,
      admin: admin.name,
      ip: `84.54.${70 + (admin.name.length % 5)}.${10 + (admin.name.length % 40)}`,
    })
  }
  // A few rare but important ones, so they show in the sample
  const owner = admins[0]?.name ?? 'Sardor Saidov'
  const rare: NewEntry[] = [
    {
      section: 'admins',
      kind: 'create',
      action: 'audit.a.adminCreated',
      target: 'Dilshod Karimov',
    },
    {
      section: 'roles',
      kind: 'update',
      action: 'audit.a.roleSaved',
      target: 'Operator',
      changes: [{ field: 'audit.f.access', from: 'Koʻrish', to: 'Koʻrish, Tahrirlash' }],
    },
    { section: 'merchants', kind: 'create', action: 'audit.a.merchantCreated', ...merchant() },
    {
      section: 'merchants',
      kind: 'delete',
      action: 'audit.a.merchantPaused',
      ...merchant(),
      changes: [{ field: 'audit.f.status', from: 'Faol', to: 'Toʻxtatilgan' }],
    },
    {
      section: 'documents',
      kind: 'update',
      action: 'audit.a.documentUploaded',
      target: 'Ommaviy oferta (UZ)',
    },
    { section: 'brands', kind: 'delete', action: 'audit.a.brandDeleted', target: 'Vivo' },
  ]
  rare.forEach((entry, i) =>
    entries.push({
      ...entry,
      id: `log-r${i}`,
      at: new Date(now - (i * 4 + 2) * 86_400_000 - 3_600_000 * 5),
      admin: owner,
      ip: '84.54.70.12',
    }),
  )
  return entries.sort((a, b) => b.at.getTime() - a.at.getTime())
}

auditStore.replaceAll(seed())
