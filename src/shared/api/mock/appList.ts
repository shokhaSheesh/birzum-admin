import { BRAND_NAME, logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { asBody, invalid, newId, notFound } from './util'

type Row = { id: string; app: string; visible?: boolean }

type AuditActions = {
  created: string
  saved: string
  deleted: string
  hidden?: string
  shown?: string
}

type Options<T extends Row> = {
  /** The path part after `/admin/apps/:app/`. */
  resource: string
  /** The apps that have this list; any other `:app` is a 404. */
  apps: string[]
  seeds: Record<string, T[]>
  /** Checks the body and returns the fields to store; throws the API's error when it is wrong. */
  build: (body: Record<string, any>, app: string, current?: T) => Omit<T, 'id' | 'app'>
  section: (app: string) => string
  actions: (app: string) => AuditActions
  target: (item: T) => string
  entity: string
  /** Has `PUT .../:id/visible` and `PUT .../order`. */
  hasVisible?: boolean
  hasOrder?: boolean
  /** Fields the response adds to a stored row (`state`, `built_in`...). */
  decorate?: (item: T) => Record<string, unknown>
  /** Extra fields beside `items` and `total` in the list response. */
  extras?: (items: T[]) => Record<string, unknown>
  /** The most rows a list may hold (409 `limit_reached`). */
  limit?: number
}

/**
 * The calls every per-app list has (`/admin/apps/:app/<resource>`): list, create, replace, delete,
 * and the optional order and show/hide. Rows live in memory per app.
 */
export function appList<T extends Row>(options: Options<T>) {
  const store = new Map<string, T[]>(Object.entries(options.seeds))
  const base = `/admin/apps/:app/${options.resource}`

  const rowsOf = (app: string) => {
    if (!options.apps.includes(app)) throw notFound()
    let rows = store.get(app)
    if (!rows) store.set(app, (rows = []))
    return rows
  }
  const view = (rows: T[], item: T) => ({
    ...item,
    ...options.decorate?.(item),
    sort_order: rows.indexOf(item) + 1,
  })
  const find = (app: string, id: string) => {
    const rows = rowsOf(app)
    const found = rows.find((row) => row.id === id)
    if (!found) throw notFound()
    return { rows, found }
  }
  const log = (app: string, kind: 'create' | 'update' | 'delete', action: string, item: T) =>
    logMock({
      section: options.section(app),
      kind,
      action,
      target: options.target(item),
      entity: options.entity,
      entityId: item.id,
      company: app,
      params: app === 'birzum' ? {} : { brand: BRAND_NAME[app] },
    })

  mockRoutes(
    {
      method: 'GET',
      match: base,
      handle({ params, query }) {
        const rows = rowsOf(params.app)
        const topic = query.topic
        const shown = topic
          ? rows.filter((row) => (row as any).topic === topic || (row as any).topic === 'any')
          : rows
        return {
          items: shown.map((row) => view(rows, row)),
          total: shown.length,
          ...options.extras?.(rows),
        }
      },
    },
    {
      method: 'POST',
      match: base,
      handle({ params, body }) {
        const rows = rowsOf(params.app)
        if (options.limit && rows.length >= options.limit) {
          throw mockError(409, 'limit_reached', 'Too many rows')
        }
        const created = {
          ...options.build(asBody(body), params.app),
          id: newId(),
          app: params.app,
        } as T
        rows.push(created)
        log(params.app, 'create', options.actions(params.app).created, created)
        return view(rows, created)
      },
    },
  )

  // `/order` goes before `/:id`, which would match it too
  if (options.hasOrder) {
    mockRoutes({
      method: 'PUT',
      match: `${base}/order`,
      handle({ params, body }) {
        const rows = rowsOf(params.app)
        const ids = (asBody(body).ids ?? []) as string[]
        if (ids.length !== rows.length || !rows.every((row) => ids.includes(row.id))) {
          throw mockError(400, 'invalid_order', 'The order must list every row')
        }
        const sorted = ids.map((id) => rows.find((row) => row.id === id)!)
        rows.splice(0, rows.length, ...sorted)
        return {}
      },
    })
  }

  if (options.hasVisible) {
    mockRoutes({
      method: 'PUT',
      match: `${base}/:id/visible`,
      handle({ params, body }) {
        const { rows, found } = find(params.app, params.id)
        const visible = asBody(body).visible
        if (typeof visible !== 'boolean') throw invalid({ visible: 'is required' })
        found.visible = visible
        const actions = options.actions(params.app)
        const action = visible ? actions.shown : actions.hidden
        if (action) log(params.app, 'update', action, found)
        return view(rows, found)
      },
    })
  }

  mockRoutes(
    {
      method: 'PUT',
      match: `${base}/:id`,
      handle({ params, body }) {
        const { rows, found } = find(params.app, params.id)
        Object.assign(found, options.build(asBody(body), params.app, found))
        log(params.app, 'update', options.actions(params.app).saved, found)
        return view(rows, found)
      },
    },
    {
      method: 'DELETE',
      match: `${base}/:id`,
      handle({ params }) {
        const { rows, found } = find(params.app, params.id)
        rows.splice(rows.indexOf(found), 1)
        log(params.app, 'delete', options.actions(params.app).deleted, found)
        return {}
      },
    },
  )
}
