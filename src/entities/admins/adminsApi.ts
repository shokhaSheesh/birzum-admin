import { api, apiDelete, apiPost, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Workspace } from '@/shared/config/workspaces'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import type { AdminStatus, AdminUser } from './admins'

type ApiAdmin = {
  id: string
  first_name: string
  last_name: string
  login: string
  email: string
  phone: string
  status: AdminStatus
  grants: { company_code: Workspace; role_id: string; role_name: string }[]
  is_owner: boolean
  created_at: string
  last_login_at: string
}

const toAdmin = (raw: ApiAdmin): AdminUser => ({
  id: raw.id,
  name: `${raw.first_name} ${raw.last_name}`.trim(),
  login: raw.login,
  email: raw.email,
  phone: raw.phone.replace(/^\+998/, ''),
  grants: raw.grants.map((grant) => ({ workspace: grant.company_code, roleId: grant.role_id })),
  status: raw.status,
  isOwner: raw.is_owner,
  createdAt: new Date(raw.created_at),
  lastSeenAt: raw.last_login_at ? new Date(raw.last_login_at) : undefined,
})

type Page = {
  items: ApiAdmin[]
  total: number
  page: number
  limit: number
  counts: { active: number; blocked: number }
}

/** One page of `GET /admin/admins` (limit 1..100). */
export async function loadAdmins(query: { page?: number; limit?: number; q?: string } = {}) {
  const data = await api<Page>('GET', '/admin/admins', { query })
  return { ...data, items: data.items.map(toAdmin) }
}

/** The list has a few dozen people: read every page, and filter on the screen as before. */
export const adminsStore = createRemoteStore<AdminUser>(async () => {
  const all: AdminUser[] = []
  for (let page = 1; ; page++) {
    const data = await loadAdmins({ page, limit: 100 })
    all.push(...data.items)
    if (all.length >= data.total || data.items.length === 0) return all
  }
})

type AdminInput = {
  name: string
  login: string
  email: string
  phone: string
  grants: AdminUser['grants']
  status: AdminStatus
  /** Required for a new admin; empty keeps the old one. */
  password: string
}

const bodyOf = (input: AdminInput) => {
  const [first, ...rest] = input.name.trim().split(/\s+/)
  return {
    first_name: first,
    last_name: rest.join(' '),
    login: input.login,
    email: input.email,
    phone: input.phone.length === PHONE_DIGITS ? `+998${input.phone}` : input.phone,
    password: input.password,
    grants: input.grants.map((grant) => ({ company_code: grant.workspace, role_id: grant.roleId })),
    status: input.status,
  }
}

export async function createAdmin(input: AdminInput) {
  await apiPost('/admin/admins', bodyOf(input))
  await adminsStore.reload()
}

export async function updateAdmin(id: string, input: AdminInput) {
  await apiPut(`/admin/admins/${id}`, bodyOf(input))
  await adminsStore.reload()
}

export async function deleteAdmin(id: string) {
  await apiDelete(`/admin/admins/${id}`)
  await adminsStore.reload()
}
