import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ApplicationDetailPage } from '@/features/applications/pages/ApplicationDetailPage'
import { CheckPage } from '@/features/checks/pages/CheckPage'
import { CheckRulesPage } from '@/features/checks/pages/CheckRulesPage'
import { ChecksPage } from '@/features/checks/pages/ChecksPage'
import { ApplicationsPage } from '@/features/applications/pages/ApplicationsPage'
import { ClientDetailPage } from '@/features/clients/pages/ClientDetailPage'
import { ClientsPage } from '@/features/clients/pages/ClientsPage'
import { CollectionsPage } from '@/features/collections/pages/CollectionsPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { AdminsPage } from '@/features/admins/pages/AdminsPage'
import { RoleFormPage } from '@/features/admins/pages/RoleFormPage'
import { RolesPage } from '@/features/admins/pages/RolesPage'
import { BroadcastDetailPage } from '@/features/broadcasts/pages/BroadcastDetailPage'
import { BroadcastFormPage } from '@/features/broadcasts/pages/BroadcastFormPage'
import { BroadcastsPage } from '@/features/broadcasts/pages/BroadcastsPage'
import { BrandsPage } from '@/features/catalog/pages/BrandsPage'
import { CategoriesPage } from '@/features/catalog/pages/CategoriesPage'
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage'
import { FaqPage } from '@/features/faq/pages/FaqPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { MerchantDetailPage } from '@/features/merchants/pages/MerchantDetailPage'
import { MerchantFormPage } from '@/features/merchants/pages/MerchantFormPage'
import { MerchantsPage } from '@/features/merchants/pages/MerchantsPage'
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { ReviewsPage } from '@/features/reviews/pages/ReviewsPage'
import { QuickRepliesPage } from '@/features/support/pages/QuickRepliesPage'
import { SupportPage } from '@/features/support/pages/SupportPage'
import { PayoutDetailPage } from '@/features/payouts/pages/PayoutDetailPage'
import { PayoutFormPage } from '@/features/payouts/pages/PayoutFormPage'
import { PayoutsPage } from '@/features/payouts/pages/PayoutsPage'
import { AuditLogPage } from '@/features/audit/pages/AuditLogPage'
import { PricingPage } from '@/features/pricing/pages/PricingPage'
import { StubPage } from '@/features/stub/pages/StubPage'
import { ROUTES } from '@/shared/config/routes'
import { AdminLayout } from './layouts/AdminLayout'
import { NAV_ITEMS } from './nav'
import { RequireAdmin } from './RequireAdmin'

/** Sidebar pages that have their own design; the rest show a placeholder. */
const DESIGNED: string[] = [
  ROUTES.dashboard,
  ROUTES.applications,
  ROUTES.checks,
  ROUTES.customers,
  ROUTES.collections,
  ROUTES.merchants,
  ROUTES.payouts,
  ROUTES.reviews,
  ROUTES.support,
  ROUTES.quickReplies,
  ROUTES.broadcasts,
  ROUTES.faq,
  ROUTES.documents,
  ROUTES.admins,
  ROUTES.roles,
  ROUTES.audit,
  ROUTES.products,
  ROUTES.categories,
  ROUTES.brands,
  ROUTES.pricing,
]

export const router = createBrowserRouter([
  { path: ROUTES.login, element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        // Every sidebar page is empty for now; each one is filled in as it gets designed
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.applications, element: <ApplicationsPage /> },
          { path: ROUTES.application, element: <ApplicationDetailPage /> },
          { path: ROUTES.checks, element: <ChecksPage /> },
          { path: ROUTES.checkRules, element: <CheckRulesPage /> },
          { path: ROUTES.check, element: <CheckPage /> },
          { path: ROUTES.customers, element: <ClientsPage /> },
          { path: ROUTES.customer, element: <ClientDetailPage /> },
          { path: ROUTES.collections, element: <CollectionsPage /> },
          { path: ROUTES.merchants, element: <MerchantsPage /> },
          { path: ROUTES.merchantNew, element: <MerchantFormPage /> },
          { path: ROUTES.merchant, element: <MerchantDetailPage /> },
          { path: ROUTES.merchantEdit, element: <MerchantFormPage /> },
          { path: ROUTES.payouts, element: <PayoutsPage /> },
          { path: ROUTES.payoutNew, element: <PayoutFormPage /> },
          { path: ROUTES.payout, element: <PayoutDetailPage /> },
          { path: ROUTES.reviews, element: <ReviewsPage /> },
          { path: ROUTES.support, element: <SupportPage /> },
          { path: ROUTES.quickReplies, element: <QuickRepliesPage /> },
          { path: ROUTES.broadcasts, element: <BroadcastsPage /> },
          { path: ROUTES.faq, element: <FaqPage /> },
          { path: ROUTES.documents, element: <DocumentsPage /> },
          { path: ROUTES.admins, element: <AdminsPage /> },
          { path: ROUTES.roles, element: <RolesPage /> },
          { path: ROUTES.audit, element: <AuditLogPage /> },
          { path: ROUTES.roleNew, element: <RoleFormPage key="new" /> },
          { path: ROUTES.roleEdit, element: <RoleFormPage key="edit" /> },
          { path: ROUTES.broadcastNew, element: <BroadcastFormPage key="new" /> },
          { path: ROUTES.broadcast, element: <BroadcastDetailPage /> },
          { path: ROUTES.broadcastEdit, element: <BroadcastFormPage key="edit" /> },
          { path: ROUTES.products, element: <ProductsPage /> },
          { path: ROUTES.product, element: <ProductDetailPage /> },
          { path: ROUTES.categories, element: <CategoriesPage /> },
          { path: ROUTES.brands, element: <BrandsPage /> },
          { path: ROUTES.pricing, element: <PricingPage /> },
          ...NAV_ITEMS.filter((item) => !DESIGNED.includes(item.to)).map((item) => ({
            path: item.to,
            element: <StubPage item={item} />,
          })),
          { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
        ],
      },
    ],
  },
])
