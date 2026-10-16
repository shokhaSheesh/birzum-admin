import appliancesImage from '@/shared/assets/categories/appliances.jpg'
import laptopsImage from '@/shared/assets/categories/laptops.jpg'
import phonesImage from '@/shared/assets/categories/phones.jpg'
import tvsImage from '@/shared/assets/categories/tvs.jpg'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/**
 * A product category. Only the admin creates them; merchants pick one for each product.
 * The list order is the order shoppers see in the client app.
 */
export type Category = {
  id: string
  name: LocalizedText
  /** Square picture on the client app's home screen. */
  image?: string
  /** Hidden: shoppers do not see it and merchants cannot pick it for new products. */
  visible: boolean
  /** Products in it across all merchants. The backend counts them. Sample values. */
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
    products: 96,
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
    products: 71,
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
