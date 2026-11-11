import { mockRoutes } from './index'
import { ACTOR, ago, matches, nowIso, paged } from './util'

type Change = { field: string; from: string; to: string }

type Entry = {
  id: string
  created_at: string
  staff_id: string
  staff_name: string
  company_code: string
  section: string
  kind: 'create' | 'update' | 'delete' | 'money' | 'access'
  action: string
  params: Record<string, unknown>
  target: string
  entity: string
  entity_id: string
  changes: Change[]
  ip: string
}

const IP = '84.54.70.12'
const person = (id: string, name: string) => ({ id, name })
const SARDOR = person('a1', 'Sardor Saidov')
const MALIKA = person('a2', 'Malika Rasulova')
const NODIRA = person('a5', 'Nodira Aliyeva')

const seed = (
  hoursAgo: number,
  who: { id: string; name: string },
  section: string,
  kind: Entry['kind'],
  action: string,
  target: string,
  entity: string,
  changes: Change[] = [],
  company = 'birzum',
): Entry => ({
  id: '',
  created_at: ago(0, hoursAgo),
  staff_id: who.id,
  staff_name: who.name,
  company_code: company,
  section,
  kind,
  action,
  params: {},
  target,
  entity,
  entity_id: '',
  changes,
  ip: IP,
})

// Newest first, like the real log
const entries: Entry[] = [
  seed(2, SARDOR, 'admins', 'update', 'adminSaved', 'Jamshid Olimov', 'admin', [
    { field: 'status', from: 'active', to: 'blocked' },
  ]),
  seed(5, MALIKA, 'products', 'update', 'productApproved', 'Samsung Galaxy S25', 'product'),
  seed(9, NODIRA, 'categories', 'create', 'categoryCreated', 'Aksessuarlar', 'category'),
  seed(26, NODIRA, 'faq', 'update', 'faqSaved', 'Limit qanday hisoblanadi?', 'faq'),
  seed(30, SARDOR, 'roles', 'access', 'roleSaved', 'Operator', 'role', [
    { field: 'access.support', from: 'read', to: 'read, update' },
  ]),
  seed(51, MALIKA, 'reviews', 'update', 'reviewHidden', 'Sharh: Mediapark', 'review'),
  seed(72, SARDOR, 'brands', 'create', 'brandCreated', 'TCL', 'brand'),
  seed(96, NODIRA, 'onboarding', 'update', 'slideShown', 'Limitingizni biling', 'slide'),
  seed(
    130,
    SARDOR,
    'mlOnboarding',
    'create',
    'bannerCreated',
    'Rivoj: 50 mln soʻmgacha',
    'banner',
    [],
    'fortuna',
  ),
].map((entry, i) => ({ ...entry, id: String(1000 - i) }))
entries.forEach((entry) => {
  if (entry.section === 'mlOnboarding') entry.params = { brand: 'Fortuna Biznes' }
})

let counter = 2000

/** Adds a line to the sample activity log; the real backend writes it on every change. */
export function logMock(entry: {
  section: string
  kind: Entry['kind']
  action: string
  target?: string
  entity?: string
  entityId?: string
  changes?: Change[]
  company?: string
  params?: Record<string, unknown>
}) {
  entries.unshift({
    id: String(counter++),
    created_at: nowIso(),
    staff_id: ACTOR.id,
    staff_name: ACTOR.name,
    company_code: entry.company ?? 'birzum',
    section: entry.section,
    kind: entry.kind,
    action: entry.action,
    params: entry.params ?? {},
    target: entry.target ?? '',
    entity: entry.entity ?? '',
    entity_id: entry.entityId ?? '',
    changes: entry.changes ?? [],
    ip: IP,
  })
}

export const BRAND_NAME: Record<string, string> = {
  fortuna: 'Fortuna Biznes',
  vodiy: 'Vodiy Taraqqiyot',
}

mockRoutes({
  method: 'GET',
  match: '/admin/audit',
  handle({ query }) {
    const from = query.from ? Date.parse(query.from) : -Infinity
    const to = query.to ? Date.parse(query.to) : Infinity
    const rows = entries.filter((entry) => {
      const at = Date.parse(entry.created_at)
      return (
        at >= from &&
        at < to &&
        (!query.staff_id || entry.staff_id === query.staff_id) &&
        (!query.section || entry.section === query.section) &&
        (!query.kind || entry.kind === query.kind) &&
        (!query.company || entry.company_code === query.company) &&
        matches(query.q, entry.staff_name, entry.target, entry.action)
      )
    })
    return paged(rows, query)
  },
})
