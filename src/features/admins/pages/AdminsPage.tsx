import { Ban, KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminsStore,
  initialsOfName,
  tempPassword,
  type AdminStatus,
  type AdminUser,
} from '@/entities/admins/admins'
import { rolesStore } from '@/entities/admins/roles'
import { useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { AdminModal, PasswordModal } from '../components/AdminDialogs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const tones: Record<AdminStatus, StatusTone> = {
  active: 'success',
  invited: 'info',
  blocked: 'neutral',
}
type Confirm = { kind: 'block' | 'unblock' | 'reset' | 'delete'; admin: AdminUser }

/**
 * The people who sign in to this panel, each with one role. Small records, so adding and
 * editing is a modal. Nobody can block or delete themselves, and the last active Bosh admin
 * stays.
 */
export function AdminsPage() {
  const { t } = useI18n()
  const me = useAdmin()
  const admins = adminsStore.useAll()
  const roles = rolesStore.useAll()
  const [tab, setTab] = useState<'all' | AdminStatus>('all')
  const [query, setQuery] = useState('')
  const [roleId, setRoleId] = useState('')
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined)
  const [password, setPassword] = useState<{ admin: AdminUser; value: string; reset?: boolean }>()
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const roleOf = (admin: AdminUser) => roles.find((role) => role.id === admin.roleId)
  const isMe = (admin: AdminUser) => admin.login === me?.username || admin.name === me?.name
  const owners = admins.filter((a) => a.roleId === 'owner' && a.status === 'active')
  // The panel must always keep one active Bosh admin
  const lastOwner = (admin: AdminUser) =>
    admin.roleId === 'owner' && admin.status === 'active' && owners.length === 1

  const needle = query.trim().toLowerCase()
  const filtered = admins.filter(
    (admin) =>
      (needle === '' ||
        admin.name.toLowerCase().includes(needle) ||
        admin.login.includes(needle) ||
        admin.phone.includes(needle.replace(/\D/g, '') || '—')) &&
      (!roleId || admin.roleId === roleId),
  )
  const rows = filtered.filter((admin) => tab === 'all' || admin.status === tab)

  const run = () => {
    if (!confirm) return
    const { kind, admin } = confirm
    if (kind === 'block') {
      adminsStore.update(admin.id, { status: 'blocked' })
      toast(t('admin.blocked'))
    } else if (kind === 'unblock') {
      adminsStore.update(admin.id, { status: admin.lastSeenAt ? 'active' : 'invited' })
      toast(t('admin.unblocked'))
    } else if (kind === 'delete') {
      adminsStore.remove(admin.id)
      toast(t('admin.deleted'))
    } else {
      setPassword({ admin, value: tempPassword(), reset: true })
    }
    setConfirm(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.admins')}
        description={t('admins.description')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('admin.add')}
          </Button>
        }
      />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('nav.admins')}
            options={(['all', 'active', 'invited', 'blocked'] as const).map((value) => ({
              value,
              label: value === 'all' ? t('common.all') : t(`admin.status.${value}`),
              count: filtered.filter((a) => value === 'all' || a.status === value).length,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('admins.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('admins.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('admin.role')}
            options={[
              { value: '', label: t('admins.allRoles') },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
            value={roleId}
            onChange={setRoleId}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState title={t('admins.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('admin.name')}</th>
                  <th className={th}>{t('merchant.phone')}</th>
                  <th className={th}>{t('admin.role')}</th>
                  <th className={th}>{t('admin.lastSeen')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-44" />
                </tr>
              </thead>
              <tbody>
                {rows.map((admin) => {
                  const role = roleOf(admin)
                  const self = isMe(admin)
                  const locked = self || lastOwner(admin)
                  return (
                    <tr
                      key={admin.id}
                      onClick={() => setEditing(admin)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar initials={initialsOfName(admin.name)} />
                          <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 font-semibold">
                              {admin.name}
                              {self && (
                                <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-semibold">
                                  {t('admin.you')}
                                </span>
                              )}
                            </span>
                            <span className="text-sm text-ink-muted">{admin.login}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                        {formatPhone(admin.phone)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {role && (
                          <Link
                            to={`${ROUTES.roles}?role=${role.id}`}
                            className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-navy-200"
                          >
                            {role.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-muted tabular-nums">
                        {admin.lastSeenAt
                          ? formatDateTime(admin.lastSeenAt)
                          : t('admin.neverSeen', { date: formatDate(admin.createdAt) })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={tones[admin.status]}>
                          {t(`admin.status.${admin.status}`)}
                        </StatusBadge>
                      </td>
                      <td className="pr-3">
                        <RowActions
                          actions={[
                            {
                              icon: Pencil,
                              label: t('common.edit'),
                              onClick: () => setEditing(admin),
                            },
                            {
                              icon: KeyRound,
                              label: t('admin.reset'),
                              onClick: () => setConfirm({ kind: 'reset', admin }),
                            },
                            ...(locked
                              ? []
                              : admin.status === 'blocked'
                                ? [
                                    {
                                      icon: ShieldCheck,
                                      label: t('admin.unblock'),
                                      onClick: () => setConfirm({ kind: 'unblock', admin }),
                                    },
                                    {
                                      icon: Trash2,
                                      label: t('common.delete'),
                                      onClick: () => setConfirm({ kind: 'delete', admin }),
                                      danger: true,
                                    },
                                  ]
                                : [
                                    {
                                      icon: Ban,
                                      label: t('admin.block'),
                                      onClick: () => setConfirm({ kind: 'block', admin }),
                                      danger: true,
                                    },
                                  ]),
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <AdminModal
          admin={editing}
          onClose={() => setEditing(undefined)}
          onCreated={(admin, value) => {
            setEditing(undefined)
            setPassword({ admin, value })
          }}
        />
      )}
      {password && (
        <PasswordModal
          admin={password.admin}
          password={password.value}
          reset={password.reset}
          onClose={() => setPassword(undefined)}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        tone={confirm?.kind === 'block' || confirm?.kind === 'delete' ? 'danger' : 'primary'}
        title={confirm ? t(`admin.${confirm.kind}.title`, { name: confirm.admin.name }) : ''}
        confirmLabel={
          confirm
            ? t(
                confirm.kind === 'delete'
                  ? 'common.delete'
                  : confirm.kind === 'reset'
                    ? 'admin.reset'
                    : `admin.${confirm.kind}`,
              )
            : ''
        }
        onConfirm={run}
      >
        <p>{confirm ? t(`admin.${confirm.kind}.message`) : ''}</p>
      </ConfirmDialog>
    </div>
  )
}
