import { Navigate, Outlet } from 'react-router-dom'
import { useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'

/** Lets the panel open only for a signed-in admin; everyone else goes to the sign-in page. */
export function RequireAdmin() {
  return useAdmin() ? <Outlet /> : <Navigate to={ROUTES.login} replace />
}
