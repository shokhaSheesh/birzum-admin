/**
 * A brand. Only the admin creates them; merchants pick one for each product. A brand's name is
 * the same in every language.
 */
export type Brand = {
  id: string
  name: string
  logo?: string
  /** Products of this brand across all merchants (`products_count`). */
  products: number
}

/** "Samsung" -> "SA", for a brand without a logo. */
export const brandInitials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}]/gu, '')
    .slice(0, 2)
    .toUpperCase()
