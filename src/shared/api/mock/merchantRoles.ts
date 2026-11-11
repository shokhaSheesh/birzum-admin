import { logMock } from './audit'
import { mockRoutes } from './index'
import { ACTOR, asBody, invalid, nowIso, text, type Text } from './util'

const ALL = ['read', 'create', 'update', 'delete']
const page = (key: string, uz: string, ru: string, ops: string[]) => ({
  key,
  label: text(uz, ru),
  ops,
})

// The merchant app's pages and what each offers, as GET /admin/merchant-roles returns them
const GROUPS: {
  key: string
  label: Text
  permissions: { key: string; label: Text; ops: string[] }[]
}[] = [
  {
    key: 'sales',
    label: text('Savdo', 'Продажи'),
    permissions: [
      page('clients', 'Klientlar', 'Клиенты', ['read', 'create', 'update']),
      page('applications', 'Arizalar', 'Заявки', ['read', 'create', 'update']),
      page('calculator', 'Kalkulyator', 'Калькулятор', ['read']),
    ],
  },
  {
    key: 'catalog',
    label: text('Katalog', 'Каталог'),
    permissions: [
      page('products', 'Mahsulotlar', 'Товары', ALL),
      page('attributes', 'Variant turlari', 'Типы вариантов', ALL),
      page('inventory', 'Ombor', 'Склад', ['read', 'update']),
    ],
  },
  {
    key: 'shop',
    label: text('Doʻkon', 'Магазин'),
    permissions: [
      page('locations', 'Filiallar', 'Филиалы', ALL),
      page('staff', 'Xodimlar', 'Сотрудники', ALL),
      page('reviews', 'Sharhlar', 'Отзывы', ['read', 'update']),
    ],
  },
  {
    key: 'reports',
    label: text('Hisobotlar', 'Отчёты'),
    permissions: [page('analytics', 'Hisobotlar', 'Отчёты', ['read'])],
  },
]
const KEYS = GROUPS.flatMap((g) =>
  g.permissions.flatMap((p) => p.ops.map((op) => `${p.key}.${op}`)),
)

type Role = {
  id: 'admin' | 'seller'
  permissions: string[]
  updated_by: string
  updated_at: string
}

const roles: Role[] = [
  { id: 'admin', permissions: [...KEYS], updated_by: '', updated_at: '' },
  {
    id: 'seller',
    permissions: [
      'clients.read',
      'clients.create',
      'clients.update',
      'applications.read',
      'applications.create',
      'applications.update',
      'calculator.read',
      'inventory.read',
      'inventory.update',
    ],
    updated_by: '',
    updated_at: '',
  },
]

const body = () => ({ roles, groups: GROUPS })

mockRoutes(
  { method: 'GET', match: '/admin/merchant-roles', handle: body },
  {
    method: 'PUT',
    match: '/admin/merchant-roles',
    handle(req) {
      const input = (asBody(req.body).roles ?? []) as { id: string; permissions: string[] }[]
      const ids = input
        .map((r) => r.id)
        .sort()
        .join()
      if (ids !== 'admin,seller') throw invalid({ roles: 'must be admin and seller, once each' })
      for (const sent of input) {
        if (sent.permissions.some((key) => !KEYS.includes(key)))
          throw invalid({ permissions: 'unknown key' })
        if (sent.permissions.some((key) => !sent.permissions.includes(`${key.split('.')[0]}.read`)))
          throw invalid({ permissions: 'a write needs read' })
        const role = roles.find((r) => r.id === sent.id)!
        const next = KEYS.filter((key) => sent.permissions.includes(key))
        const added = next.filter((k) => !role.permissions.includes(k))
        const removed = role.permissions.filter((k) => !next.includes(k))
        if (added.length === 0 && removed.length === 0) continue
        role.permissions = next
        role.updated_by = ACTOR.id
        role.updated_at = nowIso()
        logMock({
          section: 'merchantRoles',
          kind: 'access',
          action: 'merchantRolesSaved',
          target: `${role.id}: ${[...added.map((k) => `+${k}`), ...removed.map((k) => `-${k}`)].join(' ')}`,
          entity: 'merchant_role',
          entityId: role.id,
        })
      }
      return body()
    },
  },
)
