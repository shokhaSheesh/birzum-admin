export const HIDE_REASONS = ['abuse', 'spam', 'personal', 'offTopic', 'other'] as const
export type HideReason = (typeof HIDE_REASONS)[number]

/**
 * `published`: on the shop and counted in its rating. `hidden`: an admin took it down, with a
 * reason. `removed`: the merchant deleted it in the merchant app; the admin still sees it and
 * can bring it back.
 */
export type ReviewStatus = 'published' | 'hidden' | 'removed'
export const REVIEW_STATUSES: ReviewStatus[] = ['published', 'hidden', 'removed']

/** What a shopper said about a shop after a purchase, from the client app. */
export type Review = {
  id: string
  merchantId: string
  merchantName: string
  author: string
  /** 1 to 5. */
  rating: number
  text: string
  productName: string
  at: Date
  status: ReviewStatus
  /** Who changed the status (the staff member's id), when and why. */
  moderation?: { at: Date; by: string; reason?: HideReason; comment?: string }
}
