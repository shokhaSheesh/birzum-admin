import { Fragment, useState } from 'react'
import { OPS, type Op } from '@/entities/admins/roles'
import {
  MERCHANT_PAGE_GROUPS,
  MERCHANT_PAGES,
  type MerchantPage,
  type MerchantRole,
} from '@/entities/merchants/merchantRoles'
import { merchantRolesStore, saveMerchantRoles } from '@/entities/merchants/merchantRolesApi'
import { attempt } from '@/shared/api/createRemoteStore'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { TableCheckbox } from '@/shared/ui/TableCheckbox'

type RoleId = MerchantRole['id']
type Draft = Record<RoleId, MerchantRole['access']>
const toDraft = (roles: MerchantRole[]) =>
  Object.fromEntries(roles.map((role) => [role.id, role.access])) as Draft

// Adding, changing or deleting needs seeing: ticking one ticks Koʻrish, unticking Koʻrish clears the row
const withOp = (current: Op[], op: Op, on: boolean): Op[] => {
  if (op === 'read') return on ? ['read', ...current.filter((o) => o !== 'read')] : []
  const next = on ? [...current, op] : current.filter((o) => o !== op)
  return on && !next.includes('read') ? ['read', ...next] : next
}
const sameOps = (a: Op[], b: Op[]) => a.length === b.length && a.every((op) => b.includes(op))
const opsOf = (key: MerchantPage) => MERCHANT_PAGES.find((page) => page.key === key)!.ops

/**
 * What FlexSoft's two merchant roles, Administrator and Sotuvchi, may do in the merchant app:
 * every page as a row and, under each role, Koʻrish · Yaratish · Tahrirlash · Oʻchirish, with a
 * checkbox where the page offers that action and a dash where it does not. The roles themselves
 * come from FlexSoft at sign-in and cannot be added or renamed here. Changes apply after Saqlash.
 */
export function MerchantRolesPage() {
  const { t } = useI18n()
  const saved = merchantRolesStore.useAll()
  const loading = merchantRolesStore.useLoading()
  // The checkboxes start from the saved roles, so the table opens once they are here
  if (saved.length === 0)
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 py-8 lg:px-8">
        <EmptyState title={t(loading ? 'common.loading' : 'products.empty')} />
      </div>
    )
  return <MerchantRolesTable saved={saved} />
}

function MerchantRolesTable({ saved }: { saved: MerchantRole[] }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Draft>(() => toDraft(saved))
  const roles = saved.map((role) => role.id)
  const dirty = saved.some((role) =>
    MERCHANT_PAGES.some((page) => !sameOps(draft[role.id][page.key], role.access[page.key])),
  )

  const toggle = (id: RoleId, key: MerchantPage, op: Op) =>
    setDraft((all) => {
      const current = all[id][key]
      return { ...all, [id]: { ...all[id], [key]: withOp(current, op, !current.includes(op)) } }
    })

  const toggleColumn = (id: RoleId, keys: MerchantPage[], op: Op) =>
    setDraft((all) => {
      const able = keys.filter((key) => opsOf(key).includes(op))
      const allOn = able.every((key) => all[id][key].includes(op))
      const next = { ...all[id] }
      for (const key of able) next[key] = withOp(next[key], op, !allOn)
      return { ...all, [id]: next }
    })

  const columnState = (id: RoleId, keys: MerchantPage[], op: Op) => {
    const able = keys.filter((key) => opsOf(key).includes(op))
    const on = able.filter((key) => draft[id][key].includes(op)).length
    return on === 0 ? false : on === able.length ? true : 'mixed'
  }

  const save = () =>
    attempt(
      () => saveMerchantRoles(roles.map((id) => ({ id, access: draft[id] }))),
      () => toast(t('mrole.saved')),
    )

  // A line between the roles, on each role's first column
  const roleEdge = (i: number) => (i === 0 ? 'border-l border-line' : '')
  const cell = 'w-24 px-2 text-center'

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
        <Button size="sm" className="px-4!" disabled={!dirty} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      </ActionBar>

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 py-8 lg:px-8">
        <p className="text-sm text-ink-muted">{t('mrole.note')}</p>
        <section className="overflow-x-auto rounded-card border border-line bg-canvas">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border-b border-line px-6 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase"
                >
                  {t('mrole.page')}
                </th>
                {roles.map((id) => (
                  <th
                    key={id}
                    colSpan={OPS.length}
                    className="border-l border-line px-2 pt-3 pb-1 text-center text-sm font-bold"
                  >
                    {t(`mrole.role.${id}`)}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-line">
                {roles.flatMap((id) =>
                  OPS.map((op, i) => (
                    <th
                      key={`${id}-${op}`}
                      className={cn(
                        cell,
                        'pt-1 pb-3 text-[11px] font-semibold tracking-wide text-ink-muted uppercase',
                        roleEdge(i),
                      )}
                    >
                      {t(`op.${op}`)}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {MERCHANT_PAGE_GROUPS.map((group) => {
                const keys = group.pages.map((page) => page.key)
                return (
                  <Fragment key={group.title}>
                    <tr className="bg-surface/60">
                      <td className="px-6 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase">
                        {t(group.title)}
                      </td>
                      {roles.flatMap((id) =>
                        OPS.map((op, i) => (
                          <td key={`${id}-${op}`} className={cn(cell, 'py-2', roleEdge(i))}>
                            {keys.length > 1 && keys.some((key) => opsOf(key).includes(op)) && (
                              <span className="inline-flex">
                                <TableCheckbox
                                  label={`${t(`mrole.role.${id}`)}: ${t(group.title)}: ${t(`op.${op}`)}`}
                                  checked={columnState(id, keys, op)}
                                  onChange={() => toggleColumn(id, keys, op)}
                                />
                              </span>
                            )}
                          </td>
                        )),
                      )}
                    </tr>
                    {group.pages.map((page) => (
                      <tr key={page.key} className="border-b border-line last:border-b-0">
                        <td className="px-6 py-3 font-medium">{t(`mrole.page.${page.key}`)}</td>
                        {roles.flatMap((id) =>
                          OPS.map((op, i) => (
                            <td key={`${id}-${op}`} className={cn(cell, 'py-3', roleEdge(i))}>
                              {page.ops.includes(op) ? (
                                <span className="inline-flex">
                                  <TableCheckbox
                                    label={`${t(`mrole.role.${id}`)}: ${t(`mrole.page.${page.key}`)}: ${t(`op.${op}`)}`}
                                    checked={draft[id][page.key].includes(op)}
                                    onChange={() => toggle(id, page.key, op)}
                                  />
                                </span>
                              ) : (
                                <span className="text-ink-subtle" title={t('op.unavailable')}>
                                  —
                                </span>
                              )}
                            </td>
                          )),
                        )}
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>
    </>
  )
}
