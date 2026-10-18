import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { adminsStore, tempPassword, type AdminUser } from '@/entities/admins/admins'
import { rolesStore } from '@/entities/admins/roles'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { PhoneField } from '@/shared/ui/PhoneField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextField } from '@/shared/ui/TextField'

/**
 * Add or edit an admin: name, login, phone and role. A new admin gets a temporary password,
 * shown once right after, to pass on; they set their own at first sign-in.
 */
export function AdminModal({
  admin,
  onClose,
  onCreated,
}: {
  admin: AdminUser | null
  onClose: () => void
  onCreated: (admin: AdminUser, password: string) => void
}) {
  const { t } = useI18n()
  const roles = rolesStore.useAll()
  const [name, setName] = useState(admin?.name ?? '')
  const [login, setLogin] = useState(admin?.login ?? '')
  const [phone, setPhone] = useState(admin?.phone ?? '')
  const [roleId, setRoleId] = useState(admin?.roleId ?? '')
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
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const data = { name: name.trim(), login: login.trim().toLowerCase(), phone, roleId }
    if (admin) {
      adminsStore.update(admin.id, data)
      toast(t('toast.saved'))
      onClose()
    } else {
      const created: AdminUser = { id: newId(), ...data, status: 'invited', createdAt: new Date() }
      adminsStore.save(created)
      onCreated(created, tempPassword())
    }
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
        options={[
          { value: '', label: t('admin.role.pick'), disabled: true },
          ...roles.map((item) => ({ value: item.id, label: item.name })),
        ]}
        value={roleId}
        onChange={setRoleId}
        hint={role?.description}
        error={submitted ? errors.role : undefined}
      />
      {!admin && <p className="text-sm text-ink-muted">{t('admin.new.hint')}</p>}
    </Modal>
  )
}

/** Shows a temporary password once, with a copy button, after creating or resetting. */
export function PasswordModal({
  admin,
  password,
  reset,
  onClose,
}: {
  admin: AdminUser
  password: string
  reset?: boolean
  onClose: () => void
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${admin.login} / ${password}`)
    } catch {
      // No clipboard in this browser: the admin reads it off the screen
    }
    setCopied(true)
  }
  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={admin.name}
      title={t(reset ? 'admin.reset.done' : 'admin.created')}
      footer={
        <Button size="sm" className="ml-auto px-4!" onClick={onClose}>
          {t('common.understood')}
        </Button>
      }
    >
      <p className="text-sm text-ink-muted">{t('admin.password.hint')}</p>
      <dl className="flex flex-col gap-3 rounded-control bg-surface p-4">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">{t('admin.login')}</dt>
          <dd className="font-semibold">{admin.login}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">{t('admin.tempPassword')}</dt>
          <dd className="font-mono text-lg font-bold tracking-wider">{password}</dd>
        </div>
      </dl>
      <Button variant="secondary" onClick={copy} className="self-start">
        {copied ? <Check size={18} /> : <Copy size={18} />}
        {t(copied ? 'admin.copied' : 'admin.copy')}
      </Button>
    </Modal>
  )
}
