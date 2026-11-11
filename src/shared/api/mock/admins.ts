import { logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { roles } from './roles'
import { ago, asBody, invalid, matches, newId, notFound, nowIso, paged } from './util'

type Grant = { company_code: string; role_id: string }

export type SampleAdmin = {
  id: string
  first_name: string
  last_name: string
  login: string
  email: string
  phone: string
  status: 'active' | 'blocked'
  grants: Grant[]
  created_at: string
  last_login_at: string
}

const admin = (
  id: string,
  name: string,
  login: string,
  phone: string,
  grants: Grant[],
  daysAgo: number,
  seenHoursAgo: number | null,
  status: SampleAdmin['status'] = 'active',
): SampleAdmin => {
  const [first, ...rest] = name.split(' ')
  return {
    id,
    first_name: first,
    last_name: rest.join(' '),
    login,
    email: `${login}@birzum.uz`,
    phone: `+998${phone}`,
    status,
    grants,
    created_at: ago(daysAgo),
    last_login_at: seenHoursAgo === null ? '' : ago(0, seenHoursAgo),
  }
}

const all = (role_id: string): Grant[] =>
  ['birzum', 'fortuna', 'vodiy'].map((company_code) => ({ company_code, role_id }))
const one = (company_code: string, role_id: string): Grant[] => [{ company_code, role_id }]
const loans = (role_id: string): Grant[] => [
  { company_code: 'fortuna', role_id },
  { company_code: 'vodiy', role_id },
]

export const admins: SampleAdmin[] = [
  admin('a1', 'Sardor Saidov', 'admin', '901112233', all('owner'), 120, 1),
  admin('a2', 'Malika Rasulova', 'malika.r', '935554411', one('birzum', 'finance'), 110, 3),
  admin('a3', 'Sardor Nematov', 'sardor.n', '977003322', all('support'), 95, 20),
  admin('a4', 'Dilshod Karimov', 'dilshod.k', '909990011', one('birzum', 'collections'), 70, 44),
  admin('a5', 'Nodira Aliyeva', 'nodira.a', '933217788', one('birzum', 'content'), 60, 70),
  admin('a6', 'Bobur Tursunov', 'bobur.t', '946541230', one('fortuna', 'support'), 15, null),
  admin(
    'a7',
    'Jamshid Olimov',
    'jamshid.o',
    '901237654',
    one('birzum', 'collections'),
    90,
    300,
    'blocked',
  ),
  admin('a8', 'Gulnoza Ergasheva', 'gulnoza.e', '915553040', loans('credit'), 40, 5),
  admin('a9', 'Azizbek Qodirov', 'azizbek.q', '998887766', one('vodiy', 'loanManager'), 35, 26),
  admin('a10', 'Shahzod Yoqubov', 'shahzod.y', '935001020', loans('loanCollector'), 30, 2),
]

const isOwner = (item: SampleAdmin) =>
  item.grants.some((grant) => roles.find((r) => r.id === grant.role_id)?.is_system)

const view = (item: SampleAdmin) => ({
  ...item,
  grants: item.grants.map((grant) => ({
    ...grant,
    role_name: roles.find((r) => r.id === grant.role_id)?.name ?? '',
  })),
  is_owner: isOwner(item),
})

const find = (id: string) => {
  const found = admins.find((a) => a.id === id)
  if (!found) throw notFound()
  return found
}

const taken = (field: 'login' | 'phone' | 'email', value: string, self?: string) =>
  admins.some((a) => a.id !== self && a[field].toLowerCase() === value.toLowerCase())

function read(body: unknown, current?: SampleAdmin) {
  const input = asBody(body)
  const first = String(input.first_name ?? '').trim()
  const login = String(input.login ?? '').trim()
  const email = String(input.email ?? '').trim()
  const phone = String(input.phone ?? '').trim()
  const password = String(input.password ?? '')
  if (!first) throw invalid({ first_name: 'is required' })
  if (!login || /\s/.test(login)) throw invalid({ login: 'is invalid' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw invalid({ email: 'is invalid' })
  if (!/^\+998\d{9}$/.test(phone)) throw invalid({ phone: 'is invalid' })
  if (!current && !password) throw invalid({ password: 'is required' })
  if (password && (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password))) {
    throw mockError(400, 'weak_password', 'The password is too weak')
  }
  if (taken('login', login, current?.id)) throw mockError(409, 'login_taken', 'Login is taken')
  if (taken('phone', phone, current?.id)) throw mockError(409, 'phone_taken', 'Phone is taken')
  if (taken('email', email, current?.id)) throw mockError(409, 'email_taken', 'Email is taken')
  const grants = (Array.isArray(input.grants) ? input.grants : []) as Grant[]
  if (grants.length === 0 || grants.some((g) => !roles.some((r) => r.id === g.role_id))) {
    throw invalid({ grants: 'is invalid' })
  }
  return {
    first_name: first,
    last_name: String(input.last_name ?? '').trim(),
    login,
    email,
    phone,
    grants: grants.map(({ company_code, role_id }) => ({ company_code, role_id })),
    status: input.status === 'blocked' ? ('blocked' as const) : ('active' as const),
  }
}

const nameOf = (item: SampleAdmin) => `${item.first_name} ${item.last_name}`.trim()

/** Blocking, deleting or demoting the last active owner is refused, as the backend does. */
function keepAnOwner(current: SampleAdmin, next?: Pick<SampleAdmin, 'grants' | 'status'>) {
  const stays = next && next.status === 'active' && isOwner({ ...current, grants: next.grants })
  const others = admins.some((a) => a.id !== current.id && a.status === 'active' && isOwner(a))
  if (isOwner(current) && current.status === 'active' && !stays && !others) {
    throw mockError(409, 'last_owner', 'The last active owner cannot be changed')
  }
}

mockRoutes(
  {
    method: 'GET',
    match: '/admin/admins',
    handle({ query }) {
      const base = admins.filter(
        (a) =>
          matches(query.q, nameOf(a), a.login, a.phone) &&
          (!query.role_id || a.grants.some((g) => g.role_id === query.role_id)) &&
          (!query.company || a.grants.some((g) => g.company_code === query.company)),
      )
      const rows = base
        .filter((a) => !query.status || a.status === query.status)
        .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
      return {
        ...paged(rows.map(view), query),
        counts: {
          active: base.filter((a) => a.status === 'active').length,
          blocked: base.filter((a) => a.status === 'blocked').length,
        },
      }
    },
  },
  { method: 'GET', match: '/admin/admins/:id', handle: ({ params }) => view(find(params.id)) },
  {
    method: 'POST',
    match: '/admin/admins',
    handle({ body }) {
      const created: SampleAdmin = {
        ...read(body),
        id: newId(),
        created_at: nowIso(),
        last_login_at: '',
      }
      admins.push(created)
      logMock({
        section: 'admins',
        kind: 'access',
        action: 'adminCreated',
        target: nameOf(created),
        entity: 'admin',
        entityId: created.id,
      })
      return view(created)
    },
  },
  {
    method: 'PUT',
    match: '/admin/admins/:id',
    handle({ params, body }) {
      const current = find(params.id)
      const next = read(body, current)
      keepAnOwner(current, next)
      const changes =
        current.status === next.status
          ? []
          : [{ field: 'status', from: current.status, to: next.status }]
      Object.assign(current, next)
      logMock({
        section: 'admins',
        kind: 'access',
        action: 'adminSaved',
        target: nameOf(current),
        entity: 'admin',
        entityId: current.id,
        changes,
      })
      return view(current)
    },
  },
  {
    method: 'DELETE',
    match: '/admin/admins/:id',
    handle({ params }) {
      const current = find(params.id)
      keepAnOwner(current)
      admins.splice(admins.indexOf(current), 1)
      logMock({
        section: 'admins',
        kind: 'delete',
        action: 'adminDeleted',
        target: nameOf(current),
        entity: 'admin',
        entityId: current.id,
      })
      return {}
    },
  },
)
