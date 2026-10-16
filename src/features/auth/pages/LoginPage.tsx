import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from '@/entities/session/session'
import logo from '@/shared/assets/logo.svg'
import logoOnDark from '@/shared/assets/logo-on-dark.svg'
import { ROUTES } from '@/shared/config/routes'
import { LANG_NAMES, LANGS } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PasswordField } from '@/shared/ui/PasswordField'
import { TextField } from '@/shared/ui/TextField'
import { signIn } from '../api/mockAuth'
import { BrandPanel } from '../components/BrandPanel'

/** Sign-in for Birzum staff: username and password, the form on the left and the brand on the right. */
export function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const admin = useAdmin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  if (admin) return <Navigate to={ROUTES.dashboard} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setFailed(false)
    if (!username.trim() || !password) return
    setLoading(true)
    try {
      await signIn(username.trim(), password)
    } catch {
      setFailed(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full bg-canvas">
      <div className="flex min-w-0 flex-1 flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <img src={logo} alt="Birzum nasiya" className="h-9 dark:hidden" />
          <img src={logoOnDark} alt="Birzum nasiya" className="hidden h-9 dark:block" />
          <div className="flex gap-0.5 rounded-lg bg-surface p-0.5" role="tablist">
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
        </div>

        <form
          onSubmit={(e) => void submit(e)}
          noValidate
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10"
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-bold">{t('login.title')}</h1>
            <p className="text-ink-muted">{t('login.subtitle')}</p>
          </div>
          {failed && <Alert message={t('login.error')} />}
          <div className="flex flex-col gap-4">
            <TextField
              label={t('login.username')}
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={submitted && !username.trim() ? t('error.required') : undefined}
            />
            <PasswordField
              label={t('login.password')}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={submitted && !password ? t('error.required') : undefined}
            />
          </div>
          <Button type="submit" block loading={loading}>
            {t('login.submit')}
          </Button>
          <p className="text-center text-sm text-ink-muted">{t('login.help')}</p>
        </form>

        <p className="text-sm text-ink-subtle">© 2026 Birzum</p>
      </div>
      <BrandPanel />
    </div>
  )
}
