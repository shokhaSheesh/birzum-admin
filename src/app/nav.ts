import {
  BadgePercent,
  FileText,
  FolderTree,
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
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/shared/config/routes'
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
