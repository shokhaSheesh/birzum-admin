import { Fragment } from 'react'
import { opsOf, OPS, PERMISSION_GROUPS, scopeOf, type Op } from '@/entities/admins/roles'
import type { Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { TableCheckbox } from '@/shared/ui/TableCheckbox'

type Access = Record<string, Op[]>

/**
 * Every page as a row and Koʻrish · Yaratish · Tahrirlash · Oʻchirish as columns, with a
 * checkbox where the page offers that action and a dash where it does not. Each group has a
 * checkbox per column for all its pages. Adding, changing or deleting needs seeing, so ticking
 * one of them ticks Koʻrish too, and unticking Koʻrish clears the row. Only the page sets the
 * role's businesses need are shown: Birzum's, the microloan brands', or both under a heading each.
 */
export function PermissionTable({
  access,
  onChange,
  brands,
}: {
  access: Access
  onChange: (access: Access) => void
  brands: Workspace[]
}) {
  const { t } = useI18n()
  const scopes = [...new Set(brands.map(scopeOf))].sort((a) => (a === 'birzum' ? -1 : 1))
  const both = scopes.length > 1

  const withOp = (current: Op[], op: Op, on: boolean): Op[] => {
    if (op === 'read') return on ? ['read', ...current.filter((o) => o !== 'read')] : []
    const next = on ? [...current, op] : current.filter((o) => o !== op)
    return on && !next.includes('read') ? ['read', ...next] : next
  }
  const toggle = (key: string, op: Op) => {
    const current = access[key] ?? []
    onChange({ ...access, [key]: withOp(current, op, !current.includes(op)) })
  }
  const toggleColumn = (keys: string[], op: Op) => {
    const able = keys.filter((key) => opsOf(key).includes(op))
    const allOn = able.every((key) => access[key]?.includes(op))
    onChange({
      ...access,
      ...Object.fromEntries(able.map((key) => [key, withOp(access[key] ?? [], op, !allOn)])),
    })
  }
  const columnState = (keys: string[], op: Op) => {
    const able = keys.filter((key) => opsOf(key).includes(op))
    const on = able.filter((key) => access[key]?.includes(op)).length
    return on === 0 ? false : on === able.length ? true : 'mixed'
  }
  const th =
    'w-28 px-2 py-3 text-center text-xs font-semibold tracking-wide text-ink-muted uppercase'

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-y border-line">
            <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {t('roles.page')}
            </th>
            {OPS.map((op) => (
              <th key={op} className={th}>
                {t(`op.${op}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scopes.flatMap((scope) => [
            ...(both
              ? [
                  <tr key={scope} className="border-b border-line">
                    <td colSpan={OPS.length + 1} className="px-6 pt-5 pb-2 text-base font-bold">
                      {t(`role.scope.${scope}`)}
                    </td>
                  </tr>,
                ]
              : []),
            ...PERMISSION_GROUPS.filter((group) => group.scope === scope).map((group) => {
              const keys = group.sections.map((s) => s.key)
              return (
                <Fragment key={`${scope}-${group.title}`}>
                  <tr className="bg-surface/60">
                    <td className="px-6 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase">
                      {t(group.title)}
                    </td>
                    {OPS.map((op) => (
                      <td key={op} className="px-2 py-2 text-center">
                        {keys.some((key) => opsOf(key).includes(op)) && keys.length > 1 && (
                          <span className="inline-flex">
                            <TableCheckbox
                              label={`${t(group.title)}: ${t(`op.${op}`)}`}
                              checked={columnState(keys, op)}
                              onChange={() => toggleColumn(keys, op)}
                            />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {group.sections.map((section) => (
                    <tr key={section.key} className="border-b border-line last:border-b-0">
                      <td className="px-6 py-3 font-medium">{t(section.short ?? section.label)}</td>
                      {OPS.map((op) => (
                        <td key={op} className="px-2 py-3 text-center">
                          {section.ops.includes(op) ? (
                            <span className="inline-flex">
                              <TableCheckbox
                                label={`${t(section.short ?? section.label)}: ${t(`op.${op}`)}`}
                                checked={!!access[section.key]?.includes(op)}
                                onChange={() => toggle(section.key, op)}
                              />
                            </span>
                          ) : (
                            <span className="text-ink-subtle" title={t('op.unavailable')}>
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              )
            }),
          ])}
        </tbody>
      </table>
    </div>
  )
}
