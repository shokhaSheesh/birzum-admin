import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
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
          ...NAV_ITEMS.map((item) => ({ path: item.to, element: <StubPage item={item} /> })),
          { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
        ],
      },
    ],
  },
])
