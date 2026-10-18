import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { adminsStore, initialsOfName } from '@/entities/admins/admins'
import {
  actionsFor,
  keysFor,
  reachOf,
  rolesStore,
  SECTION_KEYS,
  SECTIONS,
  SPECIAL_ACTIONS,
  type Op,
  type Role,
  type SpecialAction,
} from '@/entities/admins/roles'
import { WORKSPACE_INFO, type Workspace } from '@/shared/config/workspaces'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FormSection } from '@/shared/ui/FormSection'
import { Switch } from '@/shared/ui/Switch'
import { TextField } from '@/shared/ui/TextField'
import { BrandChecks } from '../components/BrandChecks'
import { PermissionTable } from '../components/PermissionTable'
import { logAction } from '@/entities/audit/audit'

const blank = () =>
  Object.fromEntries(SECTION_KEYS.map((key) => [key, [] as Op[]])) as Record<string, Op[]>

/**
 * Create or edit a role: its name, what it is for and which businesses it can be given for; then
 * the pages those businesses need (Birzum's, the microloan brands', or both) with Koʻrish ·
 * Yaratish · Tahrirlash · Oʻchirish, then the sensitive actions, each only possible with the
 * permission it needs on its page. "Nusxa olish" opens it filled from another role.
 */
export function RoleFormPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const roles = rolesStore.useAll()
  const admins = adminsStore.useAll()
  const existing = roles.find((role) => role.id === id)
  const source = existing ?? roles.find((role) => role.id === params.get('from'))

  const [name, setName] = useState(
    existing?.name ?? (source ? `${source.name} (${t('role.copyName')})` : ''),
  )
  const [description, setDescription] = useState(source?.description ?? '')
  const [brands, setBrands] = useState<Workspace[]>(source?.brands ?? ['birzum'])
  const [access, setAccess] = useState<Record<string, Op[]>>(
    source ? { ...source.access } : blank(),
  )
  const [actions, setActions] = useState<SpecialAction[]>(
    source && !source.system ? [...source.actions] : [],
  )
  const [submitted, setSubmitted] = useState(false)

  if (existing?.system)
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        <EmptyState title={t('role.system')} />
      </div>
    )

  const taken = roles.some(
    (role) => role.id !== existing?.id && role.name.toLowerCase() === name.trim().toLowerCase(),
  )
  const nameError = !name.trim() ? t('error.required') : taken ? t('role.error.taken') : undefined
  const { open, manage } = reachOf(access, brands)
  const offered = actionsFor(brands)
  // An action needs its permission on its page; taking that away drops the action
  const allowed = (key: SpecialAction) => {
    const action = SPECIAL_ACTIONS.find((a) => a.key === key)!
    return offered.some((item) => item.key === key) && !!access[action.section]?.includes(action.op)
  }
  const liveActions = actions.filter(allowed)
  const people = existing
    ? admins.filter((admin) => admin.grants.some((grant) => grant.roleId === existing.id))
    : []
  // A business cannot be taken off while someone holds the role there
  const stillUsed = existing
    ? admins.flatMap((admin) =>
        admin.grants
          .filter((grant) => grant.roleId === existing.id && !brands.includes(grant.workspace))
          .map((grant) => ({ admin, workspace: grant.workspace })),
      )
    : []
  const brandsError =
    brands.length === 0
      ? t('role.error.brands')
      : stillUsed.length
        ? t('role.error.brandInUse', {
            brand: WORKSPACE_INFO[stillUsed[0].workspace].name,
            names: [...new Set(stillUsed.map((item) => item.admin.name))].join(', '),
          })
        : undefined

  const save = () => {
    setSubmitted(true)
    if (nameError || brandsError) return
    // Pages of a page set the role no longer has are cleared
    const keys = keysFor(brands)
    const record: Role = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      description: description.trim(),
      brands,
      access: Object.fromEntries(
        SECTION_KEYS.map((key) => [key, keys.includes(key) ? access[key] : []]),
      ),
      actions: liveActions,
    }
    if (existing) rolesStore.update(existing.id, record)
    else rolesStore.replaceAll([...rolesStore.getAll(), record])
    toast(t(existing ? 'toast.saved' : 'role.created'))
    logAction({
      section: 'roles',
      kind: existing ? 'update' : 'create',
      action: existing ? 'audit.a.roleSaved' : 'audit.a.roleCreated',
      target: record.name,
    })
    navigate(ROUTES.roles)
  }

  return (
    <>
      <ActionBar
        eyebrow={t('nav.roles')}
        title={existing ? existing.name : t('role.new')}
        onBack={() => navigate(ROUTES.roles)}
      >
        <Button size="sm" variant="ghost" className="px-4!" onClick={() => navigate(ROUTES.roles)}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" className="px-4!" onClick={save}>
          {t(existing ? 'common.save' : 'role.create')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="flex flex-col gap-6">
          <FormSection title={t('role.about')}>
            <TextField
              label={t('role.name')}
              placeholder={t('role.name.placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={submitted ? nameError : undefined}
            />
            <TextField
              label={t('role.description')}
              placeholder={t('role.description.placeholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <BrandChecks
              label={t('role.brands')}
              value={brands}
              onChange={setBrands}
              hint={t('role.brands.hint')}
              error={brandsError && (submitted || stillUsed.length) ? brandsError : undefined}
            />
          </FormSection>

          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <div className="flex flex-col gap-1 p-6 pb-4">
              <h2 className="text-lg font-bold">{t('role.pages')}</h2>
              <p className="text-sm text-ink-muted">{t('role.pages.hint')}</p>
            </div>
            {brands.length === 0 ? (
              <p className="border-t border-line px-6 py-8 text-center text-sm text-ink-muted">
                {t('role.pages.pickBrands')}
              </p>
            ) : (
              <PermissionTable access={access} onChange={setAccess} brands={brands} />
            )}
          </section>

          <FormSection title={t('role.actions')} hint={t('role.actions.hint')}>
            <ul className="-my-2 flex flex-col">
              {offered.map((action) => {
                const can = allowed(action.key)
                const page = SECTIONS.find((s) => s.key === action.section)!
                return (
                  <li
                    key={action.key}
                    className="flex items-center gap-4 border-b border-line py-3 last:border-b-0"
                  >
                    <div className={cn('flex min-w-0 flex-1 flex-col', !can && 'opacity-50')}>
                      <span className="font-medium">{t(`role.action.${action.key}`)}</span>
                      <span className="text-sm text-ink-muted">
                        {can
                          ? t(`role.action.${action.key}.hint`)
                          : t('role.action.needs', {
                              page: t(page.short ?? page.label),
                              op: t(`op.${action.op}`),
                            })}
                      </span>
                    </div>
                    {can ? (
                      <Switch
                        checked={actions.includes(action.key)}
                        onChange={(on) =>
                          setActions(
                            on ? [...actions, action.key] : actions.filter((a) => a !== action.key),
                          )
                        }
                        label={t(`role.action.${action.key}`)}
                      />
                    ) : (
                      <span className="text-xs text-ink-subtle">{t('op.no')}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </FormSection>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
            <h2 className="font-bold">{t('role.summary')}</h2>
            <dl className="grid grid-cols-3 gap-2 rounded-control bg-surface p-3 text-center">
              {(
                [
                  [t('roles.stat.open'), open],
                  [t('roles.stat.manage'), manage],
                  [t('roles.stat.actions'), liveActions.length],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dd className="text-xl font-bold tabular-nums">{value}</dd>
                  <dt className="text-xs text-ink-muted">{label}</dt>
                </div>
              ))}
            </dl>
            {open === 0 && <p className="text-sm text-warning">{t('role.empty')}</p>}
          </section>
          {existing && (
            <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
              <h2 className="font-bold">{t('roles.holders', { count: String(people.length) })}</h2>
              {people.length === 0 ? (
                <p className="text-sm text-ink-muted">{t('roles.noHolders')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {people.map((admin) => (
                    <li key={admin.id} className="flex items-center gap-2 text-sm">
                      <Avatar size="sm" initials={initialsOfName(admin.name)} />
                      <span className="font-medium">{admin.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-ink-subtle">{t('role.appliesNow')}</p>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
