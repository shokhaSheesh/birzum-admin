import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Brand } from './brands'

type ApiBrand = { id: string; name: string; logo_url: string; products_count: number }

/** The server sends them A to Z. */
export const brandsStore = createRemoteStore<Brand>(async () => {
  const data = await apiGet<{ items: ApiBrand[] }>('/admin/brands')
  return data.items.map((raw) => ({
    id: raw.id,
    name: raw.name,
    logo: raw.logo_url || undefined,
    products: raw.products_count,
  }))
})

const bodyOf = (input: { name: string; logo?: string }) => ({
  name: input.name,
  logo_url: input.logo ?? '',
})

export async function createBrand(input: { name: string; logo?: string }) {
  await apiPost('/admin/brands', bodyOf(input))
  await brandsStore.reload()
}

export async function updateBrand(id: string, input: { name: string; logo?: string }) {
  await apiPut(`/admin/brands/${id}`, bodyOf(input))
  await brandsStore.reload()
}

export async function deleteBrand(id: string) {
  await apiDelete(`/admin/brands/${id}`)
  await brandsStore.reload()
}
