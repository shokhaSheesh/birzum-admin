import photo1 from '@/shared/assets/products/product-1.jpg'
import photo2 from '@/shared/assets/products/product-2.jpg'
import photo3 from '@/shared/assets/products/product-3.jpg'
import photo4 from '@/shared/assets/products/product-4.jpg'
import photo5 from '@/shared/assets/products/product-5.jpg'
import photo6 from '@/shared/assets/products/product-6.jpg'
import photo7 from '@/shared/assets/products/product-7.jpg'
import photo9 from '@/shared/assets/products/product-9.jpg'
import photo10 from '@/shared/assets/products/product-10.jpg'
import photo11 from '@/shared/assets/products/product-11.jpg'
import photo12 from '@/shared/assets/products/product-12.jpg'
import photo13 from '@/shared/assets/products/product-13.jpg'
import photo14 from '@/shared/assets/products/product-14.jpg'
import photo15 from '@/shared/assets/products/product-15.jpg'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** One way to buy a product, e.g. "Qora · 256 GB", with its price and pieces per filial. */
export type ProductVariant = {
  /** Empty for a product without variations. */
  label: LocalizedText
  price: number
  /** Filial id, then pieces on hand. A missing filial means zero. */
  stock: Record<string, number>
}

/**
 * A merchant's product as the admin sees it. Merchants create and edit products in their app;
 * the admin only looks.
 */
export type Product = {
  id: string
  merchantId: string
  name: LocalizedText
  description: LocalizedText
  /** A subcategory when the category has any, else the category. */
  categoryId: string
  brandId: string
  /** Cover first. */
  photos: string[]
  variants: ProductVariant[]
  specs: { label: LocalizedText; value: LocalizedText }[]
  /** The merchant's own switch: off hides it from shoppers. */
  visible: boolean
  createdAt: Date
  /** Nasiya sales of this product so far. The backend counts them. Sample value. */
  sold: number
}

export const priceOf = (product: Product) => Math.min(...product.variants.map((v) => v.price))
export const stockOfVariant = (variant: ProductVariant) =>
  Object.values(variant.stock).reduce((sum, count) => sum + count, 0)
export const stockOf = (product: Product) =>
  product.variants.reduce((sum, variant) => sum + stockOfVariant(variant), 0)

export type ProductStatus = 'selling' | 'soldOut' | 'hidden'
export const PRODUCT_STATUSES: ProductStatus[] = ['selling', 'soldOut', 'hidden']
/** Hidden by the merchant, else out of stock everywhere, else on sale. */
export const statusOf = (product: Product): ProductStatus =>
  !product.visible ? 'hidden' : stockOf(product) === 0 ? 'soldOut' : 'selling'

// The samples are written short and expanded below: options with a price difference, and a
// stock count spread over the merchant's filials.
const text = (uz: string, ru: string): LocalizedText => ({ uz, ru })
const same = (value: string): LocalizedText => ({ uz: value, ru: value })

type Option = [LocalizedText, number?]
const COLORS: Record<string, LocalizedText> = {
  Oq: text('Oq', 'Белый'),
  Qora: text('Qora', 'Чёрный'),
  Kumush: text('Kumush', 'Серебристый'),
  Binafsha: text('Binafsha', 'Фиолетовый'),
  Qizil: text('Qizil', 'Красный'),
}
const colors = (...names: string[]): Option[] => names.map((name) => [COLORS[name]])
const sizes = (...options: [string, number?][]): Option[] =>
  options.map(([label, delta]) => [same(label), delta])

const SPEC_RU: Record<string, string> = {
  Ekran: 'Экран',
  Kamera: 'Камера',
  Protsessor: 'Процессор',
  Kafolat: 'Гарантия',
  Diagonal: 'Диагональ',
  Tasvir: 'Изображение',
  HDMI: 'HDMI',
  Aylanish: 'Отжим',
  'Energiya sinfi': 'Класс энергии',
  Dasturlar: 'Программы',
  SSD: 'SSD',
  'Smart TV': 'Smart TV',
  Xotira: 'Память',
}

/** Every combination of the option groups, each priced and stocked. */
function variantsOf(
  price: number,
  groups: Option[][],
  stock: number,
  filials: string[],
): ProductVariant[] {
  const combos = groups.reduce<Option[][]>(
    (all, group) => all.flatMap((combo) => group.map((option) => [...combo, option])),
    [[]],
  )
  return combos.map((combo, index) => {
    // The first filial holds most of the stock. With several combinations the last one has run out
    const pieces = index === combos.length - 1 && combos.length > 2 ? 0 : stock
    return {
      label: {
        uz: combo.map(([label]) => label.uz).join(' · '),
        ru: combo.map(([label]) => label.ru).join(' · '),
      },
      price: price + combo.reduce((sum, [, delta]) => sum + (delta ?? 0), 0),
      stock: Object.fromEntries(
        filials.map((filial, i) => [
          filial,
          i === 0
            ? Math.ceil(pieces * 0.6)
            : Math.floor((pieces * 0.4) / (filials.length - 1 || 1)),
        ]),
      ),
    }
  })
}

const FILIALS: Record<string, string[]> = {
  m1: ['f1', 'f2', 'f3'],
  m2: ['f4', 'f5'],
  m3: ['f6'],
  m4: ['f7', 'f8'],
}

type Seed = {
  id: string
  merchantId: string
  name: LocalizedText
  description: LocalizedText
  categoryId: string
  brandId: string
  price: number
  groups: Option[][]
  stock: number
  specs: [string, string][]
  photos: string[]
  visible?: boolean
  createdAt: Date
  sold: number
}

const product = (seed: Seed): Product => ({
  id: seed.id,
  merchantId: seed.merchantId,
  name: seed.name,
  description: seed.description,
  categoryId: seed.categoryId,
  brandId: seed.brandId,
  photos: seed.photos,
  variants: variantsOf(seed.price, seed.groups, seed.stock, FILIALS[seed.merchantId]),
  specs: seed.specs.map(([label, value]) => ({
    label: text(label, SPEC_RU[label] ?? label),
    value: same(value),
  })),
  visible: seed.visible ?? true,
  createdAt: seed.createdAt,
  sold: seed.sold,
})

// The products the mobile apps show, plus two more. Replace with the API.
const seeds: Seed[] = [
  {
    id: 'p1',
    merchantId: 'm1',
    name: text('iPhone 18 Pro', 'iPhone 18 Pro'),
    description: text(
      'Titan korpusli flagman smartfon. 48 MP uch kamerali tizim, yorqin OLED ekran va bir kunga yetadigan batareya.',
      'Флагманский смартфон в титановом корпусе. Тройная камера 48 Мп, яркий OLED-экран и батарея на весь день.',
    ),
    categoryId: 'smartphones',
    brandId: 'apple',
    price: 16_900_000,
    groups: [colors('Oq', 'Qora'), sizes(['256 GB'], ['512 GB', 2_500_000])],
    stock: 6,
    specs: [
      ['Ekran', '6,3", OLED'],
      ['Kamera', '48 MP'],
      ['Protsessor', 'A19 Pro'],
      ['Kafolat', '12 oy'],
    ],
    photos: [photo1, photo4],
    createdAt: new Date(2026, 8, 4),
    sold: 41,
  },
  {
    id: 'p2',
    merchantId: 'm1',
    name: text('Televizor 43', 'Телевизор 43'),
    description: text(
      'Full HD tasvirli 43 dyuymli televizor. Ingichka ramka va ikkita HDMI kirish.',
      'Телевизор 43 дюйма с Full HD. Тонкая рамка и два входа HDMI.',
    ),
    categoryId: 'tvs',
    brandId: 'artel',
    price: 4_200_000,
    groups: [],
    stock: 5,
    specs: [
      ['Diagonal', '43"'],
      ['Tasvir', 'Full HD'],
      ['HDMI', '2'],
      ['Kafolat', '24 oy'],
    ],
    photos: [photo9],
    createdAt: new Date(2026, 6, 18),
    sold: 17,
  },
  {
    id: 'p3',
    merchantId: 'm2',
    name: text('LG kir yuvish mashinasi', 'Стиральная машина LG'),
    description: text(
      'Bugʻ bilan yuvish rejimiga ega avtomat mashina. Jim ishlaydi va elektr energiyasini tejaydi.',
      'Автоматическая машина с паровой стиркой. Работает тихо и экономит электроэнергию.',
    ),
    categoryId: 'washers',
    brandId: 'lg',
    price: 6_900_000,
    groups: [colors('Oq', 'Kumush'), sizes(['7 kg'], ['9 kg', 1_100_000])],
    stock: 3,
    specs: [
      ['Aylanish', '1200'],
      ['Energiya sinfi', 'A+++'],
      ['Dasturlar', '14'],
      ['Kafolat', '36 oy'],
    ],
    photos: [photo7, photo5],
    createdAt: new Date(2026, 7, 22),
    sold: 9,
  },
  {
    id: 'p4',
    merchantId: 'm2',
    name: text('Lenovo IdeaPad noutbuk', 'Ноутбук Lenovo IdeaPad'),
    description: text(
      'Oʻqish va ish uchun yengil noutbuk. Tez SSD xotira va toʻliq kunlik batareya.',
      'Лёгкий ноутбук для учёбы и работы. Быстрый SSD и батарея на весь день.',
    ),
    categoryId: 'laptops',
    brandId: 'lenovo',
    price: 8_400_000,
    groups: [sizes(['8 GB'], ['16 GB', 900_000])],
    stock: 7,
    specs: [
      ['Ekran', '15,6", Full HD'],
      ['Protsessor', 'Intel Core i5'],
      ['SSD', '512 GB'],
      ['Kafolat', '12 oy'],
    ],
    photos: [photo11, photo13],
    createdAt: new Date(2026, 5, 9),
    sold: 12,
  },
  {
    id: 'p5',
    merchantId: 'm3',
    name: text('iPhone 18', 'iPhone 18'),
    description: text(
      'Alyuminiy korpusli yengil smartfon: 120 Gts ekran, ikki kamerali tizim va tez quvvatlash.',
      'Лёгкий смартфон в алюминиевом корпусе: экран 120 Гц, двойная камера и быстрая зарядка.',
    ),
    categoryId: 'smartphones',
    brandId: 'apple',
    price: 12_900_000,
    groups: [colors('Binafsha'), sizes(['128 GB'], ['256 GB', 1_400_000])],
    stock: 20,
    specs: [
      ['Ekran', '6,1", OLED'],
      ['Kamera', '48 MP'],
      ['Protsessor', 'A19'],
      ['Kafolat', '12 oy'],
    ],
    photos: [photo3],
    createdAt: new Date(2026, 8, 12),
    sold: 33,
  },
  {
    id: 'p6',
    merchantId: 'm3',
    name: text('Televizor 55 Smart', 'Телевизор 55 Smart'),
    description: text(
      '4K tasvirli aqlli televizor. Wi-Fi, ovozli boshqaruv va ilovalar doʻkoni bor.',
      'Умный телевизор с 4K. Wi-Fi, голосовое управление и магазин приложений.',
    ),
    categoryId: 'tvs',
    brandId: 'samsung',
    price: 7_800_000,
    groups: [],
    stock: 0,
    specs: [
      ['Diagonal', '55"'],
      ['Tasvir', '4K UHD'],
      ['Smart TV', '✓'],
      ['Kafolat', '24 oy'],
    ],
    photos: [photo10],
    createdAt: new Date(2026, 4, 30),
    sold: 21,
  },
  {
    id: 'p7',
    merchantId: 'm1',
    name: text('Artel kir yuvish mashinasi', 'Стиральная машина Artel'),
    description: text(
      'Invertor motorli avtomat kir yuvish mashinasi. Tez yuvish rejimi va bolalardan himoya bor.',
      'Автоматическая стиральная машина с инверторным мотором. Быстрая стирка и защита от детей.',
    ),
    categoryId: 'washers',
    brandId: 'artel',
    price: 6_000_000,
    groups: [colors('Qora'), sizes(['7 kg'], ['9 kg', 1_800_000])],
    stock: 9,
    specs: [
      ['Aylanish', '1400'],
      ['Energiya sinfi', 'A+++'],
      ['Dasturlar', '16'],
      ['Kafolat', '36 oy'],
    ],
    photos: [photo6],
    createdAt: new Date(2026, 7, 2),
    sold: 14,
  },
  {
    id: 'p8',
    merchantId: 'm3',
    name: text('HP 15 noutbuk', 'Ноутбук HP 15'),
    description: text(
      'Kundalik ishlar uchun ishonchli noutbuk. Katta ekran va qulay klaviatura.',
      'Надёжный ноутбук на каждый день. Большой экран и удобная клавиатура.',
    ),
    categoryId: 'laptops',
    brandId: 'hp',
    price: 6_500_000,
    groups: [colors('Kumush', 'Qora'), sizes(['8 GB'], ['16 GB', 800_000])],
    stock: 4,
    specs: [
      ['Ekran', '15,6", Full HD'],
      ['Protsessor', 'Intel Core i3'],
      ['SSD', '256 GB'],
      ['Kafolat', '12 oy'],
    ],
    photos: [photo12, photo15, photo14],
    createdAt: new Date(2026, 6, 6),
    sold: 8,
  },
  {
    id: 'p9',
    merchantId: 'm2',
    name: text('iPhone 18 Pro Max', 'iPhone 18 Pro Max'),
    description: text(
      'Eng katta ekranli flagman: kuchli protsessor, uzoq ishlaydigan batareya va tungi suratga olish.',
      'Флагман с самым большим экраном: мощный процессор, долгая батарея и ночная съёмка.',
    ),
    categoryId: 'smartphones',
    brandId: 'apple',
    price: 19_900_000,
    groups: [colors('Qizil'), sizes(['256 GB'], ['512 GB', 2_500_000])],
    stock: 6,
    specs: [
      ['Ekran', '6,9", OLED'],
      ['Kamera', '48 MP'],
      ['Protsessor', 'A19 Pro'],
      ['Kafolat', '12 oy'],
    ],
    photos: [photo2],
    createdAt: new Date(2026, 8, 20),
    sold: 27,
  },
  {
    id: 'p10',
    merchantId: 'm3',
    name: text('iPhone 18 Pro', 'iPhone 18 Pro'),
    description: text(
      'Titan korpusli flagman smartfon. 48 MP uch kamerali tizim va yorqin OLED ekran.',
      'Флагманский смартфон в титановом корпусе. Тройная камера 48 Мп и яркий OLED-экран.',
    ),
    categoryId: 'smartphones',
    brandId: 'apple',
    price: 17_200_000,
    groups: [colors('Qora', 'Oq')],
    stock: 15,
    specs: [
      ['Ekran', '6,3", OLED'],
      ['Kamera', '48 MP'],
      ['Xotira', '256 GB'],
      ['Kafolat', '12 oy'],
    ],
    photos: [photo4, photo1],
    createdAt: new Date(2026, 8, 15),
    sold: 19,
  },
  {
    id: 'p11',
    merchantId: 'm4',
    name: text('Samsung muzlatgich', 'Холодильник Samsung'),
    description: text(
      'Ikki kamerali muzlatgich, No Frost tizimi va invertor kompressor.',
      'Двухкамерный холодильник с No Frost и инверторным компрессором.',
    ),
    categoryId: 'fridges',
    brandId: 'samsung',
    price: 9_400_000,
    groups: [colors('Kumush', 'Qora')],
    stock: 4,
    specs: [
      ['Energiya sinfi', 'A++'],
      ['Kafolat', '24 oy'],
    ],
    photos: [],
    visible: false,
    createdAt: new Date(2026, 7, 11),
    sold: 3,
  },
  {
    id: 'p12',
    merchantId: 'm1',
    name: text('Xiaomi Redmi 15', 'Xiaomi Redmi 15'),
    description: text(
      'Arzon va ishonchli smartfon: katta batareya va 50 MP kamera.',
      'Недорогой и надёжный смартфон: большая батарея и камера 50 Мп.',
    ),
    categoryId: 'smartphones',
    brandId: 'xiaomi',
    price: 2_600_000,
    groups: [sizes(['128 GB'], ['256 GB', 400_000])],
    stock: 0,
    specs: [
      ['Ekran', '6,7"'],
      ['Kamera', '50 MP'],
      ['Kafolat', '12 oy'],
    ],
    photos: [],
    createdAt: new Date(2026, 9, 2),
    sold: 6,
  },
]

export const productsStore = createStore<Product>(seeds.map(product))
