import type { Workspace } from '@/shared/config/workspaces'
import { apiDelete, apiGet, apiPost, apiPut } from './client'
import { createRemoteStore } from './createRemoteStore'
import { toastError } from './errors'

/**
 * A list kept per app under `/admin/apps/:app/<resource>` (Savol-javoblar, slides, banners,
 * quick replies...): one remote store per app, and the calls every such list has: create,
 * replace, show/hide, delete, and the order (`ids` of the whole group).
 */
export function appResource<T extends { id: string }, Raw, Input>(
  resource: string,
  convert: { fromApi: (raw: Raw) => T; toApi: (input: Input, app: Workspace) => unknown },
) {
  const stores = new Map<Workspace, ReturnType<typeof createRemoteStore<T>>>()
  const path = (app: Workspace, rest = '') => `/admin/apps/${app}/${resource}${rest}`

  const storeOf = (app: Workspace) => {
    let store = stores.get(app)
    if (!store) {
      store = createRemoteStore<T>(async () => {
        const data = await apiGet<{ items: Raw[] }>(path(app))
        return data.items.map(convert.fromApi)
      })
      stores.set(app, store)
    }
    return store
  }

  return {
    storeOf,
    async create(app: Workspace, input: Input) {
      await apiPost(path(app), convert.toApi(input, app))
      await storeOf(app).reload()
    },
    async update(app: Workspace, id: string, input: Input) {
      await apiPut(path(app, `/${id}`), convert.toApi(input, app))
      await storeOf(app).reload()
    },
    async setVisible(app: Workspace, id: string, visible: boolean) {
      await apiPut(path(app, `/${id}/visible`), { visible })
      await storeOf(app).reload()
    },
    async remove(app: Workspace, id: string) {
      await apiDelete(path(app, `/${id}`))
      await storeOf(app).reload()
    },
    /** Shows the new order at once, saves it, and reads the list again (also when saving failed). */
    async order(app: Workspace, next: T[], extra: Record<string, unknown> = {}) {
      const store = storeOf(app)
      store.setLocal(next)
      try {
        await apiPut(path(app, '/order'), { ...extra, ids: next.map((item) => item.id) })
      } catch (e) {
        toastError(e)
      }
      await store.reload()
    },
  }
}
