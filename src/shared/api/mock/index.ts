import { ApiError, type RequestOptions } from '../client'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** One sample endpoint: `match` is the path with `:name` parts (`/admin/roles/:id`). */
export type MockRoute = {
  method: Method
  match: string
  handle: (req: {
    params: Record<string, string>
    query: Record<string, string>
    body: unknown
    form?: FormData
  }) => unknown
}

const routes: MockRoute[] = []

export const mockRoutes = (...list: MockRoute[]) => {
  routes.push(...list)
}

/** The sample backend's 404, 400 and the like, shaped as the real API's errors. */
export const mockError = (status: number, slug: string, message = slug) =>
  new ApiError({ status, slug, code: status, message })

function paramsOf(pattern: string, path: string) {
  const want = pattern.split('/')
  const got = path.split('/')
  if (want.length !== got.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = decodeURIComponent(got[i])
    else if (want[i] !== got[i]) return null
  }
  return params
}

/** Answers one `api()` call in the sample panel; a little delay so loading states still show. */
export async function mockApi(method: Method, path: string, options: RequestOptions) {
  await import('./routes')
  await new Promise((resolve) => setTimeout(resolve, 120))
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') query[key] = String(value)
  }
  for (const route of routes) {
    if (route.method !== method) continue
    const params = paramsOf(route.match, path)
    if (!params) continue
    // Copies, so a page never edits the sample store through the object it was given
    const data = await route.handle({ params, query, body: options.body, form: options.form })
    return data === undefined ? undefined : structuredClone(data)
  }
  throw mockError(404, 'not_found', `Sample panel: no ${method} ${path}`)
}
