import { createStore } from '@/shared/lib/createStore'

/**
 * A brand. Only the admin creates them; merchants pick one for each product. A brand's name is
 * the same in every language.
 */
export type Brand = {
  id: string
  name: string
  logo?: string
  /** Products of this brand across all merchants. The backend counts them. Sample values. */
  products: number
}

// The brands the merchant app offers today. Replace with the API.
export const brandsStore = createStore<Brand>([
  { id: 'apple', name: 'Apple', products: 64 },
  { id: 'artel', name: 'Artel', products: 38 },
  { id: 'hp', name: 'HP', products: 12 },
  { id: 'huawei', name: 'Huawei', products: 9 },
  { id: 'lenovo', name: 'Lenovo', products: 17 },
  { id: 'lg', name: 'LG', products: 26 },
  { id: 'samsung', name: 'Samsung', products: 71 },
  { id: 'xiaomi', name: 'Xiaomi', products: 33 },
  { id: 'tcl', name: 'TCL', products: 0 },
])

/** "Samsung" -> "SA", for a brand without a logo. */
export const brandInitials = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}]/gu, '')
    .slice(0, 2)
    .toUpperCase()
