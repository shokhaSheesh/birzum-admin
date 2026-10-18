import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import {
  adminsStore,
  strongEnough,
  suggestPassword,
  type AdminStatus,
  type AdminUser,
} from '@/entities/admins/admins'
import { rolesStore } from '@/entities/admins/roles'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { Modal } from '@/shared/ui/Modal'
import { PasswordField } from '@/shared/ui/PasswordField'
import { PhoneField } from '@/shared/ui/PhoneField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'

/**
 * Add or edit an admin: name, login, phone, role and password. A new admin needs a password;
 * when editing, the field is for a new one and left empty keeps the old. Editing also sets
 * Faol or Bloklangan, except for yourself and the last active Bosh admin.
 */
export function AdminModal({
  admin,
  locked,
  onClose,
}: {
  admin: AdminUser | null
  /** Why the status cannot change here, if it cannot. */
  locked?: string
  onClose: () => void
}) {
  const { t } = useI18n()
  const roles = rolesStore.useAll()
  const [name, setName] = useState(admin?.name ?? '')
  const [login, setLogin] = useState(admin?.login ?? '')
  const [phone, setPhone] = useState(admin?.phone ?? '')
  const [roleId, setRoleId] = useState(admin?.roleId ?? '')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<AdminStatus>(admin?.status ?? 'active')
  const [submitted, setSubmitted] = useState(false)
  const role = roles.find((item) => item.id === roleId)

  const taken = adminsStore
    .getAll()
    .some((other) => other.id !== admin?.id && other.login === login.trim().toLowerCase())
  const errors = {
    name: name.trim().split(/\s+/).length < 2 ? t('admin.error.name') : undefined,
    login: !/^[a-z][a-z0-9._]{2,}$/.test(login.trim().toLowerCase())
      ? t('merchant.error.login')
      : taken
        ? t('admin.error.loginTaken')
        : undefined,
    phone: phone.length !== PHONE_DIGITS ? t('error.required') : undefined,
    role: !role ? t('error.required') : undefined,
    password:
      !admin && !password
        ? t('error.required')
        : password && !strongEnough(password)
          ? t('admin.error.password')
          : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const data = { name: name.trim(), login: login.trim().toLowerCase(), phone, roleId, status }
    if (admin) {
      adminsStore.update(admin.id, data)
      toast(t(password ? 'admin.savedWithPassword' : 'toast.saved'))
    } else {
      adminsStore.save({ id: newId(), ...data, createdAt: new Date() })
      toast(t('admin.created'))
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(admin ? 'common.edit' : 'nav.admins')}
      title={admin ? admin.name : t('admin.new')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(admin ? 'common.save' : 'admin.create')}
          </Button>
        </>
      }
    >
      <TextField
        label={t('admin.name')}
        placeholder="Malika Rasulova"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={submitted ? errors.name : undefined}
        autoFocus={!admin}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('admin.login')}
          placeholder="malika.r"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          error={submitted ? errors.login : undefined}
        />
        <PhoneField
          label={t('merchant.phone')}
          value={phone}
          onChange={setPhone}
          error={submitted ? errors.phone : undefined}
        />
      </div>
      <SelectField
        label={t('admin.role')}
        placeholder={t('admin.role.pick')}
        options={roles.map((item) => ({ value: item.id, label: item.name }))}
        value={roleId}
        onChange={setRoleId}
        hint={role?.description}
        error={submitted ? errors.role : undefined}
      />
      <PasswordField
        label={t(admin ? 'admin.newPassword' : 'admin.password')}
        placeholder={admin ? t('admin.newPassword.placeholder') : undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={t('admin.password.hint')}
        error={submitted ? errors.password : undefined}
        autoComplete="new-password"
        labelEnd={
          <button
            type="button"
            onClick={() => setPassword(suggestPassword())}
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            <Sparkles size={14} />
            {t('admin.password.suggest')}
          </button>
        }
      />
      {admin && (
        <div className="flex flex-col gap-1.5">
          <ChoiceGrid
            label={t('merchants.status')}
            columns={2}
            options={[
              { value: 'active', label: t('admin.status.active') },
              { value: 'blocked', label: t('admin.status.blocked') },
            ]}
            value={status}
            onChange={(value) => !locked && setStatus(value)}
            hint={locked ?? (status === 'blocked' ? t('admin.blocked.hint') : undefined)}
          />
        </div>
      )}
    </Modal>
  )
}
