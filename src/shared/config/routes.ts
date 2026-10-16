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
  merchant: '/merchants/:id',
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

/** A merchant's form. Pass "new" as the id to create one. */
export const merchantPath = (id: string) => `/merchants/${id}`
