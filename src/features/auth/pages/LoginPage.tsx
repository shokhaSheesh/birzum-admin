import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PasswordField } from '@/shared/ui/PasswordField'
import { TextField } from '@/shared/ui/TextField'
import { signIn } from '../api/mockAuth'
import { AuthShell } from '../components/AuthShell'

/** Sign-in for Birzum staff: username and password in one card in the middle of the page. */
export function LoginPage() {
  const { t } = useI18n()
  const admin = useAdmin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  if (admin) return <Navigate to={ROUTES.dashboard} replace />

  const submit = async () => {
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
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      onSubmit={() => void submit()}
    >
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
