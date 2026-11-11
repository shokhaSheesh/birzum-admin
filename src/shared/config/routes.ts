import type { Workspace } from './workspaces'

export const ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  dashboard: '/',
  analytics: '/analytics',
  applications: '/applications',
  application: '/applications/:id',
  customers: '/customers',
  customer: '/customers/:id',
  collections: '/collections',
  merchants: '/merchants',
  products: '/products',
  product: '/products/:id',
  reviews: '/reviews',
  merchantRoles: '/merchant-roles',
  merchant: '/merchants/:id',
  categories: '/categories',
  brands: '/brands',
  pricing: '/pricing',
  support: '/support',
  quickReplies: '/quick-replies',
  broadcasts: '/broadcasts',
  broadcastNew: '/broadcasts/new',
  broadcast: '/broadcasts/:id',
  broadcastEdit: '/broadcasts/:id/edit',
  faq: '/faq',
  onboarding: '/onboarding',
  documents: '/documents',
  admins: '/admins',
  roles: '/roles',
  roleNew: '/roles/new',
  roleEdit: '/roles/:id/edit',
  audit: '/audit',
} as const

/** A merchant's detail page. */
export const merchantPath = (id: string) => `/merchants/${id}`
/** A merchant's edit form. */

/** A product's read-only detail page. */
export const productPath = (id: string) => `/products/${id}`

/** An ariza's read-only detail page. */
export const applicationPath = (id: string) => `/applications/${id}`

/** A shopper's detail page. */
export const clientPath = (id: string) => `/customers/${id}`

/** Xabarnomalar of Birzum or of a microloan brand. */
export const broadcastsPath = (app: Workspace = 'birzum') =>
  app === 'birzum' ? ROUTES.broadcasts : `/${app}/broadcasts`
export const broadcastNewPath = (app: Workspace = 'birzum') => `${broadcastsPath(app)}/new`
/** A broadcast's detail page. */
export const broadcastPath = (id: string, app: Workspace = 'birzum') =>
  `${broadcastsPath(app)}/${id}`
/** A draft or scheduled broadcast's form. */
export const broadcastEditPath = (id: string, app: Workspace = 'birzum') =>
  `${broadcastsPath(app)}/${id}/edit`

/** A new role, optionally filled from another one. */
export const roleNewPath = (from?: string) => (from ? `/roles/new?from=${from}` : '/roles/new')
/** A role's form. */
export const roleEditPath = (id: string) => `/roles/${id}/edit`
