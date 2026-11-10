import { Navigate, Outlet } from 'react-router-dom'
import { useAdmin, useSessionStatus } from '@/entities/session/session'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'
import { ROUTES } from '@/shared/config/routes'

/**
 * Lets the panel open only for a signed-in admin; everyone else goes to the sign-in page. While
 * `me` is being read after a page refresh there is nothing to show yet; an admin who still has the
 * password someone else set only gets the change-password screen.
 */
export function RequireAdmin() {
  const admin = useAdmin()
  const status = useSessionStatus()
  if (status === 'loading') return <div className="min-h-full bg-surface" />
  if (!admin) return <Navigate to={ROUTES.login} replace />
  if (admin.mustChangePassword) return <ChangePasswordPage />
  return <Outlet />
}
