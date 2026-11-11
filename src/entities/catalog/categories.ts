import appliancesImage from '@/shared/assets/categories/appliances.jpg'
import laptopsImage from '@/shared/assets/categories/laptops.jpg'
import phonesImage from '@/shared/assets/categories/phones.jpg'
import tvsImage from '@/shared/assets/categories/tvs.jpg'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

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
   * none of its own; see `productsIn`. The backend counts them. Sample values.
   */
  products: number
}

const text = (uz: string, ru: string): LocalizedText => ({ uz, ru })

// The categories the apps use today, plus two invented ones. Replace with the API.
export const categoriesStore = createStore<Category>([
  {
    id: 'phones',
    name: text('Telefonlar', 'Телефоны'),
    image: phonesImage,
    visible: true,
    products: 0,
  },
  {
    id: 'smartphones',
    parentId: 'phones',
    name: text('Smartfonlar', 'Смартфоны'),
    image: phonesImage,
    visible: true,
    products: 88,
  },
  {
    id: 'feature-phones',
    parentId: 'phones',
    name: text('Tugmali telefonlar', 'Кнопочные телефоны'),
    visible: true,
    products: 8,
  },
  {
    id: 'tvs',
    name: text('Televizorlar', 'Телевизоры'),
    image: tvsImage,
    visible: true,
    products: 42,
  },
  {
    id: 'appliances',
    name: text('Maishiy texnika', 'Бытовая техника'),
    image: appliancesImage,
    visible: true,
    products: 0,
  },
  {
    id: 'washers',
    parentId: 'appliances',
    name: text('Kir yuvish mashinalari', 'Стиральные машины'),
    image: appliancesImage,
    visible: true,
    products: 34,
  },
  {
    id: 'fridges',
    parentId: 'appliances',
    name: text('Muzlatgichlar', 'Холодильники'),
    visible: true,
    products: 25,
  },
  {
    id: 'air-conditioners',
    parentId: 'appliances',
    name: text('Konditsionerlar', 'Кондиционеры'),
    visible: true,
    products: 12,
  },
  {
    id: 'laptops',
    name: text('Noutbuklar', 'Ноутбуки'),
    image: laptopsImage,
    visible: true,
    products: 38,
  },
  { id: 'tablets', name: text('Planshetlar', 'Планшеты'), visible: true, products: 23 },
  { id: 'accessories', name: text('Aksessuarlar', 'Аксессуары'), visible: false, products: 0 },
])

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
