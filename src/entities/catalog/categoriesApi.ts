import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import { toastError } from '@/shared/api/errors'
import type { Category } from './categories'

type ApiCategory = {
  id: string
  parent_id: string
  name: Category['name']
  image_url: string
  visible: boolean
  products_count: number
}

const toCategory = (raw: ApiCategory): Category => ({
  id: raw.id,
  parentId: raw.parent_id || undefined,
  name: raw.name,
  image: raw.image_url || undefined,
  visible: raw.visible,
  products: raw.products_count,
})

/** Already in tree order: each root with its subcategories under it. */
export const categoriesStore = createRemoteStore<Category>(async () => {
  const data = await apiGet<{ items: ApiCategory[] }>('/admin/categories')
  return data.items.map(toCategory)
})

type CategoryInput = Pick<Category, 'parentId' | 'name' | 'image' | 'visible'>

const bodyOf = (input: CategoryInput) => ({
  parent_id: input.parentId ?? '',
  name: input.name,
  image_url: input.image ?? '',
  visible: input.visible,
})

export async function createCategory(input: CategoryInput) {
  await apiPost('/admin/categories', bodyOf(input))
  await categoriesStore.reload()
}

export async function updateCategory(id: string, input: CategoryInput) {
  await apiPut(`/admin/categories/${id}`, bodyOf(input))
  await categoriesStore.reload()
}

export async function setCategoryVisible(id: string, visible: boolean) {
  await apiPut(`/admin/categories/${id}/visible`, { visible })
  await categoriesStore.reload()
}

export async function deleteCategory(id: string) {
  await apiDelete(`/admin/categories/${id}`)
  await categoriesStore.reload()
}

/** Saves the order of one group (the roots, or one category's children) right after a drag. */
export async function orderCategories(next: Category[], parentId: string | undefined) {
  categoriesStore.setLocal(next)
  try {
    await apiPut('/admin/categories/order', {
      parent_id: parentId ?? '',
      ids: next.filter((item) => item.parentId === parentId).map((item) => item.id),
    })
  } catch (e) {
    toastError(e)
  }
  await categoriesStore.reload()
}
