import { ArrowLeft, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isEmail, strongEnough } from '@/entities/admins/admins'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { useCountdown } from '@/shared/lib/useCountdown'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PasswordField } from '@/shared/ui/PasswordField'
import { TextField } from '@/shared/ui/TextField'
import { requestReset, resetPassword, verifyResetCode } from '../api/mockAuth'
import { AuthShell } from '../components/AuthShell'

const CODE_LENGTH = 6
const RESEND_SECONDS = 59

/**
 * Forgot password: the admin's email, the code sent to it (SMTP), then a new password typed
 * twice. Afterwards they sign in with it as usual.
 */
export function ForgotPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useCountdown(0)

  const goTo = (next: typeof step) => {
    setSubmitted(false)
    setFailed(null)
    setLoading(false)
    setStep(next)
  }

  // Each step's call: a refusal shows its message in the card and keeps the step open
  const run = async (call: () => Promise<void>, next: typeof step, message: string) => {
    setLoading(true)
    setFailed(null)
    try {
      await call()
      goTo(next)
    } catch {
      setFailed(message)
      setLoading(false)
    }
  }

  const sendCode = () =>
    run(
      async () => {
        await requestReset(email.trim())
        setSecondsLeft(RESEND_SECONDS)
        setCode('')
      },
      'code',
      t('forgot.email.notFound'),
    )

  const back = (
    <Link
      to={ROUTES.login}
      className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
    >
      <ArrowLeft size={16} />
      {t('forgot.back')}
    </Link>
  )

  if (step === 'done') {
    return (
      <AuthShell
        title={t('forgot.done.title')}
        subtitle={t('forgot.done.text')}
        onSubmit={() => navigate(ROUTES.login)}
      >
        <span className="grid size-14 place-items-center self-center rounded-full bg-success-soft text-success">
          <CircleCheck size={28} />
        </span>
        <Button type="submit" block>
          {t('login.submit')}
        </Button>
      </AuthShell>
    )
  }

  if (step === 'password') {
    const passwordError = !strongEnough(password) ? t('admin.error.password') : undefined
    const repeatError = password !== repeat ? t('admin.error.passwordMismatch') : undefined
    return (
      <AuthShell
        title={t('forgot.password.title')}
        subtitle={t('forgot.password.subtitle')}
        onSubmit={() => {
          setSubmitted(true)
          if (passwordError || repeatError) return
          void run(() => resetPassword(email.trim(), password), 'done', t('forgot.failed'))
        }}
        below={back}
      >
        {failed && <Alert message={failed} />}
        <div className="flex flex-col gap-4">
          <PasswordField
            label={t('admin.newPassword')}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={t('forgot.password.hint')}
            error={submitted ? passwordError : undefined}
          />
          <PasswordField
            label={t('admin.passwordRepeat')}
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            error={submitted ? repeatError : undefined}
          />
        </div>
        <Button type="submit" block loading={loading}>
          {t('forgot.password.submit')}
        </Button>
      </AuthShell>
    )
  }

  if (step === 'code') {
    return (
      <AuthShell
        title={t('forgot.code.title')}
        subtitle={t('forgot.code.subtitle', { email: email.trim() })}
        onSubmit={() => {
          setSubmitted(true)
          if (code.length < CODE_LENGTH) return
          void run(() => verifyResetCode(email.trim(), code), 'password', t('forgot.code.wrong'))
        }}
        below={back}
      >
        {failed && <Alert message={failed} />}
        <TextField
          label={t('forgot.code.label')}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoFocus
          maxLength={CODE_LENGTH}
          style={{ textAlign: 'center', fontSize: 20, fontWeight: 600, letterSpacing: '0.5em' }}
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, CODE_LENGTH),
            )
          }
          error={submitted && code.length < CODE_LENGTH ? t('forgot.code.short') : undefined}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" block loading={loading}>
            {t('forgot.code.submit')}
          </Button>
          {secondsLeft > 0 ? (
            <p className="text-center text-sm text-ink-muted">
              {t('forgot.code.resendIn', { seconds: String(secondsLeft) })}
            </p>
          ) : (
            <Button variant="ghost" block disabled={loading} onClick={() => void sendCode()}>
              {t('forgot.code.resend')}
            </Button>
          )}
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('forgot.email.title')}
      subtitle={t('forgot.email.subtitle')}
      onSubmit={() => {
        setSubmitted(true)
        if (isEmail(email)) void sendCode()
      }}
      below={back}
    >
      {failed && <Alert message={failed} />}
      <TextField
        label={t('admin.email')}
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="name@birzum.uz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={submitted && !isEmail(email) ? t('admin.error.email') : undefined}
      />
      <Button type="submit" block loading={loading}>
        {t('forgot.email.submit')}
      </Button>
    </AuthShell>
  )
}
