import { Check, ChevronDown, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminsStore } from '@/entities/admins/admins'
import { useAdmin } from '@/entities/session/session'
import { signOut } from '@/features/auth/api/mockAuth'
import { WORKSPACE_INFO, WORKSPACES, workspaceOf } from '@/shared/config/workspaces'
import { LANG_NAMES, LANGS } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { useTheme } from '@/shared/theme/useTheme'
import { Avatar } from '@/shared/ui/Avatar'

const iconButton =
  'grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink'

/**
 * Across the top of every page: global search, language, theme and the admin. The admin's menu
 * also switches the business: Birzum or one of the microloan brands, those they work in.
 */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const admin = useAdmin()
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()
  const workspace = workspaceOf(useLocation().pathname)
  // The businesses the signed-in admin has a role in; all of them for a sample session
  const record = adminsStore.useAll().find((item) => item.login === admin?.username)
  const workspaces = record
    ? WORKSPACES.filter((value) => record.grants.some((grant) => grant.workspace === value))
    : WORKSPACES
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4 lg:px-8">
      <button
        type="button"
        aria-label={t('common.menu')}
        onClick={onMenu}
        className={cn(iconButton, 'lg:hidden')}
      >
        <Menu size={22} />
      </button>

      <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
        <Search size={18} className="shrink-0" />
        <span className="sr-only">{t('common.search')}</span>
        <input
          placeholder={t('topbar.search')}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
        />
      </label>

      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 hidden gap-0.5 rounded-lg bg-surface p-0.5 sm:flex" role="tablist">
          {LANGS.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={value === lang}
              aria-label={LANG_NAMES[value]}
              onClick={() => setLang(value)}
              className={cn(
                'h-8 rounded-md px-2.5 text-xs font-bold uppercase',
                value === lang ? 'bg-raised text-ink shadow-sm' : 'text-ink-muted',
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={t('topbar.theme')}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          className={iconButton}
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="relative ml-2 border-l border-line pl-3">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => setMenu((open) => !open)}
            className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 hover:bg-surface"
          >
            <Avatar initials={admin?.initials ?? ''} />
            <span className="hidden flex-col text-left leading-tight md:flex">
              <span className="text-sm font-semibold">{admin?.name}</span>
              <span className="text-xs text-ink-muted">{t('topbar.role')}</span>
            </span>
            <ChevronDown size={16} className="hidden text-ink-subtle md:block" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
              <div
                role="menu"
                className="absolute top-full right-0 z-40 mt-2 w-64 rounded-card border border-line bg-canvas p-1.5 shadow-xl"
              >
                {workspaces.length > 1 && (
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
                    {t('workspace.label')}
                  </p>
                )}
                {workspaces.length > 1 &&
                  workspaces.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={value === workspace}
                      onClick={() => {
                        setMenu(false)
                        if (value !== workspace) navigate(WORKSPACE_INFO[value].home)
                      }}
                      className={cn(
                        'flex h-11 w-full items-center gap-2.5 rounded-control px-2.5 text-left text-sm font-medium hover:bg-surface',
                        value === workspace && 'bg-surface',
                      )}
                    >
                      <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-line">
                        <img
                          src={WORKSPACE_INFO[value].mark}
                          alt=""
                          className="max-h-full max-w-full"
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{WORKSPACE_INFO[value].name}</span>
                      {value === workspace && <Check size={16} className="shrink-0 text-brand" />}
                    </button>
                  ))}
                {workspaces.length > 1 && <hr className="my-1.5 border-line" />}
                <p className="truncate px-3 py-2 text-sm text-ink-muted">@{admin?.username}</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  className="flex h-10 w-full items-center gap-2.5 rounded-control px-3 text-sm font-semibold text-danger hover:bg-danger-soft"
                >
                  <LogOut size={18} />
                  {t('topbar.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
