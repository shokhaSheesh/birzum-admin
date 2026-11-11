import type { Workspace } from '@/shared/config/workspaces'
import type { TranslationKey } from '@/shared/i18n/dictionaries'

/** The four things a role may do on a page: see it, add, change, delete. */
export const OPS = ['read', 'create', 'update', 'delete'] as const
export type Op = (typeof OPS)[number]

/** Every page of the panel a role can open, in the sidebar's groups and order. */
const ALL = OPS

/**
 * Which page set a group belongs to: Birzum's, or the microloan brands' (Fortuna and Vodiy have
 * the same pages, so one set serves both).
 */
export type Scope = 'birzum' | 'microloans'
export const scopeOf = (workspace: Workspace): Scope =>
  workspace === 'birzum' ? 'birzum' : 'microloans'

export type Section = {
  key: string
  /** The page's full name, as the audit log shows it ("Mikroqarz arizalari"). */
  label: TranslationKey
  /** The name in a role's table, under its page set ("Arizalar"); `label` when not set. */
  short?: TranslationKey
  /** What the page lets anyone do at all; Arizalar, for one, only shows. */
  ops: readonly Op[]
}

export const PERMISSION_GROUPS: { scope: Scope; title: TranslationKey; sections: Section[] }[] = [
  {
    scope: 'birzum',
    title: 'nav.dashboard',
    sections: [
      { key: 'dashboard', label: 'nav.dashboard', ops: ['read'] },
      { key: 'analytics', label: 'nav.analytics', ops: ['read'] },
    ],
  },
  {
    scope: 'birzum',
    title: 'navGroup.sales',
    sections: [
      { key: 'applications', label: 'nav.applications', ops: ['read'] },
      { key: 'customers', label: 'nav.customers', ops: ['read', 'update'] },
      { key: 'collections', label: 'nav.collections', ops: ['read', 'create', 'update'] },
    ],
  },
  {
    scope: 'birzum',
    title: 'navGroup.partners',
    sections: [
      { key: 'merchants', label: 'nav.merchants', ops: ['read', 'update'] },
      { key: 'reviews', label: 'nav.reviews', ops: ['read', 'update', 'delete'] },
      { key: 'merchantRoles', label: 'nav.merchantRoles', ops: ['read', 'update'] },
    ],
  },
  {
    scope: 'birzum',
    title: 'navGroup.catalog',
    sections: [
      { key: 'products', label: 'nav.products', ops: ['read', 'update'] },
      { key: 'categories', label: 'nav.categories', ops: ALL },
      { key: 'brands', label: 'nav.brands', ops: ALL },
    ],
  },
  {
    scope: 'birzum',
    title: 'navGroup.rules',
    sections: [{ key: 'pricing', label: 'nav.pricing', ops: ['read'] }],
  },
  {
    scope: 'birzum',
    title: 'navGroup.communication',
    sections: [
      { key: 'support', label: 'nav.support', ops: ['read', 'update'] },
      { key: 'quickReplies', label: 'nav.quickReplies', ops: ALL },
      { key: 'broadcasts', label: 'nav.broadcasts', ops: ALL },
      { key: 'faq', label: 'nav.faq', ops: ALL },
      { key: 'onboarding', label: 'nav.onboarding', ops: ALL },
      { key: 'documents', label: 'nav.documents', ops: ['read', 'update'] },
    ],
  },
  {
    scope: 'birzum',
    title: 'navGroup.system',
    sections: [
      { key: 'admins', label: 'nav.admins', ops: ALL },
      { key: 'roles', label: 'nav.roles', ops: ALL },
      { key: 'audit', label: 'nav.audit', ops: ['read'] },
      { key: 'integrations', label: 'nav.integrations', ops: ALL },
    ],
  },
  {
    scope: 'microloans',
    title: 'nav.dashboard',
    sections: [
      { key: 'mlDashboard', label: 'nav.mlDashboard', short: 'nav.dashboard', ops: ['read'] },
    ],
  },
  {
    scope: 'microloans',
    title: 'navGroup.loans',
    sections: [
      {
        key: 'mlApplications',
        label: 'nav.mlApplications',
        short: 'nav.applications',
        ops: ['read', 'update'],
      },
      { key: 'mlLoans', label: 'nav.mlLoans', short: 'nav.loans', ops: ['read'] },
      {
        key: 'mlPayments',
        label: 'nav.mlPayments',
        short: 'nav.loanPayments',
        ops: ['read', 'create'],
      },
      { key: 'mlOverdue', label: 'nav.mlOverdue', short: 'nav.overdue', ops: ['read', 'update'] },
      { key: 'mlClients', label: 'nav.mlClients', short: 'nav.borrowers', ops: ['read', 'update'] },
    ],
  },
  {
    scope: 'microloans',
    title: 'navGroup.rules',
    sections: [
      { key: 'mlProducts', label: 'nav.mlProducts', short: 'nav.products', ops: ALL },
      {
        key: 'mlPayDay',
        label: 'nav.mlPayDay',
        short: 'nav.payDay',
        ops: ['read', 'update'],
      },
    ],
  },
  {
    scope: 'microloans',
    title: 'navGroup.communication',
    sections: [
      { key: 'mlSupport', label: 'nav.mlSupport', short: 'nav.support', ops: ['read', 'update'] },
      { key: 'mlReplies', label: 'nav.mlReplies', short: 'nav.quickReplies', ops: ALL },
      { key: 'mlBroadcasts', label: 'nav.mlBroadcasts', short: 'nav.broadcasts', ops: ALL },
      { key: 'mlFaq', label: 'nav.mlFaq', short: 'nav.faq', ops: ALL },
      { key: 'mlOnboarding', label: 'nav.mlOnboarding', short: 'nav.onboarding', ops: ALL },
      {
        key: 'mlDocuments',
        label: 'nav.mlDocuments',
        short: 'nav.documents',
        ops: ['read', 'update'],
      },
      { key: 'mlContacts', label: 'nav.mlContacts', short: 'nav.contacts', ops: ALL },
    ],
  },
]
export const SECTIONS = PERMISSION_GROUPS.flatMap((group) => group.sections)
export const SECTION_KEYS = SECTIONS.map((s) => s.key)
export const opsOf = (key: string) => SECTIONS.find((s) => s.key === key)!.ops
/** The page keys of the page sets a role's businesses need. */
export const keysFor = (brands: Workspace[]) => {
  const scopes = new Set(brands.map(scopeOf))
  return PERMISSION_GROUPS.filter((group) => scopes.has(group.scope)).flatMap((group) =>
    group.sections.map((section) => section.key),
  )
}

/**
 * Actions that move money or reach many people. Each needs one permission on its page
 * (e.g. Yaratish on Toʻlovlar va qarzlar) and is granted on its own on top of it.
 */
export const SPECIAL_ACTIONS = [
  { key: 'chargeCard', section: 'collections', op: 'create' },
  { key: 'blockClient', section: 'customers', op: 'update' },
  { key: 'viewPinfl', section: 'customers', op: 'read' },
  { key: 'sendBroadcast', section: 'broadcasts', op: 'create' },
  { key: 'mlBlockClient', section: 'mlClients', op: 'update' },
  { key: 'mlSendBroadcast', section: 'mlBroadcasts', op: 'create' },
  { key: 'mlPauseIntake', section: 'mlApplications', op: 'update' },
] as const
export type SpecialAction = (typeof SPECIAL_ACTIONS)[number]['key']

/**
 * A set of permissions for some businesses. Fortuna and Vodiy share their pages, so one role can
 * serve both, or all three; an admin gets a role per business they work in.
 */
export type Role = {
  id: string
  name: string
  description: string
  /** The businesses it can be given for; its table has the pages they need. */
  brands: Workspace[]
  /** What it may do on each page; an empty list hides the page. */
  access: Record<string, Op[]>
  actions: SpecialAction[]
  /** The owners' role: everything, cannot be changed or deleted. */
  system?: boolean
  /** How many admins hold it. */
  holders?: number
}

/**
 * How many pages a role can open, and on how many it can also add, change or delete, within the
 * page sets of its businesses.
 */
export const reachOf = (access: Record<string, Op[]>, brands: Workspace[]) => {
  const keys = keysFor(brands)
  return {
    open: keys.filter((key) => access[key]?.includes('read')).length,
    manage: keys.filter((key) => access[key]?.some((op) => op !== 'read')).length,
  }
}

/** The sensitive actions a role's businesses can have. */
export const actionsFor = (brands: Workspace[]) => {
  const keys = keysFor(brands)
  return SPECIAL_ACTIONS.filter((action) => keys.includes(action.section))
}
