import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdmin, useSessionStatus } from '@/entities/session/session'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'
import { isWiredPath } from '@/shared/api/wired'
import { ROUTES } from '@/shared/config/routes'
import { type Workspace, workspaceOf } from '@/shared/config/workspaces'
import { navOf } from './nav'

/** The first page of the business's menu that talks to the backend. */
const firstWiredPage = (workspace: Workspace) =>
  navOf(workspace)
    .flatMap((group) => group.items)
    .find((item) => isWiredPath(item.to))?.to

/**
 * Lets the panel open only for a signed-in admin; everyone else goes to the sign-in page. While
 * `me` is being read after a page refresh there is nothing to show yet; an admin who still has the
 * password someone else set only gets the change-password screen. In the API panel pages not wired
 * to the backend are locked: they open the business's first wired page instead; the sample panel
 * opens every page.
 */
export function RequireAdmin() {
  const admin = useAdmin()
  const status = useSessionStatus()
  const { pathname } = useLocation()
  if (status === 'loading') return <div className="min-h-full bg-surface" />
  if (!admin) return <Navigate to={ROUTES.login} replace />
  if (admin.mustChangePassword) return <ChangePasswordPage />
  if (!admin.demo && !isWiredPath(pathname)) {
    const first = firstWiredPage(workspaceOf(pathname))
    if (first && first !== pathname) return <Navigate to={first} replace />
  }
  return <Outlet />
}
