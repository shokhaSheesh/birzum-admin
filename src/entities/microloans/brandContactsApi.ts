import { apiGet, apiPut } from '@/shared/api/client'
import { appResource } from '@/shared/api/appResource'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import type { Branch, BrandContacts, Region } from './brandContacts'

type ApiContacts = {
  app: Brand
  phones: string[]
  email: string
  website: string
  telegram: string
  instagram: string
  address: LocalizedText
  hours: LocalizedText
}

const contactStores = new Map<Brand, ReturnType<typeof createRemoteStore<BrandContacts>>>()

/** A brand's contacts: one record, kept as a list of one so pages read it like the others. */
export function brandContactsStoreOf(brand: Brand) {
  let store = contactStores.get(brand)
  if (!store) {
    store = createRemoteStore<BrandContacts>(async () => {
      const raw = await apiGet<ApiContacts>(`/admin/apps/${brand}/contacts`)
      return [
        {
          id: raw.app,
          phones: raw.phones,
          email: raw.email,
          website: raw.website,
          telegram: raw.telegram || undefined,
          instagram: raw.instagram || undefined,
          address: raw.address,
          hours: raw.hours,
        },
      ]
    })
    contactStores.set(brand, store)
  }
  return store
}

export async function saveBrandContacts(brand: Brand, input: Omit<BrandContacts, 'id'>) {
  await apiPut(`/admin/apps/${brand}/contacts`, {
    phones: input.phones,
    email: input.email,
    website: input.website,
    telegram: input.telegram ?? '',
    instagram: input.instagram ?? '',
    address: input.address,
    hours: input.hours,
  })
  await brandContactsStoreOf(brand).reload()
}

type ApiBranch = {
  id: string
  app: Brand
  region: Region
  address: string
  phone: string
  location: { lat: number; lng: number } | null
  schedule: Branch['schedule']
}
type BranchInput = Pick<Branch, 'region' | 'address' | 'phone' | 'location' | 'schedule'>

/** Branches have no order or show/hide calls: create, replace and delete only. */
export const branchesApi = appResource<Branch, ApiBranch, BranchInput>('branches', {
  fromApi: (raw) => ({
    id: raw.id,
    brand: raw.app,
    region: raw.region,
    address: raw.address,
    phone: raw.phone || undefined,
    location: raw.location ?? undefined,
    schedule: raw.schedule ?? [],
  }),
  // A PUT replaces the whole record: a pin or schedule left out would be erased
  toApi: (input) => ({
    region: input.region,
    address: input.address,
    phone: input.phone ?? '',
    location: input.location ?? null,
    schedule: input.schedule,
  }),
})

export type GeoSuggestion = {
  title: string
  subtitle: string
  address: string
  uri: string
  distance_m?: number
}

export const suggestAddress = (text: string) =>
  apiGet<{ items: GeoSuggestion[] }>('/admin/geo/suggest', { text, limit: 7 })

export const resolveAddress = (uri: string) =>
  apiGet<{ location: { lat: number; lng: number }; name: string; address: string }>(
    '/admin/geo/resolve',
    { uri },
  )
