import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import {
  adminsStore,
  sortGrants,
  strongEnough,
  isEmail,
  suggestPassword,
  type AdminStatus,
  type AdminUser,
  type Grant,
} from '@/entities/admins/admins'
import { rolesStore } from '@/entities/admins/roles'
import { WORKSPACE_INFO, type Workspace } from '@/shared/config/workspaces'
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
import { BrandChecks } from './BrandChecks'
import { logAction } from '@/entities/audit/audit'

/**
 * Add or edit an admin: name, login, phone, the businesses they work in with a role in each
 * (from the roles made for that business), and password. A new admin needs a password;
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
  const roleName = (id: string) => roles.find((role) => role.id === id)?.name ?? '—'
  const [name, setName] = useState(admin?.name ?? '')
  const [login, setLogin] = useState(admin?.login ?? '')
  const [phone, setPhone] = useState(admin?.phone ?? '')
  const [email, setEmail] = useState(admin?.email ?? '')
  const [brands, setBrands] = useState<Workspace[]>(
    admin ? sortGrants(admin.grants).map((grant) => grant.workspace) : [],
  )
  // Kept per business, so unticking and ticking again restores the pick
  const [roleOf, setRoleOf] = useState<Partial<Record<Workspace, string>>>(
    Object.fromEntries((admin?.grants ?? []).map((grant) => [grant.workspace, grant.roleId])),
  )
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [status, setStatus] = useState<AdminStatus>(admin?.status ?? 'active')
  const [submitted, setSubmitted] = useState(false)
  const rolesFor = (workspace: Workspace) => roles.filter((role) => role.brands.includes(workspace))
  const grants: Grant[] = brands.map((workspace) => ({
    workspace,
    roleId: rolesFor(workspace).some((role) => role.id === roleOf[workspace])
      ? roleOf[workspace]!
      : '',
  }))
  const grantText = (list: Grant[]) =>
    sortGrants(list)
      .map((grant) => `${WORKSPACE_INFO[grant.workspace].name}: ${roleName(grant.roleId)}`)
      .join(', ') || '—'

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
    email: !isEmail(email) ? t('admin.error.email') : undefined,
    brands: brands.length === 0 ? t('admin.error.brands') : undefined,
    roles: grants.some((grant) => !grant.roleId) ? t('error.required') : undefined,
    password:
      !admin && !password
        ? t('error.required')
        : password && !strongEnough(password)
          ? t('admin.error.password')
          : undefined,
    passwordRepeat: password !== passwordRepeat ? t('admin.error.passwordMismatch') : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const data = {
      name: name.trim(),
      login: login.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone,
      grants,
      status,
    }
    if (admin) {
      adminsStore.update(admin.id, data)
      toast(t(password ? 'admin.savedWithPassword' : 'toast.saved'))
      logAction({
        section: 'admins',
        kind: 'update',
        action: 'audit.a.adminSaved',
        target: data.name,
        // Role, status and password are what an audit asks about; the rest is in the record
        changes: [
          ...(grantText(admin.grants) !== grantText(data.grants)
            ? [
                {
                  field: 'audit.f.role' as const,
                  from: grantText(admin.grants),
                  to: grantText(data.grants),
                },
              ]
            : []),
          ...(admin.status !== data.status
            ? [
                {
                  field: 'audit.f.status' as const,
                  from: t(`admin.status.${admin.status}`),
                  to: t(`admin.status.${data.status}`),
                },
              ]
            : []),
          ...(password ? [{ field: 'admin.password' as const, from: '••••••', to: '••••••' }] : []),
        ],
      })
    } else {
      adminsStore.save({ id: newId(), ...data, createdAt: new Date() })
      toast(t('admin.created'))
      logAction({
        section: 'admins',
        kind: 'create',
        action: 'audit.a.adminCreated',
        target: data.name,
      })
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
      <TextField
        label={t('admin.email')}
        type="email"
        placeholder="malika.r@birzum.uz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        hint={t('admin.email.hint')}
        error={submitted ? errors.email : undefined}
      />
      <BrandChecks
        label={t('admin.brands')}
        value={brands}
        onChange={setBrands}
        error={submitted ? errors.brands : undefined}
      />
      {grants.map((grant) => {
        const options = rolesFor(grant.workspace)
        const picked = options.find((role) => role.id === grant.roleId)
        return (
          <SelectField
            key={grant.workspace}
            label={t('admin.roleIn', { brand: WORKSPACE_INFO[grant.workspace].name })}
            placeholder={t('admin.role.pick')}
            options={options.map((item) => ({ value: item.id, label: item.name }))}
            value={grant.roleId}
            onChange={(value) => setRoleOf({ ...roleOf, [grant.workspace]: value })}
            hint={picked?.description}
            error={submitted && !grant.roleId ? t('error.required') : undefined}
          />
        )
      })}
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
            onClick={() => {
              // A suggested password fills both fields, so it doesn't have to be typed twice
              const suggested = suggestPassword()
              setPassword(suggested)
              setPasswordRepeat(suggested)
            }}
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            <Sparkles size={14} />
            {t('admin.password.suggest')}
          </button>
        }
      />
      <PasswordField
        label={t('admin.passwordRepeat')}
        value={passwordRepeat}
        onChange={(e) => setPasswordRepeat(e.target.value)}
        error={submitted ? errors.passwordRepeat : undefined}
        autoComplete="new-password"
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
