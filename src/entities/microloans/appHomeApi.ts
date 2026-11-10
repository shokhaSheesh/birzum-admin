import { apiGet, apiPut } from '@/shared/api/client'
import { appResource } from '@/shared/api/appResource'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import { toastError } from '@/shared/api/errors'
import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import type { InfoTile, MenuSlot } from './appHome'

type ApiSlot = {
  id: string
  app: Brand
  place: MenuSlot['place']
  key: MenuSlot['key']
  label: LocalizedText
  visible: boolean
  locked: boolean
}

const slotStores = new Map<Brand, ReturnType<typeof createRemoteStore<MenuSlot>>>()

/** One brand's menu buttons: the quick actions first, then the tabs. */
export function menuStoreOf(brand: Brand) {
  let store = slotStores.get(brand)
  if (!store) {
    store = createRemoteStore<MenuSlot>(async () => {
      const data = await apiGet<{ items: ApiSlot[] }>(`/admin/apps/${brand}/menu`)
      return data.items.map((raw) => ({
        id: raw.id,
        brand: raw.app,
        place: raw.place,
        key: raw.key,
        label: raw.label,
        visible: raw.visible,
        locked: raw.locked || undefined,
      }))
    })
    slotStores.set(brand, store)
  }
  return store
}

export async function saveMenuSlot(slot: MenuSlot, input: Pick<MenuSlot, 'label' | 'visible'>) {
  await apiPut(`/admin/apps/${slot.brand}/menu/${slot.id}`, input)
  await menuStoreOf(slot.brand).reload()
}

/** `ordered` is one place's buttons (all actions, or all tabs) in their new order. */
export async function orderMenu(brand: Brand, ordered: MenuSlot[]) {
  const store = menuStoreOf(brand)
  const place = ordered[0]?.place
  if (!place) return
  const ids = new Set(ordered.map((item) => item.id))
  const queue = [...ordered]
  store.setLocal(store.getAll().map((item) => (ids.has(item.id) ? queue.shift()! : item)))
  try {
    await apiPut(`/admin/apps/${brand}/menu/order`, { place, ids: ordered.map((i) => i.id) })
  } catch (e) {
    toastError(e)
  }
  await store.reload()
}

type ApiTile = {
  id: string
  app: Brand
  title: LocalizedText
  image_url: string
  text: LocalizedText
  visible: boolean
}
type TileInput = Pick<InfoTile, 'title' | 'text' | 'image' | 'visible'>

/** The tiles have no /visible call: showing or hiding sends the whole tile. */
export const tilesApi = appResource<InfoTile, ApiTile, TileInput>('tiles', {
  fromApi: (raw) => ({
    id: raw.id,
    brand: raw.app,
    title: raw.title,
    image: raw.image_url || undefined,
    text: raw.text,
    visible: raw.visible,
  }),
  toApi: (input) => ({
    title: input.title,
    text: input.text,
    image_url: input.image ?? '',
    visible: input.visible,
  }),
})
