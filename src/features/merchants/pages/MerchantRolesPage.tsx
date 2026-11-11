import { Fragment, useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  MERCHANT_PERMISSION_GROUPS,
  merchantRolesStore,
  type MerchantPermission,
  type MerchantRole,
} from '@/entities/merchants/merchantRoles'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { TableCheckbox } from '@/shared/ui/TableCheckbox'

const th = 'w-40 px-4 py-3 text-center text-xs font-semibold tracking-wide text-ink-muted uppercase'

type Draft = Record<MerchantRole['id'], MerchantPermission[]>
const toDraft = (roles: MerchantRole[]) =>
  Object.fromEntries(roles.map((role) => [role.id, role.permissions])) as Draft

/**
 * What FlexSoft's two merchant roles, Administrator and Sotuvchi, may do in the merchant app:
 * every permission as a row, a checkbox per role. The roles themselves come from FlexSoft at
 * sign-in and cannot be added or renamed here. Changes apply after Saqlash.
 */
export function MerchantRolesPage() {
  const { t } = useI18n()
  const saved = merchantRolesStore.useAll()
  const [draft, setDraft] = useState<Draft>(() => toDraft(saved))
  const roles = saved.map((role) => role.id)
  const dirty = roles.some(
    (id) =>
      draft[id].length !== saved.find((role) => role.id === id)!.permissions.length ||
      draft[id].some((key) => !saved.find((role) => role.id === id)!.permissions.includes(key)),
  )

  const toggle = (id: MerchantRole['id'], key: MerchantPermission) =>
    setDraft((all) => ({
      ...all,
      [id]: all[id].includes(key) ? all[id].filter((k) => k !== key) : [...all[id], key],
    }))

  const save = () => {
    roles.forEach((id) => merchantRolesStore.save({ id, permissions: draft[id] }))
    toast(t('mrole.saved'))
    logAction({ section: 'merchantRoles', kind: 'update', action: 'audit.a.merchantRolesSaved' })
  }

  return (
    <>
      <ActionBar eyebrow={t('navGroup.partners')} title={t('nav.merchantRoles')}>
        <Button
          size="sm"
          variant="ghost"
          className="px-4!"
          disabled={!dirty}
          onClick={() => setDraft(toDraft(saved))}
        >
          {t('common.cancel')}
        </Button>
        <Button size="sm" className="px-4!" disabled={!dirty} onClick={save}>
          {t('common.save')}
        </Button>
      </ActionBar>

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 py-8 lg:px-8">
        <p className="text-sm text-ink-muted">{t('mrole.note')}</p>
        <section className="overflow-x-auto rounded-card border border-line bg-canvas">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {t('mrole.permission')}
                </th>
                {roles.map((id) => (
                  <th key={id} className={th}>
                    {t(`mrole.role.${id}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MERCHANT_PERMISSION_GROUPS.map((group) => (
                <Fragment key={group.title}>
                  <tr className="bg-surface/60">
                    <td
                      colSpan={roles.length + 1}
                      className="px-6 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                    >
                      {t(group.title)}
                    </td>
                  </tr>
                  {group.permissions.map((key) => (
                    <tr key={key} className="border-b border-line last:border-b-0">
                      <td className="px-6 py-3 font-medium">{t(`mrole.perm.${key}`)}</td>
                      {roles.map((id) => (
                        <td key={id} className="px-4 py-3 text-center">
                          <span className="inline-flex">
                            <TableCheckbox
                              label={`${t(`mrole.role.${id}`)}: ${t(`mrole.perm.${key}`)}`}
                              checked={draft[id].includes(key)}
                              onChange={() => toggle(id, key)}
                            />
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  )
}
