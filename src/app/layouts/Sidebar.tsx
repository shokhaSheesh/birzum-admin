import { NavLink } from 'react-router-dom'
import logoOnDark from '@/shared/assets/logo-on-dark.svg'
import logo from '@/shared/assets/logo.svg'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { NAV } from '../nav'

/** The left navigation: the logo, then the pages in titled groups. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n()

  return (
    <nav
      aria-label={t('common.menu')}
      className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5"
    >
      <div className="flex items-center gap-2 px-3">
        <img src={logo} alt="Birzum" className="h-8 dark:hidden" />
        <img src={logoOnDark} alt="Birzum" className="hidden h-8 dark:block" />
        <span className="rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold tracking-wide text-ink-muted uppercase">
          Admin
        </span>
      </div>

      {NAV.map((group, i) => (
        <div key={group.title ?? i} className="flex flex-col gap-0.5">
          {group.title && (
            <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
              {t(group.title)}
            </p>
          )}
          {group.items.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-3 rounded-control px-3 text-[15px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'text-ink-muted hover:bg-surface hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t(label)}</span>
                  {!!badge && (
                    <span
                      className={cn(
                        'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold',
                        isActive ? 'bg-on-primary/20' : 'bg-green-500 text-navy-950',
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
