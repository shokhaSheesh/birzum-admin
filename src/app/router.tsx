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
import { BrandContactsPage } from '@/features/microloans/pages/BrandContactsPage'
import { LoanDashboardPage } from '@/features/microloans/pages/LoanDashboardPage'
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
import { OnboardingPage } from '@/features/onboarding/pages/OnboardingPage'
import { LoanApplicationPage } from '@/features/microloans/pages/LoanApplicationPage'
import { LoanApplicationsPage } from '@/features/microloans/pages/LoanApplicationsPage'
import { LoanPage } from '@/features/microloans/pages/LoanPage'
import { ContractRulesPage } from '@/features/microloans/pages/ContractRulesPage'
import { DecisionRulesPage } from '@/features/microloans/pages/DecisionRulesPage'
import { LoanClientPage } from '@/features/microloans/pages/LoanClientPage'
import { LoanClientsPage } from '@/features/microloans/pages/LoanClientsPage'
import { LoanOverduePage } from '@/features/microloans/pages/LoanOverduePage'
import { LoanPaymentsPage } from '@/features/microloans/pages/LoanPaymentsPage'
import { LoanProductsPage } from '@/features/microloans/pages/LoanProductsPage'
import { LoansPage } from '@/features/microloans/pages/LoansPage'
import { PricingPage } from '@/features/pricing/pages/PricingPage'
import { StubPage } from '@/features/stub/pages/StubPage'
import { ROUTES } from '@/shared/config/routes'
import { AdminLayout } from './layouts/AdminLayout'
import { BRANDS, brandPath, type Brand } from '@/shared/config/workspaces'
import { brandNav, NAV_ITEMS } from './nav'
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
  ROUTES.onboarding,
  ROUTES.documents,
  ROUTES.admins,
  ROUTES.roles,
  ROUTES.audit,
  ROUTES.products,
  ROUTES.categories,
  ROUTES.brands,
  ROUTES.pricing,
]

/** A microloan brand's pages: the designed ones, and a placeholder for every other menu item. */
function brandRoutes(brand: Brand) {
  const designed = [
    { path: brandPath(brand), element: <LoanDashboardPage key={brand} brand={brand} /> },
    { path: brandPath(brand, 'broadcasts'), element: <BroadcastsPage key={brand} app={brand} /> },
    {
      path: brandPath(brand, 'broadcasts/new'),
      element: <BroadcastFormPage key={`${brand}-new`} app={brand} />,
    },
    {
      path: brandPath(brand, 'broadcasts/:id'),
      element: <BroadcastDetailPage key={brand} app={brand} />,
    },
    {
      path: brandPath(brand, 'broadcasts/:id/edit'),
      element: <BroadcastFormPage key={`${brand}-edit`} app={brand} />,
    },
    { path: brandPath(brand, 'faq'), element: <FaqPage key={brand} app={brand} /> },
    { path: brandPath(brand, 'documents'), element: <DocumentsPage key={brand} app={brand} /> },
    {
      path: brandPath(brand, 'contacts'),
      element: <BrandContactsPage key={brand} brand={brand} />,
    },
    { path: brandPath(brand, 'support'), element: <SupportPage key={brand} app={brand} /> },
    {
      path: brandPath(brand, 'quick-replies'),
      element: <QuickRepliesPage key={brand} app={brand} />,
    },
    {
      path: brandPath(brand, 'decision'),
      element: <DecisionRulesPage key={brand} brand={brand} />,
    },
    {
      path: brandPath(brand, 'contract'),
      element: <ContractRulesPage key={brand} brand={brand} />,
    },
    { path: brandPath(brand, 'customers'), element: <LoanClientsPage key={brand} brand={brand} /> },
    {
      path: brandPath(brand, 'customers/:id'),
      element: <LoanClientPage key={brand} brand={brand} />,
    },
    { path: brandPath(brand, 'overdue'), element: <LoanOverduePage key={brand} brand={brand} /> },
    { path: brandPath(brand, 'payments'), element: <LoanPaymentsPage key={brand} brand={brand} /> },
    { path: brandPath(brand, 'loans'), element: <LoansPage key={brand} brand={brand} /> },
    { path: brandPath(brand, 'loans/:id'), element: <LoanPage key={brand} brand={brand} /> },
    {
      path: brandPath(brand, 'applications'),
      element: <LoanApplicationsPage key={brand} brand={brand} />,
    },
    {
      path: brandPath(brand, 'applications/:id'),
      element: <LoanApplicationPage key={brand} brand={brand} />,
    },
    { path: brandPath(brand, 'products'), element: <LoanProductsPage key={brand} brand={brand} /> },
    { path: brandPath(brand, 'onboarding'), element: <OnboardingPage key={brand} app={brand} /> },
  ]
  const stubs = brandNav(brand)
    .flatMap((group) => group.items)
    .filter((item) => !designed.some((route) => route.path === item.to))
    .map((item) => ({ path: item.to, element: <StubPage key={item.to} item={item} /> }))
  return [...designed, ...stubs]
}

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
          { path: ROUTES.onboarding, element: <OnboardingPage key="birzum" app="birzum" /> },
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
          ...BRANDS.flatMap(brandRoutes),
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
