import { apiGet, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { MerchantRole } from './merchantRoles'

type ApiRoles = { roles: { id: MerchantRole['id']; permissions: MerchantRole['permissions'] }[] }

/** The two fixed roles (admin, seller) with what each may do in the merchant app. */
export const merchantRolesStore = createRemoteStore<MerchantRole>(async () => {
  const data = await apiGet<ApiRoles>('/admin/merchant-roles')
  return data.roles.map((role) => ({ id: role.id, permissions: role.permissions }))
})

/** Both roles go in one request: the backend replaces them together. */
export async function saveMerchantRoles(roles: MerchantRole[]) {
  await apiPut('/admin/merchant-roles', { roles })
  await merchantRolesStore.reload()
}
