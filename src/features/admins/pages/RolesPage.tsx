import { Copy, LayoutGrid, Lock, Pencil, Plus, Table2, Trash2 } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminsStore, initialsOfName } from '@/entities/admins/admins'
import {
  actionsFor,
  PERMISSION_GROUPS,
  reachOf,
  rolesStore,
  scopeOf,
  type Role,
  type Scope,
} from '@/entities/admins/roles'
import { WORKSPACE_INFO } from '@/shared/config/workspaces'
import { ROUTES, roleEditPath, roleNewPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { SegmentedTabs } from '@/shared/ui/SegmentedTabs'
import { ViewToggle } from '@/shared/ui/ViewToggle'
import { AccessMark } from '../components/AccessMark'
import { logAction } from '@/entities/audit/audit'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * What each role may do. Two views: the roles as cards (its businesses, what it can reach, who has
 * it), and a comparison of one page set (Birzum's or the microloan brands') with every page as a
 * row and every role made for it as a column. A role is created and
 * edited on its own page; the Bosh admin role is fixed.
 */
export function RolesPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const roles = rolesStore.useAll()
  const admins = adminsStore.useAll()
  const [params] = useSearchParams()
  const [view, setView] = useState<'cards' | 'compare'>('cards')
  const [deleting, setDeleting] = useState<Role | null>(null)
  const [scope, setScope] = useState<Scope>('birzum')
  const shown = roles.filter((role) => role.brands.some((brand) => scopeOf(brand) === scope))
  const highlight = params.get('role')
  const holders = (role: Role) =>
    admins.filter((admin) => admin.grants.some((grant) => grant.roleId === role.id))

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.roles')}
        actions={
          <Button onClick={() => navigate(roleNewPath())}>
            <Plus size={20} />
            {t('role.add')}
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <ViewToggle
          label={t('nav.roles')}
          options={[
            { value: 'cards', label: t('roles.view.cards'), icon: LayoutGrid },
            { value: 'compare', label: t('roles.view.compare'), icon: Table2 },
          ]}
          value={view}
          onChange={setView}
        />
        {view === 'compare' && (
          <SegmentedTabs
            label={t('role.brands')}
            options={(['birzum', 'microloans'] as const).map((value) => ({
              value,
              label: t(`role.scopeTab.${value}`),
            }))}
            value={scope}
            onChange={setScope}
          />
        )}
      </div>

      {view === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const reach = reachOf(role.access, role.brands)
            const people = holders(role)
            return (
              <section
                key={role.id}
                onClick={() => !role.system && navigate(roleEditPath(role.id))}
                className={cn(
                  'flex flex-col gap-4 rounded-card border bg-canvas p-5',
                  highlight === role.id ? 'border-primary' : 'border-line',
                  !role.system && 'cursor-pointer hover:bg-surface/40',
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      {role.name}
                      {role.system && <Lock size={16} className="text-ink-subtle" />}
                    </h2>
                    <p className="text-sm text-ink-muted">{role.description}</p>
                  </div>
                  <RowActions
                    actions={[
                      ...(role.system
                        ? []
                        : [
                            {
                              icon: Pencil,
                              label: t('common.edit'),
                              onClick: () => navigate(roleEditPath(role.id)),
                            },
                          ]),
                      {
                        icon: Copy,
                        label: t('role.copy'),
                        onClick: () => navigate(roleNewPath(role.id)),
                      },
                      ...(role.system
                        ? []
                        : [
                            {
                              icon: Trash2,
                              label: t('common.delete'),
                              onClick: () => setDeleting(role),
                              danger: true,
                            },
                          ]),
                    ]}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.brands.map((brand) => (
                    <span
                      key={brand}
                      className="flex items-center gap-1.5 rounded-full border border-line py-0.5 pr-2.5 pl-0.5 text-xs font-semibold"
                    >
                      <span className="grid size-5 place-items-center overflow-hidden rounded-full bg-white p-0.5">
                        <img
                          src={WORKSPACE_INFO[brand].mark}
                          alt=""
                          className="max-h-full max-w-full"
                        />
                      </span>
                      {WORKSPACE_INFO[brand].name}
                    </span>
                  ))}
                </div>
                <dl className="grid grid-cols-3 gap-2 rounded-control bg-surface p-3 text-center">
                  {(
                    [
                      [t('roles.stat.open'), reach.open],
                      [t('roles.stat.manage'), reach.manage],
                      [t('roles.stat.actions'), role.actions.length],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <dd className="text-xl font-bold tabular-nums">{value}</dd>
                      <dt className="text-xs text-ink-muted">{label}</dt>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {people.slice(0, 4).map((admin) => (
                      <span key={admin.id} className="rounded-full ring-2 ring-canvas">
                        <Avatar size="sm" initials={initialsOfName(admin.name)} />
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-ink-muted">
                    {people.length
                      ? t('roles.holders', { count: String(people.length) })
                      : t('roles.noHolders')}
                  </span>
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-canvas">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-line">
                <th className={`${th} sticky left-0 bg-canvas`}>{t('roles.page')}</th>
                {shown.map((role) => (
                  <th key={role.id} className={`${th} normal-case`}>
                    <button
                      type="button"
                      disabled={role.system}
                      onClick={() => navigate(roleEditPath(role.id))}
                      className="flex items-center gap-1.5 text-sm font-bold text-ink enabled:hover:underline"
                    >
                      {role.name}
                      {role.system && <Lock size={14} className="text-ink-subtle" />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.filter((group) => group.scope === scope).map((group) => (
                <Fragment key={group.title}>
                  <tr className="bg-surface/60">
                    <td
                      colSpan={shown.length + 1}
                      className="px-4 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                    >
                      {t(group.title)}
                    </td>
                  </tr>
                  {group.sections.map((section) => (
                    <tr key={section.key} className="border-b border-line">
                      <td className="sticky left-0 bg-canvas px-4 py-2.5 text-sm font-medium">
                        {t(section.short ?? section.label)}
                      </td>
                      {shown.map((role) => (
                        <td key={role.id} className="px-4 py-2.5">
                          <AccessMark section={section.key} ops={role.access[section.key] ?? []} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
              <tr className="bg-surface/60">
                <td
                  colSpan={shown.length + 1}
                  className="px-4 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                >
                  {t('role.actions')}
                </td>
              </tr>
              {actionsFor([scope === 'birzum' ? 'birzum' : 'fortuna']).map((action) => (
                <tr key={action.key} className="border-b border-line last:border-b-0">
                  <td className="sticky left-0 bg-canvas px-4 py-2.5 text-sm font-medium">
                    {t(`role.action.${action.key}`)}
                  </td>
                  {shown.map((role) => (
                    <td key={role.id} className="px-4 py-2.5">
                      {role.actions.includes(action.key) ? (
                        <span className="text-sm font-semibold text-success">{t('op.yes')}</span>
                      ) : (
                        <span className="text-sm text-ink-subtle">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={
          deleting && holders(deleting).length ? t('common.cantDelete') : t('role.delete.title')
        }
        confirmLabel={deleting && holders(deleting).length ? undefined : t('common.delete')}
        cancelLabel={deleting && holders(deleting).length ? t('common.understood') : undefined}
        onConfirm={() => {
          if (deleting) rolesStore.remove(deleting.id)
          setDeleting(null)
          toast(t('role.deleted'))
          logAction({
            section: 'roles',
            kind: 'delete',
            action: 'audit.a.roleDeleted',
            target: deleting?.name,
          })
        }}
      >
        <p>
          {deleting && holders(deleting).length
            ? t('role.delete.blocked', { count: String(holders(deleting).length) })
            : t('role.delete.message', { name: deleting?.name ?? '' })}
        </p>
        {deleting && holders(deleting).length > 0 && (
          <Button
            variant="secondary"
            className="mt-2 self-start"
            onClick={() => navigate(`${ROUTES.admins}`)}
          >
            {t('nav.admins')}
          </Button>
        )}
      </ConfirmDialog>
    </div>
  )
}
