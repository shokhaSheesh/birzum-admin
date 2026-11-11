import photo1 from '@/shared/assets/products/product-1.jpg'
import photo2 from '@/shared/assets/products/product-2.jpg'
import photo3 from '@/shared/assets/products/product-3.jpg'
import photo4 from '@/shared/assets/products/product-4.jpg'
import photo5 from '@/shared/assets/products/product-5.jpg'
import photo6 from '@/shared/assets/products/product-6.jpg'
import photo7 from '@/shared/assets/products/product-7.jpg'
import { logMock } from './audit'
import { mockRoutes } from './index'
import { merchantName } from './merchants'
import {
  ACTOR,
  ago,
  asBody,
  invalid,
  matches,
  notFound,
  nowIso,
  paged,
  text,
  type Text,
} from './util'

type Moderation = {
  state: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  was_live: boolean
  decided_at: string
  by: string
  reason: string
  comment: string
}

type Variant = {
  key: string
  label: Text
  price_tiyin: number
  stock: { location_id: string; location_name: string; count: number }[]
}

type Product = {
  id: string
  merchant_id: string
  name: Text
  category: string
  subcategory: string
  brand: string
  photo: string
  price_tiyin: number
  visible: boolean
  moderation: Moderation
  created_at: string
  description: Text
  variants: Variant[]
  specs: { label: Text; value: Text }[]
  images: { uz: string[]; ru: string[] }
  updated_at: string
}

const LOCATIONS = ['Chilonzor filiali', 'Yunusobod filiali']

const SOM = 100 // tiyin per som

function product(
  n: number,
  merchantId: string,
  name: string,
  category: [string, string],
  brand: string,
  photo: string,
  somPrice: number,
  stock: number,
  state: Moderation['state'],
  extra: { visible?: boolean; reason?: string; comment?: string } = {},
): Product {
  const decided = state === 'pending' ? '' : ago(2 + n)
  return {
    id: `p${n}`,
    merchant_id: merchantId,
    name: text(name, name),
    category: category[0],
    subcategory: category[1],
    brand,
    photo,
    price_tiyin: somPrice * SOM,
    visible: extra.visible ?? true,
    moderation: {
      state,
      submitted_at: ago(3 + n),
      was_live: state === 'approved',
      decided_at: decided,
      by: state === 'pending' ? '' : 'a2',
      reason: extra.reason ?? '',
      comment: extra.comment ?? '',
    },
    created_at: ago(8 + n),
    description: text(
      `${name}: rasmiy kafolat, Toshkent boʻyicha yetkazib berish.`,
      `${name}: официальная гарантия, доставка по Ташкенту.`,
    ),
    variants: [
      {
        key: '',
        label: text('', ''),
        price_tiyin: somPrice * SOM,
        stock: LOCATIONS.map((location_name, i) => ({
          location_id: `loc${i + 1}`,
          location_name,
          count: i === 0 ? stock : Math.floor(stock / 2),
        })),
      },
    ],
    specs: [{ label: text('Kafolat', 'Гарантия'), value: text('12 oy', '12 месяцев') }],
    images: { uz: [photo], ru: [photo] },
    updated_at: ago(1 + n),
  }
}

const products: Product[] = [
  product(
    1,
    'm-mediapark',
    'Samsung Galaxy S25 256 GB',
    ['phones', 'smartphones'],
    'Samsung',
    photo1,
    12_990_000,
    14,
    'pending',
  ),
  product(
    2,
    'm-ispace',
    'iPhone 15 128 GB',
    ['phones', 'smartphones'],
    'Apple',
    photo2,
    11_490_000,
    9,
    'pending',
  ),
  product(
    3,
    'm-texnomart',
    'Artel 55" 4K televizor',
    ['tvs', ''],
    'Artel',
    photo3,
    5_290_000,
    6,
    'approved',
  ),
  product(
    4,
    'm-artel',
    'Artel kir yuvish mashinasi 7 kg',
    ['appliances', 'washers'],
    'Artel',
    photo4,
    3_890_000,
    11,
    'approved',
  ),
  product(
    5,
    'm-mediapark',
    'Lenovo IdeaPad 3 15"',
    ['laptops', ''],
    'Lenovo',
    photo5,
    6_450_000,
    4,
    'approved',
  ),
  product(
    6,
    'm-texnomart',
    'LG muzlatgich No Frost',
    ['appliances', 'fridges'],
    'LG',
    photo6,
    7_120_000,
    0,
    'approved',
  ),
  product(
    7,
    'm-ispace',
    'Xiaomi Redmi Note 13',
    ['phones', 'smartphones'],
    'Xiaomi',
    photo7,
    2_890_000,
    22,
    'approved',
  ),
  product(
    8,
    'm-mediapark',
    'HP Pavilion 14"',
    ['laptops', ''],
    'HP',
    photo5,
    7_990_000,
    3,
    'approved',
    { visible: false },
  ),
  product(
    9,
    'm-artel',
    'Samsung planshet Tab A9',
    ['tablets', ''],
    'Samsung',
    photo2,
    2_190_000,
    0,
    'approved',
  ),
  product(
    10,
    'm-texnomart',
    'Huawei Nova 12',
    ['phones', 'smartphones'],
    'Huawei',
    photo1,
    4_390_000,
    8,
    'rejected',
    {
      reason: 'photo',
      comment: 'Rasm xira, mahsulot toʻliq koʻrinmaydi.',
    },
  ),
  product(
    11,
    'm-ispace',
    'Konditsioner Midea 12',
    ['appliances', 'air-conditioners'],
    'Midea',
    photo4,
    4_150_000,
    5,
    'pending',
  ),
  product(
    12,
    'm-mediapark',
    'LG OLED televizor 65"',
    ['tvs', ''],
    'LG',
    photo3,
    18_900_000,
    2,
    'approved',
  ),
]

const statusOf = (item: Product) => {
  if (item.moderation.state === 'pending') return 'review'
  if (item.moderation.state === 'rejected') return 'rejected'
  if (!item.visible) return 'hidden'
  return stockOf(item) === 0 ? 'soldOut' : 'selling'
}
const stockOf = (item: Product) =>
  item.variants.reduce((sum, v) => sum + v.stock.reduce((s, row) => s + row.count, 0), 0)

const row = (item: Product) => ({
  id: item.id,
  merchant_id: item.merchant_id,
  merchant_name: merchantName(item.merchant_id),
  name: item.name,
  category: item.category,
  subcategory: item.subcategory,
  brand: item.brand,
  photo: item.photo,
  price_tiyin: item.price_tiyin,
  has_variants: item.variants.length > 1,
  stock: stockOf(item),
  visible: item.visible,
  status: statusOf(item),
  moderation: item.moderation,
  created_at: item.created_at,
})

const detail = (item: Product) => ({
  ...row(item),
  description: item.description,
  variants: item.variants,
  specs: item.specs,
  images: item.images,
  value_images: {},
  updated_at: item.updated_at,
})

const find = (id: string) => {
  const found = products.find((p) => p.id === id)
  if (!found) throw notFound()
  return found
}

const logProduct = (action: string, item: Product) =>
  logMock({
    section: 'products',
    kind: 'update',
    action,
    target: item.name.uz,
    entity: 'product',
    entityId: item.id,
  })

mockRoutes(
  {
    method: 'GET',
    match: '/admin/products',
    handle({ query }) {
      // Everything but the status narrows the tab counts too
      const scope = products.filter(
        (p) =>
          (!query.merchant_id || p.merchant_id === query.merchant_id) &&
          (!query.category || p.category === query.category || p.subcategory === query.category) &&
          (!query.brand || p.brand.toLowerCase() === query.brand.toLowerCase()) &&
          matches(query.q, p.name.uz, p.name.ru, p.brand),
      )
      const count = (status: string) => scope.filter((p) => statusOf(p) === status).length
      const wanted =
        !query.status || query.status === 'all'
          ? scope
          : scope.filter(
              (p) => statusOf(p) === (query.status === 'sold_out' ? 'soldOut' : query.status),
            )
      // Waiting ones first, then the newest
      const sorted = [...wanted].sort(
        (a, b) =>
          Number(statusOf(b) === 'review') - Number(statusOf(a) === 'review') ||
          b.created_at.localeCompare(a.created_at),
      )
      const page = paged(sorted, query)
      return {
        ...page,
        items: page.items.map(row),
        counts: {
          all: scope.length,
          review: count('review'),
          selling: count('selling'),
          sold_out: count('soldOut'),
          hidden: count('hidden'),
          rejected: count('rejected'),
        },
      }
    },
  },
  { method: 'GET', match: '/admin/products/:id', handle: ({ params }) => detail(find(params.id)) },
  {
    method: 'PUT',
    match: '/admin/products/:id/approve',
    handle({ params }) {
      const item = find(params.id)
      item.moderation = {
        ...item.moderation,
        state: 'approved',
        decided_at: nowIso(),
        by: ACTOR.id,
        reason: '',
        comment: '',
      }
      logProduct('productApproved', item)
      return detail(item)
    },
  },
  {
    method: 'PUT',
    match: '/admin/products/:id/reject',
    handle({ params, body }) {
      const item = find(params.id)
      const input = asBody(body)
      if (!['photo', 'text', 'category', 'price', 'forbidden', 'other'].includes(input.reason)) {
        throw invalid({ reason: 'is invalid' })
      }
      item.moderation = {
        ...item.moderation,
        state: 'rejected',
        decided_at: nowIso(),
        by: ACTOR.id,
        reason: input.reason,
        comment: String(input.comment ?? ''),
      }
      logProduct('productRejected', item)
      return detail(item)
    },
  },
)
