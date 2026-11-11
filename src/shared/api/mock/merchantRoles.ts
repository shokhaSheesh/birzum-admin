import { logMock } from './audit'
import { mockRoutes } from './index'
import { ACTOR, asBody, invalid, nowIso, text, type Text } from './util'

const GROUPS: { key: string; label: Text; permissions: { key: string; label: Text }[] }[] = [
  {
    key: 'sales',
    label: text('Savdo', 'Продажи'),
    permissions: [
      {
        key: 'clients',
        label: text('Klientlarni qoʻshish va tahrirlash', 'Добавлять и редактировать клиентов'),
      },
      { key: 'approve', label: text('Arizalarni tasdiqlash', 'Подтверждать заявки') },
      { key: 'status', label: text('Buyurtma holatini oʻzgartirish', 'Менять статус заказа') },
    ],
  },
  {
    key: 'catalog',
    label: text('Katalog', 'Каталог'),
    permissions: [
      { key: 'products', label: text('Mahsulotlarni boshqarish', 'Управлять товарами') },
      { key: 'inventory', label: text('Ombor qoldigʻi', 'Остатки на складе') },
    ],
  },
  {
    key: 'shop',
    label: text('Doʻkon', 'Магазин'),
    permissions: [
      { key: 'locations', label: text('Filiallarni boshqarish', 'Управлять филиалами') },
      { key: 'staff', label: text('Xodimlarni boshqarish', 'Управлять сотрудниками') },
    ],
  },
  {
    key: 'reports',
    label: text('Hisobotlar', 'Отчёты'),
    permissions: [{ key: 'analytics', label: text('Tahlil va hisobotlar', 'Аналитика и отчёты') }],
  },
]
const KEYS = GROUPS.flatMap((g) => g.permissions.map((p) => p.key))

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
    permissions: ['clients', 'approve', 'status', 'inventory'],
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
