import appliancesImage from '@/shared/assets/categories/appliances.jpg'
import laptopsImage from '@/shared/assets/categories/laptops.jpg'
import phonesImage from '@/shared/assets/categories/phones.jpg'
import tvsImage from '@/shared/assets/categories/tvs.jpg'
import { logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { asBody, invalid, isText, newId, notFound, text, type Text } from './util'

type Category = {
  id: string
  parent_id: string
  name: Text
  image_url: string
  visible: boolean
  products_count: number
}

const cat = (
  id: string,
  parent_id: string,
  name: Text,
  image_url: string,
  products_count: number,
  visible = true,
): Category => ({ id, parent_id, name, image_url, visible, products_count })

// Stored in display order: the position inside the array is the sort order of each group
const categories: Category[] = [
  cat('phones', '', text('Telefonlar', 'Телефоны'), phonesImage, 0),
  cat('smartphones', 'phones', text('Smartfonlar', 'Смартфоны'), phonesImage, 88),
  cat('feature-phones', 'phones', text('Tugmali telefonlar', 'Кнопочные телефоны'), '', 8),
  cat('tvs', '', text('Televizorlar', 'Телевизоры'), tvsImage, 42),
  cat('appliances', '', text('Maishiy texnika', 'Бытовая техника'), appliancesImage, 0),
  cat(
    'washers',
    'appliances',
    text('Kir yuvish mashinalari', 'Стиральные машины'),
    appliancesImage,
    34,
  ),
  cat('fridges', 'appliances', text('Muzlatgichlar', 'Холодильники'), '', 25),
  cat('air-conditioners', 'appliances', text('Konditsionerlar', 'Кондиционеры'), '', 12),
  cat('laptops', '', text('Noutbuklar', 'Ноутбуки'), laptopsImage, 38),
  cat('tablets', '', text('Planshetlar', 'Планшеты'), '', 23),
  cat('accessories', '', text('Aksessuarlar', 'Аксессуары'), '', 0, false),
]

const sameName = (a: Text, b: Text) =>
  a.uz.trim().toLowerCase() === b.uz.trim().toLowerCase() ||
  a.ru.trim().toLowerCase() === b.ru.trim().toLowerCase()

/** The list in tree order: each root with its subcategories under it. */
function tree() {
  const roots = categories.filter((c) => !c.parent_id)
  return roots.flatMap((root) => [root, ...categories.filter((c) => c.parent_id === root.id)])
}

const view = (item: Category) => ({
  ...item,
  children_count: categories.filter((c) => c.parent_id === item.id).length,
})

const find = (id: string) => {
  const found = categories.find((c) => c.id === id)
  if (!found) throw notFound()
  return found
}

function read(body: unknown, current?: Category) {
  const input = asBody(body)
  if (!isText(input.name)) throw invalid({ name: 'is required in both languages' })
  const parentId = String(input.parent_id ?? '')
  if (parentId) {
    const parent = categories.find((c) => c.id === parentId)
    const hasChildren = current && categories.some((c) => c.parent_id === current.id)
    if (!parent || parent.parent_id || parent.id === current?.id || hasChildren) {
      throw mockError(400, 'category_parent_invalid', 'Invalid parent category')
    }
  }
  const name = { uz: input.name.uz.trim(), ru: input.name.ru.trim() }
  if (
    categories.some(
      (c) => c.id !== current?.id && c.parent_id === parentId && sameName(c.name, name),
    )
  ) {
    throw mockError(409, 'category_name_taken', 'Category name is taken')
  }
  return {
    parent_id: parentId,
    name,
    image_url: String(input.image_url ?? ''),
    visible: input.visible !== false,
  }
}

const logCategory = (action: string, kind: 'create' | 'update' | 'delete', item: Category) =>
  logMock({
    section: 'categories',
    kind,
    action,
    target: item.name.uz,
    entity: 'category',
    entityId: item.id,
  })

mockRoutes(
  {
    method: 'GET',
    match: '/admin/categories',
    handle: () => ({ items: tree().map(view), total: categories.length }),
  },
  {
    method: 'POST',
    match: '/admin/categories',
    handle({ body }) {
      const created: Category = { ...read(body), id: newId(), products_count: 0 }
      categories.push(created)
      logCategory('categoryCreated', 'create', created)
      return view(created)
    },
  },
  // `/order` is registered before `/:id`, which would also match it
  {
    method: 'PUT',
    match: '/admin/categories/order',
    handle({ body }) {
      const input = asBody(body)
      const parentId = String(input.parent_id ?? '')
      const ids = (input.ids ?? []) as string[]
      const group = categories.filter((c) => c.parent_id === parentId)
      if (ids.length !== group.length || !group.every((c) => ids.includes(c.id))) {
        throw mockError(400, 'invalid_order', 'The order must list the whole group')
      }
      const sorted = ids.map((id) => find(id))
      let next = 0
      for (let i = 0; i < categories.length; i++) {
        if (categories[i].parent_id === parentId) categories[i] = sorted[next++]
      }
      return {}
    },
  },
  {
    method: 'PUT',
    match: '/admin/categories/:id/visible',
    handle({ params, body }) {
      const current = find(params.id)
      const visible = asBody(body).visible
      if (typeof visible !== 'boolean') throw invalid({ visible: 'is required' })
      current.visible = visible
      if (!visible) logCategory('categoryHidden', 'update', current)
      return view(current)
    },
  },
  {
    method: 'PUT',
    match: '/admin/categories/:id',
    handle({ params, body }) {
      const current = find(params.id)
      Object.assign(current, read(body, current))
      logCategory('categorySaved', 'update', current)
      return view(current)
    },
  },
  {
    method: 'DELETE',
    match: '/admin/categories/:id',
    handle({ params }) {
      const current = find(params.id)
      if (categories.some((c) => c.parent_id === current.id)) {
        throw mockError(409, 'category_has_children', 'The category has subcategories')
      }
      if (current.products_count > 0) {
        throw mockError(409, 'category_has_products', 'The category has products')
      }
      categories.splice(categories.indexOf(current), 1)
      logCategory('categoryDeleted', 'delete', current)
      return {}
    },
  },
)

type Brand = { id: string; name: string; logo_url: string; products_count: number }

const brands: Brand[] = [
  ['apple', 'Apple', 64],
  ['artel', 'Artel', 38],
  ['hp', 'HP', 12],
  ['huawei', 'Huawei', 9],
  ['lenovo', 'Lenovo', 17],
  ['lg', 'LG', 26],
  ['samsung', 'Samsung', 71],
  ['xiaomi', 'Xiaomi', 33],
  ['tcl', 'TCL', 0],
].map(([id, name, products_count]) => ({
  id: id as string,
  name: name as string,
  logo_url: '',
  products_count: products_count as number,
}))

function readBrand(body: unknown, current?: Brand) {
  const input = asBody(body)
  const name = String(input.name ?? '').trim()
  if (!name || name.length > 120) throw invalid({ name: 'is invalid' })
  if (brands.some((b) => b.id !== current?.id && b.name.toLowerCase() === name.toLowerCase())) {
    throw mockError(409, 'brand_name_taken', 'Brand name is taken')
  }
  return { name, logo_url: String(input.logo_url ?? '') }
}

const findBrand = (id: string) => {
  const found = brands.find((b) => b.id === id)
  if (!found) throw notFound()
  return found
}

const logBrand = (action: string, kind: 'create' | 'update' | 'delete', item: Brand) =>
  logMock({
    section: 'brands',
    kind,
    action,
    target: item.name,
    entity: 'brand',
    entityId: item.id,
  })

mockRoutes(
  {
    method: 'GET',
    match: '/admin/brands',
    handle: () => ({
      items: [...brands].sort((a, b) => a.name.localeCompare(b.name)),
      total: brands.length,
    }),
  },
  {
    method: 'POST',
    match: '/admin/brands',
    handle({ body }) {
      const created = { ...readBrand(body), id: newId(), products_count: 0 }
      brands.push(created)
      logBrand('brandCreated', 'create', created)
      return created
    },
  },
  {
    method: 'PUT',
    match: '/admin/brands/:id',
    handle({ params, body }) {
      const current = findBrand(params.id)
      Object.assign(current, readBrand(body, current))
      logBrand('brandSaved', 'update', current)
      return current
    },
  },
  {
    method: 'DELETE',
    match: '/admin/brands/:id',
    handle({ params }) {
      const current = findBrand(params.id)
      if (current.products_count > 0) {
        throw mockError(409, 'brand_has_products', 'The brand has products')
      }
      brands.splice(brands.indexOf(current), 1)
      logBrand('brandDeleted', 'delete', current)
      return {}
    },
  },
)
