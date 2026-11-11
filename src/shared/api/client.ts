import { isDemo } from './demo'
import { getTokens, setTokens, type Tokens } from './tokens'

/** Same origin: Vite's dev proxy and Vercel's rewrite send /api to the staging backend. */
const BASE = '/api/v1'

/** What the backend answers with when a call fails: `{ error: { slug, code, message, details } }`. */
export class ApiError extends Error {
  status: number
  slug: string
  code: number
  details?: Record<string, unknown>
  requestId?: string

  constructor(init: {
    status: number
    slug: string
    code: number
    message: string
    details?: Record<string, unknown>
    requestId?: string
  }) {
    super(init.message)
    this.status = init.status
    this.slug = init.slug
    this.code = init.code
    this.details = init.details
    this.requestId = init.requestId
  }
}

type Envelope = {
  success?: boolean
  data?: unknown
  error?: { slug?: string; code?: number; message?: string; details?: Record<string, unknown> }
  meta?: { request_id?: string }
}

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  /** A multipart upload; the browser sets its Content-Type. */
  form?: FormData
  /** Login and refresh carry no token. */
  anonymous?: boolean
}

const lang = () => (document.documentElement.lang === 'ru' ? 'ru' : 'uz')

/** Called when the refresh token is refused: the panel signs the admin out. */
let onSignedOut: () => void = () => {}
export const setSignedOutHandler = (handler: () => void) => {
  onSignedOut = handler
}

function url(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE}${path}${qs ? `?${qs}` : ''}`
}

async function send(method: string, path: string, options: RequestOptions, access?: string) {
  const headers: Record<string, string> = { 'X-App': 'admin', 'Accept-Language': lang() }
  if (access) headers.Authorization = `Bearer ${access}`
  let body: BodyInit | undefined
  if (options.form) body = options.form
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }
  let res: Response
  try {
    res = await fetch(url(path, options.query), { method, headers, body })
  } catch {
    throw new ApiError({ status: 0, slug: 'network', code: 0, message: 'Network error' })
  }
  let json: Envelope = {}
  try {
    json = (await res.json()) as Envelope
  } catch {
    // Not JSON (a proxy error page, say); the status below says enough
  }
  if (!res.ok || json.success === false) {
    const error = json.error ?? {}
    throw new ApiError({
      status: res.status,
      slug: error.slug ?? 'internal_error',
      code: error.code ?? res.status,
      message: error.message ?? `HTTP ${res.status}`,
      details: error.details,
      requestId: json.meta?.request_id,
    })
  }
  return json.data
}

/** One refresh at a time: the old refresh token dies the moment a new one is issued. */
let refreshing: Promise<boolean> | null = null

type TokenData = {
  access_token: string
  access_expires_at: string
  refresh_token: string
  refresh_expires_at: string
}

export const tokensOf = (data: TokenData): Tokens => ({
  access: data.access_token,
  accessExpiresAt: data.access_expires_at,
  refresh: data.refresh_token,
  refreshExpiresAt: data.refresh_expires_at,
})

function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const tokens = getTokens()
    if (!tokens) return false
    try {
      const data = (await send(
        'POST',
        '/auth/staff/refresh',
        { body: { refresh_token: tokens.refresh } },
        undefined,
      )) as TokenData
      setTokens(tokensOf(data))
      return true
    } catch (e) {
      // Only a refused token ends the session; a 503 or a dropped connection does not
      if (e instanceof ApiError && (e.status === 401 || e.slug === 'staff_inactive')) {
        setTokens(null)
        onSignedOut()
      }
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** Calls the backend and returns the envelope's `data`; a failure throws an ApiError. */
export async function api<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // The sample panel never reaches the network
  if (isDemo()) return (await import('./mock').then((m) => m.mockApi(method, path, options))) as T
  if (options.anonymous) return (await send(method, path, options)) as T
  const tokens = getTokens()
  try {
    return (await send(method, path, options, tokens?.access)) as T
  } catch (e) {
    if (!(e instanceof ApiError) || e.slug !== 'unauthorized' || !tokens) throw e
    if (!(await refreshTokens())) throw e
    return (await send(method, path, options, getTokens()?.access)) as T
  }
}

export const apiGet = <T>(path: string, query?: RequestOptions['query']) =>
  api<T>('GET', path, { query })
export const apiPost = <T>(path: string, body?: unknown) => api<T>('POST', path, { body })
export const apiPut = <T>(path: string, body?: unknown) => api<T>('PUT', path, { body })
export const apiDelete = <T>(path: string) => api<T>('DELETE', path)
