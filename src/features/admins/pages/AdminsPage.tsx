import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminsStore,
  initialsOfName,
  sortGrants,
  type AdminStatus,
  type AdminUser,
} from '@/entities/admins/admins'
import { rolesStore } from '@/entities/admins/roles'
import { useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'
import { WORKSPACE_INFO, WORKSPACES, type Workspace } from '@/shared/config/workspaces'
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
import { AdminModal } from '../components/AdminDialogs'
import { logAction } from '@/entities/audit/audit'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const tones: Record<AdminStatus, StatusTone> = {
  active: 'success',
  blocked: 'neutral',
}

/**
 * The people who sign in to this panel, each with a role in every business they work in. Small records, so adding and
 * editing (password and Faol / Bloklangan too) is a modal; rows only edit and delete. Nobody
 * can block or delete themselves, and the last active Bosh admin stays.
 */
export function AdminsPage() {
  const { t } = useI18n()
  const me = useAdmin()
  const admins = adminsStore.useAll()
  const roles = rolesStore.useAll()
  const [tab, setTab] = useState<'all' | AdminStatus>('all')
  const [query, setQuery] = useState('')
  const [roleId, setRoleId] = useState('')
  const [brand, setBrand] = useState<'' | Workspace>('')
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)

  const roleName = (id: string) => roles.find((role) => role.id === id)?.name
  const isMe = (admin: AdminUser) => admin.login === me?.username || admin.name === me?.name
  const isOwner = (admin: AdminUser) => admin.grants.some((grant) => grant.roleId === 'owner')
  const owners = admins.filter((a) => isOwner(a) && a.status === 'active')
  // The panel must always keep one active Bosh admin
  const lastOwner = (admin: AdminUser) =>
    isOwner(admin) && admin.status === 'active' && owners.length === 1

  const needle = query.trim().toLowerCase()
  const filtered = admins.filter(
    (admin) =>
      (needle === '' ||
        admin.name.toLowerCase().includes(needle) ||
        admin.login.includes(needle) ||
        admin.phone.includes(needle.replace(/\D/g, '') || '—')) &&
      (!roleId || admin.grants.some((grant) => grant.roleId === roleId)) &&
      (!brand || admin.grants.some((grant) => grant.workspace === brand)),
  )
  const rows = filtered.filter((admin) => tab === 'all' || admin.status === tab)

  // Nobody changes their own status or deletes themselves; one active Bosh admin always stays
  const lockReason = (admin: AdminUser) =>
    isMe(admin) ? t('admin.locked.self') : lastOwner(admin) ? t('admin.locked.owner') : undefined

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.admins')}
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
            options={(['all', 'active', 'blocked'] as const).map((value) => ({
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
          <FilterSelect
            label={t('admin.brands')}
            options={[
              { value: '', label: t('admins.allBrands') },
              ...WORKSPACES.map((value) => ({ value, label: WORKSPACE_INFO[value].name })),
            ]}
            value={brand}
            onChange={setBrand}
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
                  <th className={th}>{t('admin.access')}</th>
                  <th className={th}>{t('admin.lastSeen')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-44" />
                </tr>
              </thead>
              <tbody>
                {rows.map((admin) => {
                  const self = isMe(admin)
                  const locked = !!lockReason(admin)
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
                        <div className="flex flex-col items-start gap-1.5">
                          {sortGrants(admin.grants).map((grant) => (
                            <Link
                              key={grant.workspace}
                              to={`${ROUTES.roles}?role=${grant.roleId}`}
                              title={WORKSPACE_INFO[grant.workspace].name}
                              className="flex items-center gap-1.5 rounded-full bg-navy-100 py-0.5 pr-2.5 pl-0.5 text-xs font-semibold text-brand hover:bg-navy-200"
                            >
                              <span className="grid size-5 place-items-center overflow-hidden rounded-full bg-white p-0.5">
                                <img
                                  src={WORKSPACE_INFO[grant.workspace].mark}
                                  alt={WORKSPACE_INFO[grant.workspace].name}
                                  className="max-h-full max-w-full"
                                />
                              </span>
                              {roleName(grant.roleId) ?? '—'}
                            </Link>
                          ))}
                        </div>
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
                            ...(locked
                              ? []
                              : [
                                  {
                                    icon: Trash2,
                                    label: t('common.delete'),
                                    onClick: () => setDeleting(admin),
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
          locked={editing ? lockReason(editing) : undefined}
          onClose={() => setEditing(undefined)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('admin.delete.title', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) adminsStore.remove(deleting.id)
          setDeleting(null)
          toast(t('admin.deleted'))
          logAction({
            section: 'admins',
            kind: 'delete',
            action: 'audit.a.adminDeleted',
            target: deleting?.name,
          })
        }}
      >
        <p>{t('admin.delete.message')}</p>
      </ConfirmDialog>
    </div>
  )
}
