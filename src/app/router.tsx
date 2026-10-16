import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { MerchantDetailPage } from '@/features/merchants/pages/MerchantDetailPage'
import { MerchantFormPage } from '@/features/merchants/pages/MerchantFormPage'
import { MerchantsPage } from '@/features/merchants/pages/MerchantsPage'
import { PricingPage } from '@/features/pricing/pages/PricingPage'
import { StubPage } from '@/features/stub/pages/StubPage'
import { ROUTES } from '@/shared/config/routes'
import { AdminLayout } from './layouts/AdminLayout'
import { NAV_ITEMS } from './nav'
import { RequireAdmin } from './RequireAdmin'

export const router = createBrowserRouter([
  { path: ROUTES.login, element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        // Every sidebar page is empty for now; each one is filled in as it gets designed
        children: [
          { path: ROUTES.merchants, element: <MerchantsPage /> },
          { path: ROUTES.merchantNew, element: <MerchantFormPage /> },
          { path: ROUTES.merchant, element: <MerchantDetailPage /> },
          { path: ROUTES.merchantEdit, element: <MerchantFormPage /> },
          { path: ROUTES.pricing, element: <PricingPage /> },
          ...NAV_ITEMS.filter(
            (item) => item.to !== ROUTES.merchants && item.to !== ROUTES.pricing,
          ).map((item) => ({
            path: item.to,
            element: <StubPage item={item} />,
          })),
          { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
        ],
      },
    ],
  },
])
