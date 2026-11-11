import { logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { admins } from './admins'
import { ago, asBody, invalid, newId, notFound, nowIso } from './util'

type Op = 'read' | 'create' | 'update' | 'delete'
type Brand = 'birzum' | 'fortuna' | 'vodiy'

export type SampleRole = {
  id: string
  name: string
  description: string
  brands: Brand[]
  access: Record<string, Op[]>
  actions: string[]
  is_system: boolean
  created_at: string
  updated_at: string
}

const ALL: Op[] = ['read', 'create', 'update', 'delete']

/** Every page a role can open and the operations that page offers (copy of the panel's table). */
const BIRZUM_PAGES: Record<string, Op[]> = {
  dashboard: ['read'],
  analytics: ['read'],
  applications: ['read'],
  customers: ['read', 'update'],
  collections: ['read', 'create', 'update'],
  merchants: ['read', 'update'],
  reviews: ['read', 'update', 'delete'],
  merchantRoles: ['read', 'update'],
  products: ['read', 'update'],
  categories: ALL,
  brands: ALL,
  pricing: ['read'],
  support: ['read', 'update'],
  quickReplies: ALL,
  broadcasts: ALL,
  faq: ALL,
  onboarding: ALL,
  documents: ['read', 'update'],
  admins: ALL,
  roles: ALL,
  audit: ['read'],
  integrations: ALL,
}
const LOAN_PAGES: Record<string, Op[]> = {
  mlDashboard: ['read'],
  mlApplications: ['read', 'update'],
  mlLoans: ['read'],
  mlPayments: ['read', 'create'],
  mlOverdue: ['read', 'update'],
  mlClients: ['read', 'update'],
  mlProducts: ALL,
  mlPayDay: ['read', 'update'],
  mlSupport: ['read', 'update'],
  mlReplies: ALL,
  mlBroadcasts: ALL,
  mlFaq: ALL,
  mlOnboarding: ALL,
  mlDocuments: ['read', 'update'],
  mlContacts: ALL,
}
const PAGES = { ...BIRZUM_PAGES, ...LOAN_PAGES }
const ALL_ACTIONS = [
  'chargeCard',
  'blockClient',
  'sendBroadcast',
  'mlBlockClient',
  'mlSendBroadcast',
  'mlPauseIntake',
]

/** Full rights on `manage` pages, read-only on `view` ones. */
const grant = (manage: string[], view: string[] = []) =>
  Object.fromEntries([
    ...view.map((key) => [key, ['read']]),
    ...manage.map((key) => [key, [...PAGES[key]]]),
  ]) as Record<string, Op[]>

const role = (
  id: string,
  name: string,
  description: string,
  brands: Brand[],
  access: Record<string, Op[]>,
  actions: string[] = [],
  isSystem = false,
): SampleRole => ({
  id,
  name,
  description,
  brands,
  access,
  actions,
  is_system: isSystem,
  created_at: ago(60),
  updated_at: ago(30),
})

export const roles: SampleRole[] = [
  role(
    'owner',
    'Bosh admin',
    'Hamma narsa, rollar va adminlar ham.',
    ['birzum', 'fortuna', 'vodiy'],
    grant(Object.keys(PAGES)),
    ALL_ACTIONS,
    true,
  ),
  role(
    'finance',
    'Moliya',
    'Klientlardan tushum va toʻlovlar.',
    ['birzum'],
    grant(['collections'], ['dashboard', 'applications', 'customers', 'merchants', 'pricing']),
    ['chargeCard'],
  ),
  role(
    'collections',
    'Undiruvchi',
    'Qarzdorlar bilan ishlash: qoʻngʻiroq, eslatma, kartadan yechish.',
    ['birzum'],
    grant(['collections'], ['applications', 'customers']),
    ['chargeCard'],
  ),
  role(
    'support',
    'Operator',
    'Yordam chatida klientlarga javob beradi.',
    ['birzum', 'fortuna', 'vodiy'],
    grant(
      ['support', 'quickReplies', 'mlSupport', 'mlReplies'],
      ['applications', 'customers', 'products', 'faq', 'mlApplications', 'mlLoans', 'mlFaq'],
    ),
  ),
  role(
    'content',
    'Kontent menejer',
    'Katalog, xabarnomalar, savol-javoblar, sharhlar.',
    ['birzum'],
    grant(
      ['categories', 'brands', 'broadcasts', 'faq', 'reviews', 'quickReplies'],
      ['dashboard', 'products', 'merchants', 'documents'],
    ),
    ['sendBroadcast'],
  ),
  role(
    'credit',
    'Kredit mutaxassisi',
    'Arizalarni koʻrib chiqadi, qarzlar va mijozlarni koʻradi.',
    ['fortuna', 'vodiy'],
    grant(['mlApplications'], ['mlDashboard', 'mlLoans', 'mlPayments', 'mlClients', 'mlProducts']),
  ),
  role(
    'loanCollector',
    'Mikroqarz undiruvchisi',
    'Kechikkanlar bilan ishlaydi: qoʻngʻiroq, vaʼda, eslatma.',
    ['fortuna', 'vodiy'],
    grant(['mlOverdue'], ['mlLoans', 'mlPayments', 'mlClients']),
  ),
  role(
    'loanManager',
    'Filial rahbari',
    'Brendning hamma sahifasi: qoidalar, mahsulotlar, xabarnomalar.',
    ['fortuna', 'vodiy'],
    grant(Object.keys(LOAN_PAGES)),
    ['mlBlockClient', 'mlSendBroadcast', 'mlPauseIntake'],
  ),
]

const holders = (id: string) =>
  admins.filter((admin) => admin.grants.some((grant) => grant.role_id === id)).length

const view = (item: SampleRole) => ({ ...item, holders_count: holders(item.id) })

function read(body: unknown, current?: SampleRole) {
  const input = asBody(body)
  const name = String(input.name ?? '').trim()
  if (!name || name.length > 120) throw invalid({ name: 'invalid_role_name' })
  if (!Array.isArray(input.brands) || input.brands.length === 0) {
    throw invalid({ brands: 'invalid_brands' })
  }
  if (roles.some((r) => r.id !== current?.id && r.name.toLowerCase() === name.toLowerCase())) {
    throw mockError(409, 'role_name_taken', 'Role name is taken')
  }
  for (const brand of current?.brands ?? []) {
    if (
      !input.brands.includes(brand) &&
      admins.some((a) =>
        a.grants.some((g) => g.role_id === current?.id && g.company_code === brand),
      )
    ) {
      throw mockError(409, 'role_brand_in_use', 'A holder works in that business')
    }
  }
  return {
    name,
    description: String(input.description ?? '').trim(),
    brands: input.brands as Brand[],
    access: (input.access ?? {}) as Record<string, Op[]>,
    actions: (input.actions ?? []) as string[],
  }
}

const find = (id: string) => {
  const found = roles.find((r) => r.id === id)
  if (!found) throw notFound()
  return found
}

const editable = (item: SampleRole) => {
  if (item.is_system) throw mockError(403, 'role_system', 'The owners role cannot be changed')
  return item
}

mockRoutes(
  {
    method: 'GET',
    match: '/admin/roles',
    handle({ query }) {
      const items = roles.filter(
        (r) =>
          !query.scope ||
          r.brands.some((b) => (query.scope === 'birzum' ? b === 'birzum' : b !== 'birzum')),
      )
      return { items: items.map(view), total: items.length }
    },
  },
  { method: 'GET', match: '/admin/roles/:id', handle: ({ params }) => view(find(params.id)) },
  {
    method: 'POST',
    match: '/admin/roles',
    handle({ body }) {
      const input = read(body)
      const created: SampleRole = {
        ...input,
        id: newId(),
        is_system: false,
        created_at: nowIso(),
        updated_at: nowIso(),
      }
      roles.push(created)
      logMock({
        section: 'roles',
        kind: 'access',
        action: 'roleCreated',
        target: created.name,
        entity: 'role',
        entityId: created.id,
      })
      return view(created)
    },
  },
  {
    method: 'PUT',
    match: '/admin/roles/:id',
    handle({ params, body }) {
      const current = editable(find(params.id))
      const before = JSON.stringify(current.access)
      Object.assign(current, read(body, current), { updated_at: nowIso() })
      logMock({
        section: 'roles',
        kind: 'access',
        action: 'roleSaved',
        target: current.name,
        entity: 'role',
        entityId: current.id,
        changes:
          before === JSON.stringify(current.access)
            ? []
            : [{ field: 'access', from: '', to: Object.keys(current.access).join(', ') }],
      })
      return view(current)
    },
  },
  {
    method: 'DELETE',
    match: '/admin/roles/:id',
    handle({ params }) {
      const current = editable(find(params.id))
      if (holders(current.id) > 0) throw mockError(409, 'role_in_use', 'Admins hold this role')
      roles.splice(roles.indexOf(current), 1)
      logMock({
        section: 'roles',
        kind: 'delete',
        action: 'roleDeleted',
        target: current.name,
        entity: 'role',
        entityId: current.id,
      })
      return {}
    },
  },
)
