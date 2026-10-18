import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** What a role may do on a page: nothing, look, or also create, change and delete. */
export type Access = 'none' | 'view' | 'manage'

/** Every page of the panel a role can open, in the sidebar's groups and order. */
export const PERMISSION_GROUPS: {
  title: TranslationKey
  sections: { key: string; label: TranslationKey; viewOnly?: boolean }[]
}[] = [
  {
    title: 'nav.dashboard',
    sections: [{ key: 'dashboard', label: 'nav.dashboard', viewOnly: true }],
  },
  {
    title: 'navGroup.sales',
    sections: [
      { key: 'applications', label: 'nav.applications', viewOnly: true },
      { key: 'customers', label: 'nav.customers' },
      { key: 'collections', label: 'nav.collections' },
    ],
  },
  {
    title: 'navGroup.partners',
    sections: [
      { key: 'merchants', label: 'nav.merchants' },
      { key: 'payouts', label: 'nav.payouts' },
      { key: 'reviews', label: 'nav.reviews' },
    ],
  },
  {
    title: 'navGroup.catalog',
    sections: [
      { key: 'products', label: 'nav.products', viewOnly: true },
      { key: 'categories', label: 'nav.categories' },
      { key: 'brands', label: 'nav.brands' },
    ],
  },
  { title: 'navGroup.rules', sections: [{ key: 'pricing', label: 'nav.pricing' }] },
  {
    title: 'navGroup.communication',
    sections: [
      { key: 'support', label: 'nav.support' },
      { key: 'quickReplies', label: 'nav.quickReplies' },
      { key: 'broadcasts', label: 'nav.broadcasts' },
      { key: 'faq', label: 'nav.faq' },
      { key: 'documents', label: 'nav.documents' },
    ],
  },
  {
    title: 'navGroup.system',
    sections: [
      { key: 'admins', label: 'nav.admins' },
      { key: 'roles', label: 'nav.roles' },
    ],
  },
]
export const SECTION_KEYS = PERMISSION_GROUPS.flatMap((group) => group.sections.map((s) => s.key))

/**
 * Actions that move money or reach many people. Each needs "Boshqarish" on its page and is
 * granted on its own on top of it.
 */
export const SPECIAL_ACTIONS = [
  { key: 'chargeCard', section: 'collections' },
  { key: 'manualPayment', section: 'collections' },
  { key: 'markPaid', section: 'payouts' },
  { key: 'blockClient', section: 'customers' },
  { key: 'sendBroadcast', section: 'broadcasts' },
  { key: 'publishDocument', section: 'documents' },
] as const
export type SpecialAction = (typeof SPECIAL_ACTIONS)[number]['key']

export type Role = {
  id: string
  name: string
  description: string
  access: Record<string, Access>
  actions: SpecialAction[]
  /** The owners' role: everything, cannot be changed or deleted. */
  system?: boolean
}

const VIEW_ONLY = PERMISSION_GROUPS.flatMap((g) => g.sections)
  .filter((s) => s.viewOnly)
  .map((s) => s.key)
// A page that only shows things never gets more than "Koʻrish"
const grant = (manage: string[], view: string[] = []) =>
  Object.fromEntries(
    SECTION_KEYS.map((key) => [
      key,
      manage.includes(key) && !VIEW_ONLY.includes(key)
        ? 'manage'
        : manage.includes(key) || view.includes(key)
          ? 'view'
          : 'none',
    ]),
  ) as Record<string, Access>

// The roles Birzum works with today. Replace with the API.
export const rolesStore = createStore<Role>([
  {
    id: 'owner',
    name: 'Bosh admin',
    description: 'Hamma narsa, rollar va adminlar ham.',
    access: grant(SECTION_KEYS),
    actions: SPECIAL_ACTIONS.map((a) => a.key),
    system: true,
  },
  {
    id: 'finance',
    name: 'Moliya',
    description: 'Klientlardan tushum, merchantlarga oʻtkazmalar, ustama.',
    access: grant(
      ['collections', 'payouts', 'pricing'],
      ['dashboard', 'applications', 'customers', 'merchants'],
    ),
    actions: ['chargeCard', 'manualPayment', 'markPaid'],
  },
  {
    id: 'collections',
    name: 'Undiruvchi',
    description: 'Qarzdorlar bilan ishlash: qoʻngʻiroq, eslatma, kartadan yechish.',
    access: grant(['collections'], ['applications', 'customers']),
    actions: ['chargeCard'],
  },
  {
    id: 'support',
    name: 'Operator',
    description: 'Yordam chatida klientlarga javob beradi.',
    access: grant(['support', 'quickReplies'], ['applications', 'customers', 'products', 'faq']),
    actions: [],
  },
  {
    id: 'content',
    name: 'Kontent menejer',
    description: 'Katalog, xabarnomalar, savol-javoblar, sharhlar.',
    access: grant(
      ['categories', 'brands', 'broadcasts', 'faq', 'reviews', 'quickReplies'],
      ['dashboard', 'products', 'merchants', 'documents'],
    ),
    actions: ['sendBroadcast'],
  },
])

/** How many pages a role can open, and how many of those it can also change. */
export const reachOf = (role: Role) => ({
  open: SECTION_KEYS.filter((key) => role.access[key] !== 'none').length,
  manage: SECTION_KEYS.filter((key) => role.access[key] === 'manage').length,
})
