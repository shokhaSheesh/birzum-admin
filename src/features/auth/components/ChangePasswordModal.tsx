import { useState } from 'react'
import { strongEnough } from '@/entities/admins/admins'
import { errorText, isSlug } from '@/shared/api/errors'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { PasswordField } from '@/shared/ui/PasswordField'
import { changePassword } from '../api/auth'

/** The old password and the new one twice; the other sessions of this admin end, this one stays. */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
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
      await changePassword(oldPassword, password)
      toast(t('password.changed'))
      onClose()
    } catch (e) {
      setFailed(isSlug(e, 'wrong_password') ? t('password.wrongOld') : errorText(e))
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('password.change')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" loading={loading} onClick={() => void save()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      {failed && <Alert message={failed} />}
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
    </Modal>
  )
}
