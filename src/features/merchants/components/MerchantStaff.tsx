import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { initialsOfName, strongEnough, suggestPassword } from '@/entities/admins/admins'
import { logAction } from '@/entities/audit/audit'
import { useFilialsOf } from '@/entities/merchants/filials'
import { merchantsStore, type Merchant } from '@/entities/merchants/merchants'
import {
  STAFF_ROLES,
  staffStore,
  type MerchantUser,
  type StaffRole,
  type StaffStatus,
} from '@/entities/merchants/staff'
import { merchantPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { MultiSelectField, type MultiValue } from '@/shared/ui/MultiSelectField'
import { PasswordField } from '@/shared/ui/PasswordField'
import { PhoneField } from '@/shared/ui/PhoneField'
import { RowActions } from '@/shared/ui/RowActions'
import { SelectField } from '@/shared/ui/SelectField'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { TextField } from '@/shared/ui/TextField'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const now = () => new Date()

/**
 * The merchant's app accounts: who, their role and filials, when they were last in, and
 * whether they may sign in. Rows edit and delete; status and a new password are in the edit
 * window. The shop always keeps one active Egasi.
 */
export function MerchantStaff({ merchant }: { merchant: Merchant }) {
  const { t, tl } = useI18n()
  const filials = useFilialsOf(merchant.id)
  const staff = staffStore.useAll().filter((user) => user.merchantId === merchant.id)
  const [editing, setEditing] = useState<MerchantUser | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<MerchantUser | null>(null)

  const owners = staff.filter((user) => user.role === 'owner' && user.status === 'active')
  const lastOwner = (user: MerchantUser) =>
    user.role === 'owner' && user.status === 'active' && owners.length === 1
  // One line per filial, so a name never breaks in the middle
  const filialNames = (user: MerchantUser) =>
    user.filialIds.length === 0
      ? [t('staff.allFilials')]
      : user.filialIds
          .map((id) => filials.find((filial) => filial.id === id))
          .filter(Boolean)
          .map((filial) => tl(filial!.name))

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <p className="text-sm text-ink-muted">{t('staff.hint')}</p>
        <Button size="sm" onClick={() => setEditing(null)}>
          <Plus size={18} />
          {t('staff.add')}
        </Button>
      </div>
      {staff.length === 0 ? (
        <EmptyState title={t('staff.empty')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>{t('admin.name')}</th>
                <th className={th}>{t('staff.role')}</th>
                <th className={th}>{t('merchant.filials')}</th>
                <th className={th}>{t('admin.lastSeen')}</th>
                <th className={th}>{t('merchants.status')}</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {staff.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setEditing(user)}
                  className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" initials={initialsOfName(user.name)} />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold whitespace-nowrap">{user.name}</span>
                        <span className="text-xs text-ink-muted">{user.login}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-brand">
                      {t(`staff.role.${user.role}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {filialNames(user).map((name) => (
                      <span key={name} className="block whitespace-nowrap">
                        {name}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted tabular-nums">
                    {user.lastSeenAt
                      ? formatDateTime(user.lastSeenAt)
                      : t('admin.neverSeen', { date: formatDate(user.createdAt) })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={user.status === 'active' ? 'success' : 'neutral'}>
                      {t(`admin.status.${user.status}`)}
                    </StatusBadge>
                  </td>
                  <td className="pr-3">
                    <RowActions
                      actions={[
                        { icon: Pencil, label: t('common.edit'), onClick: () => setEditing(user) },
                        ...(lastOwner(user)
                          ? []
                          : [
                              {
                                icon: Trash2,
                                label: t('common.delete'),
                                onClick: () => setDeleting(user),
                                danger: true,
                              },
                            ]),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && (
        <StaffModal
          merchant={merchant}
          user={editing}
          locked={editing && lastOwner(editing) ? t('staff.locked.owner') : undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('staff.delete.title', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) {
            staffStore.remove(deleting.id)
            logAction({
              section: 'merchants',
              kind: 'delete',
              action: 'audit.a.staffDeleted',
              target: `${deleting.name} · ${merchant.name}`,
              href: merchantPath(merchant.id),
            })
          }
          setDeleting(null)
          toast(t('staff.deleted'))
        }}
      >
        <p>{t('staff.delete.message')}</p>
      </ConfirmDialog>
    </>
  )
}

/** Add or edit one account. A new one needs a password; editing may set a new one. */
function StaffModal({
  merchant,
  user,
  locked,
  onClose,
}: {
  merchant: Merchant
  user: MerchantUser | null
  /** Why the role and status cannot change, if they cannot. */
  locked?: string
  onClose: () => void
}) {
  const { t, tl } = useI18n()
  const filials = useFilialsOf(merchant.id)
  const [name, setName] = useState(user?.name ?? '')
  const [login, setLogin] = useState(user?.login ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [role, setRole] = useState<StaffRole | ''>(user?.role ?? '')
  const [where, setWhere] = useState<MultiValue>({
    all: !user || user.filialIds.length === 0,
    ids: user?.filialIds ?? [],
  })
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<StaffStatus>(user?.status ?? 'active')
  const [submitted, setSubmitted] = useState(false)

  const taken = staffStore
    .getAll()
    .some((other) => other.id !== user?.id && other.login === login.trim().toLowerCase())
  const errors = {
    name: name.trim().split(/\s+/).length < 2 ? t('admin.error.name') : undefined,
    login: !/^[a-z][a-z0-9._]{2,}$/.test(login.trim().toLowerCase())
      ? t('merchant.error.login')
      : taken
        ? t('admin.error.loginTaken')
        : undefined,
    phone: phone.length !== PHONE_DIGITS ? t('error.required') : undefined,
    role: !role ? t('error.required') : undefined,
    where: !where.all && where.ids.length === 0 ? t('error.required') : undefined,
    password:
      !user && !password
        ? t('error.required')
        : password && !strongEnough(password)
          ? t('admin.error.password')
          : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || !role) return
    const data = {
      name: name.trim(),
      login: login.trim().toLowerCase(),
      phone,
      role,
      // An owner always sees every filial
      filialIds: role === 'owner' || where.all ? [] : where.ids,
      status,
    }
    const target = `${data.name} · ${merchant.name}`
    if (user) {
      staffStore.update(user.id, data)
      // The merchant's page shows its owner's account from the form; keep the two the same
      if (user.login === merchant.owner.login && data.role === 'owner')
        merchantsStore.update(merchant.id, {
          owner: { name: data.name, phone: data.phone, login: data.login },
        })
      logAction({
        section: 'merchants',
        kind: 'update',
        action: 'audit.a.staffSaved',
        target,
        href: merchantPath(merchant.id),
        changes: [
          ...(user.role !== data.role
            ? [
                {
                  field: 'audit.f.role' as const,
                  from: t(`staff.role.${user.role}`),
                  to: t(`staff.role.${data.role}`),
                },
              ]
            : []),
          ...(user.status !== data.status
            ? [
                {
                  field: 'audit.f.status' as const,
                  from: t(`admin.status.${user.status}`),
                  to: t(`admin.status.${data.status}`),
                },
              ]
            : []),
          ...(password ? [{ field: 'admin.password' as const, from: '••••••', to: '••••••' }] : []),
        ],
      })
      toast(t(password ? 'admin.savedWithPassword' : 'toast.saved'))
    } else {
      staffStore.save({ id: newId(), merchantId: merchant.id, ...data, createdAt: now() })
      logAction({
        section: 'merchants',
        kind: 'create',
        action: 'audit.a.staffCreated',
        target,
        href: merchantPath(merchant.id),
      })
      toast(t('staff.created'))
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={merchant.name}
      title={user ? user.name : t('staff.new')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t(user ? 'common.save' : 'staff.create')}
          </Button>
        </>
      }
    >
      <TextField
        label={t('admin.name')}
        placeholder="Laylo Sobirova"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={submitted ? errors.name : undefined}
        autoFocus={!user}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('admin.login')}
          placeholder="laylo.s"
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
        label={t('staff.role')}
        placeholder={t('admin.role.pick')}
        options={STAFF_ROLES.map((value) => ({ value, label: t(`staff.role.${value}`) }))}
        value={role}
        onChange={(value) => !locked && setRole(value)}
        hint={role ? t(`staff.role.${role}.hint`) : undefined}
        error={submitted ? errors.role : undefined}
        disabled={!!locked}
      />
      {role !== 'owner' && (
        <MultiSelectField
          label={t('merchant.filials')}
          options={filials.map((filial) => ({ value: filial.id, label: tl(filial.name) }))}
          value={where}
          onChange={setWhere}
          allLabel={t('staff.allFilials')}
          placeholder={t('staff.pickFilials')}
          error={submitted ? errors.where : undefined}
        />
      )}
      <PasswordField
        label={t(user ? 'admin.newPassword' : 'admin.password')}
        placeholder={user ? t('admin.newPassword.placeholder') : undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={t('staff.password.hint')}
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
      {user && (
        <ChoiceGrid
          label={t('merchants.status')}
          columns={2}
          options={[
            { value: 'active', label: t('admin.status.active') },
            { value: 'blocked', label: t('admin.status.blocked') },
          ]}
          value={status}
          onChange={(value) => !locked && setStatus(value)}
          hint={locked ?? (status === 'blocked' ? t('staff.blocked.hint') : undefined)}
        />
      )}
    </Modal>
  )
}
