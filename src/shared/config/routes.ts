export const ROUTES = {
  login: '/login',
  dashboard: '/',
  applications: '/applications',
  customers: '/customers',
  collections: '/collections',
  merchants: '/merchants',
  payouts: '/payouts',
  products: '/products',
  reviews: '/reviews',
  merchantNew: '/merchants/new',
  merchant: '/merchants/:id',
  merchantEdit: '/merchants/:id/edit',
  categories: '/categories',
  brands: '/brands',
  pricing: '/pricing',
  scoring: '/scoring',
  support: '/support',
  broadcasts: '/broadcasts',
  faq: '/faq',
  documents: '/documents',
  admins: '/admins',
} as const

/** A merchant's detail page. */
export const merchantPath = (id: string) => `/merchants/${id}`
/** A merchant's edit form. */
export const merchantEditPath = (id: string) => `/merchants/${id}/edit`
