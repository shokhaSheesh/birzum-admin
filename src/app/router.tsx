import { createBrowserRouter, Navigate } from 'react-router-dom'
import { BrandsPage } from '@/features/catalog/pages/BrandsPage'
import { CategoriesPage } from '@/features/catalog/pages/CategoriesPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { MerchantDetailPage } from '@/features/merchants/pages/MerchantDetailPage'
import { MerchantFormPage } from '@/features/merchants/pages/MerchantFormPage'
import { MerchantsPage } from '@/features/merchants/pages/MerchantsPage'
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { PricingPage } from '@/features/pricing/pages/PricingPage'
import { StubPage } from '@/features/stub/pages/StubPage'
import { ROUTES } from '@/shared/config/routes'
import { AdminLayout } from './layouts/AdminLayout'
import { NAV_ITEMS } from './nav'
import { RequireAdmin } from './RequireAdmin'

/** Sidebar pages that have their own design; the rest show a placeholder. */
const DESIGNED: string[] = [
  ROUTES.merchants,
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
          { path: ROUTES.merchants, element: <MerchantsPage /> },
          { path: ROUTES.merchantNew, element: <MerchantFormPage /> },
          { path: ROUTES.merchant, element: <MerchantDetailPage /> },
          { path: ROUTES.merchantEdit, element: <MerchantFormPage /> },
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
