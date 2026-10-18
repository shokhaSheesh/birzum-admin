import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The four things a role may do on a page: see it, add, change, delete. */
export const OPS = ['read', 'create', 'update', 'delete'] as const
export type Op = (typeof OPS)[number]

/** Every page of the panel a role can open, in the sidebar's groups and order. */
const ALL = OPS

export const PERMISSION_GROUPS: {
  title: TranslationKey
  /** `ops`: what the page lets anyone do at all; Arizalar, for one, only shows. */
  sections: { key: string; label: TranslationKey; ops: readonly Op[] }[]
}[] = [
  {
    title: 'nav.dashboard',
    sections: [{ key: 'dashboard', label: 'nav.dashboard', ops: ['read'] }],
  },
  {
    title: 'navGroup.sales',
    sections: [
      { key: 'applications', label: 'nav.applications', ops: ['read'] },
      { key: 'customers', label: 'nav.customers', ops: ['read', 'update'] },
      { key: 'collections', label: 'nav.collections', ops: ['read', 'create', 'update'] },
    ],
  },
  {
    title: 'navGroup.partners',
    sections: [
      { key: 'merchants', label: 'nav.merchants', ops: ALL },
      { key: 'payouts', label: 'nav.payouts', ops: ALL },
      { key: 'reviews', label: 'nav.reviews', ops: ['read', 'update', 'delete'] },
    ],
  },
  {
    title: 'navGroup.catalog',
    sections: [
      { key: 'products', label: 'nav.products', ops: ['read'] },
      { key: 'categories', label: 'nav.categories', ops: ALL },
      { key: 'brands', label: 'nav.brands', ops: ALL },
    ],
  },
  { title: 'navGroup.rules', sections: [{ key: 'pricing', label: 'nav.pricing', ops: ALL }] },
  {
    title: 'navGroup.communication',
    sections: [
      { key: 'support', label: 'nav.support', ops: ['read', 'update'] },
      { key: 'quickReplies', label: 'nav.quickReplies', ops: ALL },
      { key: 'broadcasts', label: 'nav.broadcasts', ops: ALL },
      { key: 'faq', label: 'nav.faq', ops: ALL },
      { key: 'documents', label: 'nav.documents', ops: ['read', 'update'] },
    ],
  },
  {
    title: 'navGroup.system',
    sections: [
      { key: 'admins', label: 'nav.admins', ops: ALL },
      { key: 'roles', label: 'nav.roles', ops: ALL },
      { key: 'audit', label: 'nav.audit', ops: ['read'] },
    ],
  },
]
export const SECTIONS = PERMISSION_GROUPS.flatMap((group) => group.sections)
export const SECTION_KEYS = SECTIONS.map((s) => s.key)
export const opsOf = (key: string) => SECTIONS.find((s) => s.key === key)!.ops

/**
 * Actions that move money or reach many people. Each needs one permission on its page
 * (e.g. Yaratish on Toʻlovlar va qarzlar) and is granted on its own on top of it.
 */
export const SPECIAL_ACTIONS = [
  { key: 'chargeCard', section: 'collections', op: 'create' },
  { key: 'manualPayment', section: 'collections', op: 'create' },
  { key: 'markPaid', section: 'payouts', op: 'update' },
  { key: 'blockClient', section: 'customers', op: 'update' },
  { key: 'sendBroadcast', section: 'broadcasts', op: 'create' },
] as const
export type SpecialAction = (typeof SPECIAL_ACTIONS)[number]['key']

export type Role = {
  id: string
  name: string
  description: string
  /** What it may do on each page; an empty list hides the page. */
  access: Record<string, Op[]>
  actions: SpecialAction[]
  /** The owners' role: everything, cannot be changed or deleted. */
  system?: boolean
}

/** Full rights on `manage` pages (whatever each page offers), Koʻrish only on `view` ones. */
const grant = (manage: string[], view: string[] = []) =>
  Object.fromEntries(
    SECTION_KEYS.map((key) => [
      key,
      manage.includes(key) ? [...opsOf(key)] : view.includes(key) ? ['read'] : [],
    ]),
  ) as Record<string, Op[]>

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

/** How many pages a role can open, and on how many it can also add, change or delete. */
export const reachOf = (access: Record<string, Op[]>) => ({
  open: SECTION_KEYS.filter((key) => access[key]?.includes('read')).length,
  manage: SECTION_KEYS.filter((key) => access[key]?.some((op) => op !== 'read')).length,
})
