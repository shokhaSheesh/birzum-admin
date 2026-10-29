import type { FormEvent, ReactNode } from 'react'
import logo from '@/shared/assets/logo.svg'
import logoOnDark from '@/shared/assets/logo-on-dark.svg'
import { LANG_NAMES, LANGS } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

/**
 * The signed-out page: language switch, logo, one card in the middle and a line under it.
 * Sign-in and the forgotten-password steps share it.
 */
export function AuthShell({
  title,
  subtitle,
  onSubmit,
  children,
  below,
}: {
  title: string
  subtitle: ReactNode
  onSubmit: () => void
  children: ReactNode
  /** Under the card, e.g. a help line or a link back. */
  below?: ReactNode
}) {
  const { lang, setLang } = useI18n()

  return (
    <div className="flex min-h-full flex-col items-center bg-surface px-4 py-8">
      <div className="flex w-full max-w-md justify-end">
        <div className="flex gap-0.5 rounded-lg bg-canvas p-0.5" role="tablist">
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
                value === lang ? 'bg-primary text-on-primary' : 'text-ink-muted',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-10">
        <div className="flex items-center justify-center gap-2">
          <img src={logo} alt="Birzum nasiya" className="h-10 dark:hidden" />
          <img src={logoOnDark} alt="Birzum nasiya" className="hidden h-10 dark:block" />
          <span className="rounded-md bg-canvas px-1.5 py-0.5 text-xs font-bold tracking-wide text-ink-muted uppercase">
            Admin
          </span>
        </div>

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            onSubmit()
          }}
          noValidate
          className="flex flex-col gap-6 rounded-[24px] border border-line bg-canvas p-8 shadow-[0_12px_40px_-20px_rgb(7_42_60/0.25)]"
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-ink-muted">{subtitle}</p>
          </div>
          {children}
        </form>
        {below && <div className="text-center text-sm text-ink-muted">{below}</div>}
      </div>

      <p className="text-sm text-ink-subtle">© 2026 Birzum</p>
    </div>
  )
}
