import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { session, useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PasswordField } from '@/shared/ui/PasswordField'
import { TextField } from '@/shared/ui/TextField'
import { errorText, isSlug } from '@/shared/api/errors'
import { signIn } from '../api/auth'
import { AuthShell } from '../components/AuthShell'

const PANELS = [
  { key: 'api', dot: 'bg-green-500', title: 'login.panel.api', text: 'login.panel.apiText' },
  { key: 'demo', dot: 'bg-amber-400', title: 'login.panel.demo', text: 'login.panel.demoText' },
] as const

/**
 * The first screen: which panel to open. The API one asks for a real staff login; the sample one
 * opens at once with sample data and only the pages not yet wired to the backend.
 */
export function LoginPage() {
  const { t } = useI18n()
  const admin = useAdmin()
  const [panel, setPanel] = useState<'choose' | 'api'>('choose')

  if (admin) return <Navigate to={ROUTES.dashboard} replace />

  if (panel === 'api') return <StaffSignIn onBack={() => setPanel('choose')} />

  return (
    <AuthShell
      title={t('login.choose.title')}
      subtitle={t('login.choose.subtitle')}
      onSubmit={() => {}}
    >
      <div className="flex flex-col gap-3">
        {PANELS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => (item.key === 'api' ? setPanel('api') : session.enterDemo())}
            className="flex items-center gap-4 rounded-control border border-line bg-canvas p-4 text-left transition-colors hover:border-primary hover:bg-surface focus-visible:border-primary focus-visible:outline-none"
          >
            <span className={`size-2.5 shrink-0 rounded-full ${item.dot}`} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-bold">{t(item.title)}</span>
              <span className="text-sm text-ink-muted">{t(item.text)}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
          </button>
        ))}
      </div>
    </AuthShell>
  )
}

/** Sign-in for Birzum staff on the API panel: username and password in one card. */
function StaffSignIn({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setSubmitted(true)
    setFailed('')
    if (!username.trim() || !password) return
    setLoading(true)
    try {
      await signIn(username.trim(), password)
    } catch (e) {
      // Wrong login or password has its own text; locks, rate limits and outages say what they are
      setFailed(isSlug(e, 'invalid_credentials') ? t('login.error') : errorText(e))
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      onSubmit={() => void submit()}
      below={
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
        >
          <ArrowLeft size={16} />
          {t('login.choose.back')}
        </button>
      }
    >
      {failed && <Alert message={failed} />}
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
          labelEnd={
            <Link
              to={ROUTES.forgotPassword}
              className="text-sm font-semibold text-brand hover:underline"
            >
              {t('forgot.link')}
            </Link>
          }
        />
      </div>
      <Button type="submit" block loading={loading}>
        {t('login.submit')}
      </Button>
    </AuthShell>
  )
}
