export const ROUTES = {
  login: '/login',
  dashboard: '/',
  applications: '/applications',
  application: '/applications/:id',
  customers: '/customers',
  customer: '/customers/:id',
  collections: '/collections',
  merchants: '/merchants',
  payouts: '/payouts',
  payoutNew: '/payouts/new',
  payout: '/payouts/:id',
  products: '/products',
  product: '/products/:id',
  reviews: '/reviews',
  merchantNew: '/merchants/new',
  merchant: '/merchants/:id',
  merchantEdit: '/merchants/:id/edit',
  categories: '/categories',
  brands: '/brands',
  pricing: '/pricing',
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

/** A product's read-only detail page. */
export const productPath = (id: string) => `/products/${id}`

/** A new payout, optionally for one merchant with its owed sales picked. */
export const newPayoutPath = (merchantId?: string) =>
  merchantId ? `/payouts/new?merchant=${merchantId}` : '/payouts/new'
/** A payout's detail page. */
export const payoutPath = (id: string) => `/payouts/${id}`

/** An ariza's read-only detail page. */
export const applicationPath = (id: string) => `/applications/${id}`

/** A shopper's detail page. */
export const clientPath = (id: string) => `/customers/${id}`
