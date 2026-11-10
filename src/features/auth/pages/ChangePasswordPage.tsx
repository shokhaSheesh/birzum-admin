import { useState } from 'react'
import { strongEnough } from '@/entities/admins/admins'
import { errorText, isSlug } from '@/shared/api/errors'
import { useI18n } from '@/shared/i18n/useI18n'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PasswordField } from '@/shared/ui/PasswordField'
import { changePassword, signOut } from '../api/auth'
import { AuthShell } from '../components/AuthShell'

/**
 * Shown instead of the panel while the admin still has the password someone else set
 * (`must_change_password`): the backend refuses everything else until it is changed.
 */
export function ChangePasswordPage() {
  const { t } = useI18n()
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState('')

  const errors = {
    old: !oldPassword ? t('error.required') : undefined,
    password: !strongEnough(password) ? t('admin.error.password') : undefined,
    repeat: password !== repeat ? t('admin.error.passwordMismatch') : undefined,
  }

  const save = async () => {
    setSubmitted(true)
    setFailed('')
    if (Object.values(errors).some(Boolean)) return
    setLoading(true)
    try {
      // Afterwards `me` is read again, and the panel opens
      await changePassword(oldPassword, password)
    } catch (e) {
      setFailed(isSlug(e, 'wrong_password') ? t('password.wrongOld') : errorText(e))
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('password.mustChange.title')}
      subtitle={t('password.mustChange.subtitle')}
      onSubmit={() => void save()}
      below={
        <button
          type="button"
          onClick={signOut}
          className="font-semibold text-brand hover:underline"
        >
          {t('topbar.logout')}
        </button>
      }
    >
      {failed && <Alert message={failed} />}
      <div className="flex flex-col gap-4">
        <PasswordField
          label={t('password.old')}
          autoComplete="current-password"
          autoFocus
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          error={submitted ? errors.old : undefined}
        />
        <PasswordField
          label={t('admin.newPassword')}
          autoComplete="new-password"
          hint={t('admin.password.hint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted ? errors.password : undefined}
        />
        <PasswordField
          label={t('admin.passwordRepeat')}
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          error={submitted ? errors.repeat : undefined}
        />
      </div>
      <Button type="submit" block loading={loading}>
        {t('common.save')}
      </Button>
    </AuthShell>
  )
}
