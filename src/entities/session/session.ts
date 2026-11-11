import { useSyncExternalStore } from 'react'
import { api, setSignedOutHandler, tokensOf } from '@/shared/api/client'
import { getTokens, setTokens } from '@/shared/api/tokens'
import type { Workspace } from '@/shared/config/workspaces'

/** One business the admin works in, with what their role there allows (`faq.update`, `chargeCard`...). */
export type Membership = {
  company_id: string
  company_code: Workspace
  company_name: string
  role_name: string
  permissions: string[]
}

type Staff = {
  id: string
  login: string
  first_name: string
  last_name: string
  phone: string
  email: string
  last_login_at: string
}

type MeData = { staff: Staff; must_change_password: boolean; memberships: Membership[] }

/** The admin who is signed in. */
export type Admin = {
  id: string
  name: string
  username: string
  initials: string
  memberships: Membership[]
  /** The password was set by someone else; only the change-password screen opens until it is changed. */
  mustChangePassword: boolean
  /** The sample panel: no backend, no sign-in, only the pages that still run on sample data. */
  demo?: boolean
}

type State = { status: 'out' | 'loading' | 'in'; admin: Admin | null }

const adminOf = (me: MeData): Admin => {
  const name = `${me.staff.first_name} ${me.staff.last_name}`.trim() || me.staff.login
  return {
    id: me.staff.id,
    name,
    username: me.staff.login,
    initials: name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase(),
    memberships: me.memberships,
    mustChangePassword: me.must_change_password,
  }
}

const DEMO_KEY = 'birzum-admin.demo'

const demoMembership = (company_code: Workspace, company_name: string): Membership => ({
  company_id: company_code,
  company_code,
  company_name,
  role_name: 'Namuna',
  permissions: [],
})

/** The sample panel's admin: every business, every page (`hasPermission` lets a demo admin through). */
const DEMO_ADMIN: Admin = {
  id: 'demo',
  name: 'Namuna admin',
  username: 'demo',
  initials: 'NA',
  memberships: [
    demoMembership('birzum', 'Birzum'),
    demoMembership('fortuna', 'Fortuna Biznes'),
    demoMembership('vodiy', 'Vodiy Taraqqiyot'),
  ],
  mustChangePassword: false,
  demo: true,
}

const demoStored = () => {
  try {
    return sessionStorage.getItem(DEMO_KEY) === '1'
  } catch {
    return false
  }
}

const storeDemo = (on: boolean) => {
  try {
    if (on) sessionStorage.setItem(DEMO_KEY, '1')
    else sessionStorage.removeItem(DEMO_KEY)
  } catch {
    // Private mode: the sample panel lasts until the page is reloaded
  }
}

let state: State = demoStored()
  ? { status: 'in', admin: DEMO_ADMIN }
  : { status: getTokens() ? 'loading' : 'out', admin: null }
const listeners = new Set<() => void>()
const set = (next: State) => {
  state = next
  listeners.forEach((listener) => listener())
}

/** Reads `GET /admin/me`: who is signed in, and what each of their roles may do. */
async function loadMe() {
  const me = await api<MeData>('GET', '/admin/me')
  set({ status: 'in', admin: adminOf(me) })
}

setSignedOutHandler(() => set({ status: 'out', admin: null }))

// A page refresh keeps the tokens (sessionStorage): find out who they belong to
if (state.status === 'loading') {
  loadMe().catch((e: { status?: number }) => {
    // A network or 5xx failure does not mean the tokens are bad, but there is no panel without `me`
    if (e.status === 401 || e.status === 403) setTokens(null)
    set({ status: 'out', admin: null })
  })
}

type LoginData = Parameters<typeof tokensOf>[0] & { must_change_password: boolean }

export const session = {
  /** Signs in with the staff login; the tokens are kept, then `me` is read for the memberships. */
  async signIn(login: string, password: string) {
    const data = await api<LoginData>('POST', '/auth/staff/login', {
      anonymous: true,
      body: { login, password },
    })
    setTokens(tokensOf(data))
    await loadMe()
  },
  /** Opens the sample panel: no sign-in, sample data only, kept for this tab. */
  enterDemo() {
    storeDemo(true)
    set({ status: 'in', admin: DEMO_ADMIN })
  },
  /** Re-reads `me`, e.g. after the password was changed or a role was edited. */
  refresh: loadMe,
  async signOut() {
    if (state.admin?.demo) {
      storeDemo(false)
      set({ status: 'out', admin: null })
      return
    }
    try {
      await api('POST', '/admin/auth/logout')
    } catch {
      // The tokens go either way
    }
    setTokens(null)
    set({ status: 'out', admin: null })
  },
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The signed-in admin, outside React. */
export const getAdmin = () => state.admin

/** The signed-in admin; null while signed out or while `me` is still loading. */
export const useAdmin = () => useSyncExternalStore(subscribe, () => state.admin)

export const useSessionStatus = () => useSyncExternalStore(subscribe, () => state.status)

/** True when the admin's role in that business has the permission, e.g. `can('birzum', 'faq.update')`. */
export const hasPermission = (admin: Admin | null, company: Workspace, code: string) =>
  !!admin?.demo ||
  !!admin?.memberships.find((m) => m.company_code === company)?.permissions.includes(code)

/** `can(company, code)` for the current admin. The backend still checks every call; this only hides buttons. */
export function useCan() {
  const admin = useAdmin()
  return (company: Workspace, code: string) => hasPermission(admin, company, code)
}
