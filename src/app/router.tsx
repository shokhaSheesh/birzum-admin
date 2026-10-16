import { createBrowserRouter, Navigate } from 'react-router-dom'
import { StubPage } from '@/features/stub/pages/StubPage'
import { AdminLayout } from './layouts/AdminLayout'
import { NAV_ITEMS } from './nav'

export const router = createBrowserRouter([
  {
    element: <AdminLayout />,
    // Every sidebar page starts as a placeholder; each one is replaced as it gets designed
    children: [
      ...NAV_ITEMS.map((item) => ({ path: item.to, element: <StubPage item={item} /> })),
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
