import { apiDelete, apiGet, apiPut } from '@/shared/api/client'
import { periodRange } from '@/entities/audit/auditApi'
import type { Period } from '@/shared/lib/period'
import type { HideReason, Review, ReviewStatus } from './reviews'

type ApiReview = {
  id: string
  merchant_id: string
  merchant_name: string
  author: string
  rating: number
  text: string
  product_name: string
  created_at: string
  status: ReviewStatus
  moderation: { at: string; by: string; reason: HideReason | ''; comment: string } | null
}

const toReview = (raw: ApiReview): Review => ({
  id: raw.id,
  merchantId: raw.merchant_id,
  merchantName: raw.merchant_name,
  author: raw.author,
  rating: raw.rating,
  text: raw.text,
  productName: raw.product_name,
  at: new Date(raw.created_at),
  status: raw.status,
  moderation: raw.moderation
    ? {
        at: new Date(raw.moderation.at),
        by: raw.moderation.by,
        reason: raw.moderation.reason || undefined,
        comment: raw.moderation.comment || undefined,
      }
    : undefined,
})

export type ReviewsPageData = {
  items: Review[]
  total: number
  counts: { all: number; published: number; negative: number; hidden: number; removed: number }
  average: number
  /** Published reviews with 5, 4, 3, 2 and 1 stars. */
  distribution: number[]
  merchants: {
    merchantId: string
    merchantName: string
    published: number
    average: number
    negative: number
    removed: number
  }[]
}

export async function loadReviews(filters: {
  period: Period
  status: string
  q: string
  merchantId: string
  rating: string
  page: number
  limit: number
}): Promise<ReviewsPageData> {
  const data = await apiGet<
    Omit<ReviewsPageData, 'items' | 'merchants'> & {
      items: ApiReview[]
      merchants: {
        merchant_id: string
        merchant_name: string
        published: number
        average: number
        negative: number
        removed: number
      }[]
    }
  >('/admin/reviews', {
    ...periodRange(filters.period, false),
    status: filters.status === 'all' ? '' : filters.status,
    q: filters.q,
    merchant_id: filters.merchantId,
    rating: filters.rating,
    page: filters.page,
    limit: filters.limit,
  })
  return {
    items: data.items.map(toReview),
    total: data.total,
    counts: data.counts,
    average: data.average,
    distribution: data.distribution,
    merchants: data.merchants.map((m) => ({
      merchantId: m.merchant_id,
      merchantName: m.merchant_name,
      published: m.published,
      average: m.average,
      negative: m.negative,
      removed: m.removed,
    })),
  }
}

export const hideReview = (id: string, reason: HideReason, comment: string) =>
  apiPut(`/admin/reviews/${id}/hide`, { reason, comment })

export const restoreReview = (id: string) => apiPut(`/admin/reviews/${id}/restore`)

export const deleteReview = (id: string) => apiDelete(`/admin/reviews/${id}`)
