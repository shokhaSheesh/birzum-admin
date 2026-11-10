import { apiGet, apiPut } from '@/shared/api/client'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import type { ModerationReason, ProductStatus } from './products'

/** A merchant's product as `GET /admin/products` returns it (prices in tiyin). */
export type ModProduct = {
  id: string
  merchantId: string
  merchantName: string
  name: LocalizedText
  /** Merchant-side slugs, e.g. `phones`, not the admin category ids. */
  category: string
  subcategory: string
  brand: string
  photo: string
  priceTiyin: number
  hasVariants: boolean
  stock: number
  visible: boolean
  status: ProductStatus
  moderation: {
    state: 'pending' | 'approved' | 'rejected'
    submittedAt: Date
    wasLive: boolean
    decidedAt?: Date
    /** The staff member's id, not a name. */
    by: string
    reason?: ModerationReason
    comment: string
  }
  createdAt: Date
}

export type ModProductDetail = ModProduct & {
  description: LocalizedText
  variants: {
    key: string
    label: LocalizedText
    priceTiyin: number
    stock: { locationId: string; locationName: string; count: number }[]
  }[]
  specs: { label: LocalizedText; value: LocalizedText }[]
  images: { uz: string[]; ru: string[] }
  updatedAt: Date
}

type ApiProduct = {
  id: string
  merchant_id: string
  merchant_name: string
  name: LocalizedText
  category: string
  subcategory: string
  brand: string
  photo: string
  price_tiyin: number
  has_variants: boolean
  stock: number
  visible: boolean
  status: ProductStatus
  moderation: {
    state: 'pending' | 'approved' | 'rejected'
    submitted_at: string
    was_live: boolean
    decided_at: string
    by: string
    reason: ModerationReason | ''
    comment: string
  }
  created_at: string
}

type ApiDetail = ApiProduct & {
  description: LocalizedText
  variants: {
    key: string
    label: LocalizedText
    price_tiyin: number
    stock: { location_id: string; location_name: string; count: number }[]
  }[]
  specs: ModProductDetail['specs']
  images: { uz: string[]; ru: string[] }
  updated_at: string
}

const toProduct = (raw: ApiProduct): ModProduct => ({
  id: raw.id,
  merchantId: raw.merchant_id,
  merchantName: raw.merchant_name,
  name: raw.name,
  category: raw.category,
  subcategory: raw.subcategory,
  brand: raw.brand,
  photo: raw.photo,
  priceTiyin: raw.price_tiyin,
  hasVariants: raw.has_variants,
  stock: raw.stock,
  visible: raw.visible,
  status: raw.status,
  moderation: {
    state: raw.moderation.state,
    submittedAt: new Date(raw.moderation.submitted_at),
    wasLive: raw.moderation.was_live,
    decidedAt: raw.moderation.decided_at ? new Date(raw.moderation.decided_at) : undefined,
    by: raw.moderation.by,
    reason: raw.moderation.reason || undefined,
    comment: raw.moderation.comment,
  },
  createdAt: new Date(raw.created_at),
})

const toDetail = (raw: ApiDetail): ModProductDetail => ({
  ...toProduct(raw),
  description: raw.description,
  variants: raw.variants.map((variant) => ({
    key: variant.key,
    label: variant.label,
    priceTiyin: variant.price_tiyin,
    stock: variant.stock.map((row) => ({
      locationId: row.location_id,
      locationName: row.location_name,
      count: row.count,
    })),
  })),
  specs: raw.specs ?? [],
  images: raw.images,
  updatedAt: new Date(raw.updated_at),
})

export type ProductCounts = {
  all: number
  review: number
  selling: number
  sold_out: number
  hidden: number
  rejected: number
}

export type ProductQuery = {
  status?: string
  q?: string
  merchantId?: string
  category?: string
  brand?: string
  page?: number
  limit?: number
}

export async function loadProducts(query: ProductQuery) {
  const data = await apiGet<{ items: ApiProduct[]; total: number; counts: ProductCounts }>(
    '/admin/products',
    {
      status: query.status === 'all' ? '' : query.status,
      q: query.q,
      merchant_id: query.merchantId,
      category: query.category,
      brand: query.brand,
      page: query.page,
      limit: query.limit,
    },
  )
  return { items: data.items.map(toProduct), total: data.total, counts: data.counts }
}

export async function loadProduct(id: string) {
  return toDetail(await apiGet<ApiDetail>(`/admin/products/${id}`))
}

export const approveProduct = (id: string) => apiPut(`/admin/products/${id}/approve`)

export const rejectProduct = (id: string, reason: ModerationReason, comment: string) =>
  apiPut(`/admin/products/${id}/reject`, { reason, comment })
