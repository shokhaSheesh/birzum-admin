import { OPS, type Op } from '@/entities/admins/roles'
import type { TranslationKey } from '@/shared/i18n/dictionaries'

/**
 * The merchant app's pages a role can be allowed on. Bosh sahifa, Bildirishnomalar and Profil are
 * open to every member, so they are not here. The same keys the merchant app checks, as
 * "<page>.<op>" (products.create), before showing a screen or a button.
 */
export type MerchantPage =
  | 'clients'
  | 'applications'
  | 'calculator'
  | 'products'
  | 'attributes'
  | 'inventory'
  | 'locations'
  | 'staff'
  | 'reviews'
  | 'analytics'

const ALL = OPS

/** Each page with what it lets anyone do at all, in the app's groups and order. */
export const MERCHANT_PAGE_GROUPS: {
  title: TranslationKey
  pages: { key: MerchantPage; ops: readonly Op[] }[]
}[] = [
  {
    title: 'mrole.group.sales',
    pages: [
      { key: 'clients', ops: ['read', 'create', 'update'] },
      { key: 'applications', ops: ['read', 'create', 'update'] },
      { key: 'calculator', ops: ['read'] },
    ],
  },
  {
    title: 'mrole.group.catalog',
    pages: [
      { key: 'products', ops: ALL },
      { key: 'attributes', ops: ALL },
      { key: 'inventory', ops: ['read', 'update'] },
    ],
  },
  {
    title: 'mrole.group.shop',
    pages: [
      { key: 'locations', ops: ALL },
      { key: 'staff', ops: ALL },
      { key: 'reviews', ops: ['read', 'update'] },
    ],
  },
  { title: 'mrole.group.reports', pages: [{ key: 'analytics', ops: ['read'] }] },
]
export const MERCHANT_PAGES = MERCHANT_PAGE_GROUPS.flatMap((g) => g.pages)

export type MerchantAccess = Record<MerchantPage, Op[]>

/**
 * The two roles FlexSoft gives merchant staff at sign-in. They are fixed: Birzum only decides
 * what each one may do on each page of the merchant app.
 */
export type MerchantRole = { id: 'admin' | 'seller'; access: MerchantAccess }

/** "clients.read", "clients.create"… into what the role may do on each page, in OPS order. */
export const accessOf = (permissions: string[]): MerchantAccess =>
  Object.fromEntries(
    MERCHANT_PAGES.map((page) => [
      page.key,
      page.ops.filter((op) => permissions.includes(`${page.key}.${op}`)),
    ]),
  ) as MerchantAccess

/** The keys the backend stores, in the catalog's order. */
export const permissionsOf = (access: MerchantAccess): string[] =>
  MERCHANT_PAGES.flatMap((page) =>
    page.ops.filter((op) => access[page.key].includes(op)).map((op) => `${page.key}.${op}`),
  )
