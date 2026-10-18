import { Copy, LayoutGrid, Lock, Pencil, Plus, Table2, Trash2 } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminsStore, initialsOfName } from '@/entities/admins/admins'
import {
  PERMISSION_GROUPS,
  reachOf,
  rolesStore,
  SPECIAL_ACTIONS,
  type Role,
} from '@/entities/admins/roles'
import { ROUTES, roleEditPath, roleNewPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { ViewToggle } from '@/shared/ui/ViewToggle'
import { AccessMark } from '../components/AccessMark'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * What each role may do. Two views: the roles as cards (what each can reach, who has it), and
 * a comparison with every page as a row and every role as a column. A role is created and
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
  const highlight = params.get('role')
  const holders = (role: Role) => admins.filter((admin) => admin.roleId === role.id)

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.roles')}
        description={t('roles.description')}
        actions={
          <Button onClick={() => navigate(roleNewPath())}>
            <Plus size={20} />
            {t('role.add')}
          </Button>
        }
      />
      <div className="self-start">
        <ViewToggle
          label={t('nav.roles')}
          options={[
            { value: 'cards', label: t('roles.view.cards'), icon: LayoutGrid },
            { value: 'compare', label: t('roles.view.compare'), icon: Table2 },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const reach = reachOf(role.access)
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
                {roles.map((role) => (
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
              {PERMISSION_GROUPS.map((group) => (
                <Fragment key={group.title}>
                  <tr className="bg-surface/60">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                    >
                      {t(group.title)}
                    </td>
                  </tr>
                  {group.sections.map((section) => (
                    <tr key={section.key} className="border-b border-line">
                      <td className="sticky left-0 bg-canvas px-4 py-2.5 text-sm font-medium">
                        {t(section.label)}
                      </td>
                      {roles.map((role) => (
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
                  colSpan={roles.length + 1}
                  className="px-4 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                >
                  {t('role.actions')}
                </td>
              </tr>
              {SPECIAL_ACTIONS.map((action) => (
                <tr key={action.key} className="border-b border-line last:border-b-0">
                  <td className="sticky left-0 bg-canvas px-4 py-2.5 text-sm font-medium">
                    {t(`role.action.${action.key}`)}
                  </td>
                  {roles.map((role) => (
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
