import { ChevronDown, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { session, useAdmin } from '@/entities/session/session'
import { LANG_NAMES, LANGS } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { useTheme } from '@/shared/theme/useTheme'
import { Avatar } from '@/shared/ui/Avatar'

const iconButton =
  'grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink'

/** Across the top of every page: global search, language, theme and the admin. */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const admin = useAdmin()
  const [menu, setMenu] = useState(false)
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
                className="absolute top-full right-0 z-40 mt-2 w-56 rounded-card border border-line bg-canvas p-1.5 shadow-xl"
              >
                <p className="truncate px-3 py-2 text-sm text-ink-muted">@{admin?.username}</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={session.signOut}
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
