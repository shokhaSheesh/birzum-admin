import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/**
 * What a merchant app user can be allowed to do, by the app's sections. The same keys the
 * merchant app checks before showing a screen or a button.
 */
export type MerchantPermission =
  'clients' | 'approve' | 'status' | 'products' | 'inventory' | 'locations' | 'staff' | 'analytics'

export const MERCHANT_PERMISSION_GROUPS: {
  title: TranslationKey
  permissions: MerchantPermission[]
}[] = [
  { title: 'mrole.group.sales', permissions: ['clients', 'approve', 'status'] },
  { title: 'mrole.group.catalog', permissions: ['products', 'inventory'] },
  { title: 'mrole.group.shop', permissions: ['locations', 'staff'] },
  { title: 'mrole.group.reports', permissions: ['analytics'] },
]
export const MERCHANT_PERMISSIONS = MERCHANT_PERMISSION_GROUPS.flatMap((g) => g.permissions)

/**
 * The two roles FlexSoft gives merchant staff at sign-in. They are fixed: Birzum only decides
 * what each one may do in the merchant app.
 */
export type MerchantRole = { id: 'admin' | 'seller'; permissions: MerchantPermission[] }

// Sample settings. Replace with the API.
export const merchantRolesStore = createStore<MerchantRole>([
  { id: 'admin', permissions: [...MERCHANT_PERMISSIONS] },
  { id: 'seller', permissions: ['clients', 'approve', 'status', 'inventory'] },
])
