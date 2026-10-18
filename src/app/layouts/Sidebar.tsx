import { checksStore } from '@/entities/applications/checks'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { applicationsStore } from '@/entities/applications/applications'
import { chatsStore } from '@/entities/support/chats'
import logoMark from '@/shared/assets/logo-mark.svg'
import logoOnDark from '@/shared/assets/logo-on-dark.svg'
import logo from '@/shared/assets/logo.svg'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { brandPath, WORKSPACE_INFO, workspaceOf } from '@/shared/config/workspaces'
import { navOf } from '../nav'

type Props = {
  onNavigate?: () => void
  /** Icons only; each label shows on hover. Desktop only. */
  collapsed?: boolean
  /** Shows the collapse button at the bottom. Left out in the mobile drawer. */
  onToggle?: () => void
}

/**
 * The left navigation: the logo of the business being run (Birzum or a microloan brand), then
 * that business's pages in titled groups, then the collapse button.
 */
export function Sidebar({ onNavigate, collapsed = false, onToggle }: Props) {
  const { t } = useI18n()
  const workspace = workspaceOf(useLocation().pathname)
  const home = WORKSPACE_INFO[workspace].home
  // Arizalar counts the ones waiting for a merchant to take them
  const pending = applicationsStore
    .useAll()
    .filter((application) => application.status === 'pending').length
  // Yordam chati counts open chats with messages nobody has read
  const checking = checksStore.useAll().filter((check) => check.state === 'waiting').length
  const unread = chatsStore
    .useAll()
    .filter((chat) => chat.app === workspace && chat.status === 'open' && chat.unread > 0).length

  return (
    <nav aria-label={t('common.menu')} className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto px-3 py-5">
        {workspace !== 'birzum' ? (
          // A microloan brand: its mark, and its name beside it when there is room
          <div className={cn('flex items-center gap-2.5', collapsed ? 'justify-center' : 'px-3')}>
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-line">
              <img src={WORKSPACE_INFO[workspace].mark} alt="" className="max-h-full max-w-full" />
            </span>
            {!collapsed && (
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[17px] font-bold">
                  {WORKSPACE_INFO[workspace].name}
                </span>
                <span className="text-[11px] font-bold tracking-wide text-ink-subtle uppercase">
                  Admin
                </span>
              </span>
            )}
          </div>
        ) : collapsed ? (
          <img src={logoMark} alt="Birzum" className="mx-auto size-8" />
        ) : (
          <div className="flex items-center gap-2 px-3">
            <img src={logo} alt="Birzum" className="h-8 dark:hidden" />
            <img src={logoOnDark} alt="Birzum" className="hidden h-8 dark:block" />
            <span className="rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold tracking-wide text-ink-muted uppercase">
              Admin
            </span>
          </div>
        )}

        {navOf(workspace).map((group, i) => (
          <div key={group.title ?? i} className="flex flex-col gap-0.5">
            {group.title &&
              (collapsed ? (
                <hr className="mx-2 mb-2 border-line" />
              ) : (
                <p className="px-3 pb-1 text-xs font-semibold tracking-wider whitespace-nowrap text-ink-subtle uppercase">
                  {t(group.title)}
                </p>
              ))}
            {group.items.map(({ to, icon: Icon, label, badge: fixed }) => {
              const badge =
                to === ROUTES.applications
                  ? pending
                  : to === ROUTES.checks
                    ? checking
                    : to ===
                        (workspace === 'birzum' ? ROUTES.support : brandPath(workspace, 'support'))
                      ? unread
                      : fixed
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === home}
                  onClick={onNavigate}
                  title={collapsed ? t(label) : undefined}
                  aria-label={collapsed ? t(label) : undefined}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-10 items-center gap-3 rounded-control text-[15px] font-medium transition-colors',
                      collapsed ? 'justify-center' : 'px-3',
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'text-ink-muted hover:bg-surface hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} className="shrink-0" />
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{t(label)}</span>}
                      {!!badge &&
                        (collapsed ? (
                          <span className="absolute top-1.5 right-2 size-2 rounded-full bg-green-500" />
                        ) : (
                          <span
                            className={cn(
                              'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold',
                              isActive ? 'bg-on-primary/20' : 'bg-green-500 text-navy-950',
                            )}
                          >
                            {badge}
                          </span>
                        ))}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {onToggle && (
        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? t('sidebar.expand') : undefined}
            aria-label={collapsed ? t('sidebar.expand') : undefined}
            aria-expanded={!collapsed}
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-control text-[15px] font-medium whitespace-nowrap text-ink-muted transition-colors hover:bg-surface hover:text-ink',
              collapsed ? 'justify-center' : 'px-3',
            )}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            {!collapsed && t('sidebar.collapse')}
          </button>
        </div>
      )}
    </nav>
  )
}
