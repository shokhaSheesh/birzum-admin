import type { LocalizedText } from '@/shared/i18n/dictionaries'

/**
 * A product category, or a subcategory of one (one level deep). Only the admin creates them;
 * merchants pick one for each product: a subcategory when the category has any. The list
 * order is the order shoppers see in the client app.
 */
export type Category = {
  id: string
  /** Set on a subcategory: the category it belongs to. */
  parentId?: string
  name: LocalizedText
  /** Square picture on the client app's home screen. */
  image?: string
  /** Hidden: shoppers do not see it and merchants cannot pick it for new products. */
  visible: boolean
  /**
   * Products filed directly under it across all merchants. A category with subcategories has
   * none of its own; see `productsIn`. The backend counts them (`products_count`).
   */
  products: number
}

/** Top-level categories, in order. */
export const rootsOf = (all: Category[]) => all.filter((category) => !category.parentId)

/** A category's subcategories, in order. */
export const childrenOf = (all: Category[], id: string) =>
  all.filter((category) => category.parentId === id)

/** Products in a category, its subcategories included. */
export const productsIn = (all: Category[], category: Category) =>
  category.products + childrenOf(all, category.id).reduce((sum, child) => sum + child.products, 0)

/** "Maishiy texnika › Muzlatgichlar", or just the name for a top-level category. */
export const categoryPath = (all: Category[], id: string, name: (c: Category) => string) => {
  const category = all.find((item) => item.id === id)
  if (!category) return ''
  const parent = all.find((item) => item.id === category.parentId)
  return parent ? `${name(parent)} › ${name(category)}` : name(category)
}
