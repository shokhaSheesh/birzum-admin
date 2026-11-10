import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Workspace } from '@/shared/config/workspaces'
import type { Op, Role, SpecialAction } from './roles'

type ApiRole = {
  id: string
  name: string
  description: string
  brands: Workspace[]
  access: Record<string, Op[]>
  actions: SpecialAction[]
  is_system: boolean
  holders_count: number
}

const toRole = (raw: ApiRole): Role => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  brands: raw.brands,
  access: raw.access ?? {},
  actions: raw.actions ?? [],
  system: raw.is_system,
  holders: raw.holders_count,
})

export const rolesStore = createRemoteStore<Role>(async () => {
  const data = await apiGet<{ items: ApiRole[] }>('/admin/roles')
  return data.items.map(toRole)
})

/** A page with no operation left is not sent at all. */
const bodyOf = (role: Omit<Role, 'id'>) => ({
  name: role.name,
  description: role.description,
  brands: role.brands,
  access: Object.fromEntries(Object.entries(role.access).filter(([, ops]) => ops.length > 0)),
  actions: role.actions,
})

export async function createRole(role: Omit<Role, 'id'>) {
  await apiPost('/admin/roles', bodyOf(role))
  await rolesStore.reload()
}

export async function updateRole(id: string, role: Omit<Role, 'id'>) {
  await apiPut(`/admin/roles/${id}`, bodyOf(role))
  await rolesStore.reload()
}

export async function deleteRole(id: string) {
  await apiDelete(`/admin/roles/${id}`)
  await rolesStore.reload()
}
