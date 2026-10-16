import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { LANG_NAMES, LANGS } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { useTheme } from '@/shared/theme/useTheme'
import { Avatar } from '@/shared/ui/Avatar'

const iconButton =
  'grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink'

/** Across the top of every page: global search, language, theme, notifications and the admin. */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
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
                value === lang ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted',
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
        <button
          type="button"
          aria-label={t('topbar.notifications')}
          className={cn(iconButton, 'relative')}
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-green-500 ring-2 ring-canvas" />
        </button>
        <div className="ml-2 flex items-center gap-2.5 border-l border-line pl-3">
          <Avatar initials="SS" />
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-sm font-semibold">Sardor Saidov</span>
            <span className="text-xs text-ink-muted">{t('topbar.role')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
