import {
  BadgePercent,
  Banknote,
  CircleAlert,
  FileSignature,
  MapPin,
  Scale,
  FileText,
  FolderTree,
  GalleryHorizontal,
  HandCoins,
  History,
  KeyRound,
  Headset,
  LayoutDashboard,
  Megaphone,
  MessageCircleQuestion,
  MessageSquareText,
  Package,
  ReceiptText,
  ShieldCheck,
  Star,
  Store,
  Tags,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/shared/config/routes'
import { brandPath, type Brand, type Workspace } from '@/shared/config/workspaces'
import type { TranslationKey } from '@/shared/i18n/dictionaries'

export type NavItem = {
  to: string
  icon: LucideIcon
  label: TranslationKey
  /** What the page is for, shown on its placeholder until it is designed. */
  about: TranslationKey
  /** A count beside the label, e.g. unread chats. Sample value. */
  badge?: number
}

export type NavGroup = { title?: TranslationKey; items: NavItem[] }

/** The sidebar, top to bottom. Pages are grouped by who they are about. */
export const NAV: NavGroup[] = [
  {
    items: [
      {
        to: ROUTES.dashboard,
        icon: LayoutDashboard,
        label: 'nav.dashboard',
        about: 'about.dashboard',
      },
    ],
  },
  {
    title: 'navGroup.sales',
    items: [
      {
        to: ROUTES.applications,
        icon: ReceiptText,
        label: 'nav.applications',
        about: 'about.applications',
      },
      { to: ROUTES.customers, icon: Users, label: 'nav.customers', about: 'about.customers' },
      {
        to: ROUTES.collections,
        icon: Wallet,
        label: 'nav.collections',
        about: 'about.collections',
      },
    ],
  },
  {
    title: 'navGroup.partners',
    items: [
      { to: ROUTES.merchants, icon: Store, label: 'nav.merchants', about: 'about.merchants' },
      { to: ROUTES.payouts, icon: HandCoins, label: 'nav.payouts', about: 'about.payouts' },
      { to: ROUTES.reviews, icon: Star, label: 'nav.reviews', about: 'about.reviews' },
      {
        to: ROUTES.merchantRoles,
        icon: UserCog,
        label: 'nav.merchantRoles',
        about: 'about.merchantRoles',
      },
    ],
  },
  {
    title: 'navGroup.catalog',
    items: [
      { to: ROUTES.products, icon: Package, label: 'nav.products', about: 'about.products' },
      {
        to: ROUTES.categories,
        icon: FolderTree,
        label: 'nav.categories',
        about: 'about.categories',
      },
      { to: ROUTES.brands, icon: Tags, label: 'nav.brands', about: 'about.brands' },
    ],
  },
  {
    title: 'navGroup.rules',
    items: [
      { to: ROUTES.pricing, icon: BadgePercent, label: 'nav.pricing', about: 'about.pricing' },
    ],
  },
  {
    title: 'navGroup.communication',
    items: [
      { to: ROUTES.support, icon: Headset, label: 'nav.support', about: 'about.support' },
      {
        to: ROUTES.quickReplies,
        icon: MessageSquareText,
        label: 'nav.quickReplies',
        about: 'about.quickReplies',
      },
      {
        to: ROUTES.broadcasts,
        icon: Megaphone,
        label: 'nav.broadcasts',
        about: 'about.broadcasts',
      },
      { to: ROUTES.faq, icon: MessageCircleQuestion, label: 'nav.faq', about: 'about.faq' },
      {
        to: ROUTES.onboarding,
        icon: GalleryHorizontal,
        label: 'nav.onboarding',
        about: 'about.onboarding',
      },
      { to: ROUTES.documents, icon: FileText, label: 'nav.documents', about: 'about.documents' },
    ],
  },
  {
    title: 'navGroup.system',
    items: [
      { to: ROUTES.admins, icon: ShieldCheck, label: 'nav.admins', about: 'about.admins' },
      { to: ROUTES.roles, icon: KeyRound, label: 'nav.roles', about: 'about.roles' },
      { to: ROUTES.audit, icon: History, label: 'nav.audit', about: 'about.audit' },
    ],
  },
]

export const NAV_ITEMS = NAV.flatMap((group) => group.items)

/**
 * A microloan brand's sidebar. Same pages for Fortuna and Vodiy, each under its own path; a page
 * only one brand needs can be added to that brand here.
 */
export function brandNav(brand: Brand): NavGroup[] {
  const to = (page: string) => brandPath(brand, page)
  return [
    {
      items: [
        { to: to(''), icon: LayoutDashboard, label: 'nav.dashboard', about: 'about.ml.dashboard' },
      ],
    },
    {
      title: 'navGroup.loans',
      items: [
        {
          to: to('applications'),
          icon: ReceiptText,
          label: 'nav.applications',
          about: 'about.ml.applications',
        },
        { to: to('loans'), icon: Banknote, label: 'nav.loans', about: 'about.ml.loans' },
        { to: to('payments'), icon: Wallet, label: 'nav.loanPayments', about: 'about.ml.payments' },
        { to: to('overdue'), icon: CircleAlert, label: 'nav.overdue', about: 'about.ml.overdue' },
        { to: to('customers'), icon: Users, label: 'nav.borrowers', about: 'about.ml.customers' },
      ],
    },
    {
      title: 'navGroup.rules',
      items: [
        { to: to('products'), icon: Package, label: 'nav.products', about: 'about.ml.products' },
        { to: to('decision'), icon: Scale, label: 'nav.decision', about: 'about.ml.decision' },
        {
          to: to('contract'),
          icon: FileSignature,
          label: 'nav.contractRules',
          about: 'about.ml.contract',
        },
      ],
    },
    {
      title: 'navGroup.communication',
      items: [
        { to: to('support'), icon: Headset, label: 'nav.support', about: 'about.ml.support' },
        {
          to: to('quick-replies'),
          icon: MessageSquareText,
          label: 'nav.quickReplies',
          about: 'about.quickReplies',
        },
        {
          to: to('broadcasts'),
          icon: Megaphone,
          label: 'nav.broadcasts',
          about: 'about.ml.broadcasts',
        },
        { to: to('faq'), icon: MessageCircleQuestion, label: 'nav.faq', about: 'about.ml.faq' },
        {
          to: to('onboarding'),
          icon: GalleryHorizontal,
          label: 'nav.onboarding',
          about: 'about.onboarding',
        },
        {
          to: to('documents'),
          icon: FileText,
          label: 'nav.documents',
          about: 'about.ml.documents',
        },
        { to: to('contacts'), icon: MapPin, label: 'nav.contacts', about: 'about.ml.contacts' },
      ],
    },
  ]
}

/** The sidebar for a workspace. */
export const navOf = (workspace: Workspace) => (workspace === 'birzum' ? NAV : brandNav(workspace))
