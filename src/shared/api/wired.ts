import type { TranslationKey } from '@/shared/i18n/dictionaries'

/**
 * Which pages talk to the staging backend and which still show sample data. The "API holati" page
 * lists this, and the other pages carry a "Namuna maʼlumot" badge in their header.
 */
export type WiredPage = {
  /** The page's menu name. */
  label: TranslationKey
  /** Path within a business (`/faq`); microloan brands use the same path under /fortuna or /vodiy. */
  path: string
  scope: 'birzum' | 'ml'
  /** Admin doc section. */
  section: string
  endpoints: string
}

export const WIRED_PAGES: WiredPage[] = [
  {
    label: 'nav.admins',
    path: '/admins',
    scope: 'birzum',
    section: '5.1',
    endpoints: 'GET/POST/PUT/DELETE /admin/admins',
  },
  {
    label: 'nav.roles',
    path: '/roles',
    scope: 'birzum',
    section: '5.2',
    endpoints: 'GET/POST/PUT/DELETE /admin/roles',
  },
  {
    label: 'nav.audit',
    path: '/audit',
    scope: 'birzum',
    section: '5.3',
    endpoints: 'GET /admin/audit',
  },
  {
    label: 'nav.categories',
    path: '/categories',
    scope: 'birzum',
    section: '5.4',
    endpoints: '/admin/categories (+ /order, /:id/visible)',
  },
  {
    label: 'nav.brands',
    path: '/brands',
    scope: 'birzum',
    section: '5.5',
    endpoints: '/admin/brands',
  },
  {
    label: 'nav.faq',
    path: '/faq',
    scope: 'birzum',
    section: '5.6',
    endpoints: '/admin/apps/birzum/faq, /admin/apps/birzum/contacts',
  },
  {
    label: 'nav.documents',
    path: '/documents',
    scope: 'birzum',
    section: '5.7',
    endpoints: '/admin/apps/birzum/documents, POST /admin/files',
  },
  {
    label: 'nav.onboarding',
    path: '/onboarding',
    scope: 'birzum',
    section: '5.8, 5.9',
    endpoints: '/admin/apps/birzum/slides, /banners',
  },
  {
    label: 'nav.reviews',
    path: '/reviews',
    scope: 'birzum',
    section: '5.13',
    endpoints: '/admin/reviews (+ hide, restore)',
  },
  {
    label: 'nav.products',
    path: '/products',
    scope: 'birzum',
    section: '5.14',
    endpoints: '/admin/products (+ approve, reject)',
  },
  {
    label: 'nav.quickReplies',
    path: '/quick-replies',
    scope: 'birzum',
    section: '5.15',
    endpoints: '/admin/apps/birzum/quick-replies',
  },
  {
    label: 'nav.merchantRoles',
    path: '/merchant-roles',
    scope: 'birzum',
    section: '5.16',
    endpoints: 'GET/PUT /admin/merchant-roles',
  },
  {
    label: 'nav.integrations',
    path: '/integrations',
    scope: 'birzum',
    section: '5.11b',
    endpoints: '/admin/settings/geo/keys',
  },
  {
    label: 'nav.faq',
    path: '/faq',
    scope: 'ml',
    section: '5.6',
    endpoints: '/admin/apps/{fortuna|vodiy}/faq',
  },
  {
    label: 'nav.documents',
    path: '/documents',
    scope: 'ml',
    section: '5.7',
    endpoints: '/admin/apps/{fortuna|vodiy}/documents',
  },
  {
    label: 'nav.onboarding',
    path: '/onboarding',
    scope: 'ml',
    section: '5.8, 5.9',
    endpoints: '/admin/apps/{fortuna|vodiy}/slides, /banners',
  },
  {
    label: 'nav.appHome',
    path: '/app-home',
    scope: 'ml',
    section: '5.10',
    endpoints: '/admin/apps/{fortuna|vodiy}/menu, /tiles',
  },
  {
    label: 'nav.contacts',
    path: '/contacts',
    scope: 'ml',
    section: '5.11, 5.11a',
    endpoints: '/admin/apps/{fortuna|vodiy}/contacts, /branches, /admin/geo/suggest, /resolve',
  },
  {
    label: 'nav.quickReplies',
    path: '/quick-replies',
    scope: 'ml',
    section: '5.15',
    endpoints: '/admin/apps/{fortuna|vodiy}/quick-replies',
  },
  {
    label: 'nav.payDay',
    path: '/pay-day',
    scope: 'ml',
    section: '5.11d',
    endpoints: '/admin/apps/{fortuna|vodiy}/pay-day, /pay-day/history',
  },
  {
    label: 'nav.support',
    path: '/support',
    scope: 'ml',
    section: '5.15a',
    endpoints:
      '/admin/apps/{fortuna|vodiy}/chats (+ take, assign, messages, close, reopen, read), /chat-topics',
  },
]

const BRAND_PREFIX = /^\/(fortuna|vodiy)(?=\/|$)/

/** True when the page at this path is wired to the backend (detail pages count with their list). */
export function isWiredPath(pathname: string) {
  const ml = BRAND_PREFIX.test(pathname)
  const path = pathname.replace(BRAND_PREFIX, '') || '/'
  if (path === '/login' || path === '/api-status') return true
  const base = `/${path.split('/')[1] ?? ''}`
  return WIRED_PAGES.some((page) => page.scope === (ml ? 'ml' : 'birzum') && page.path === base)
}
