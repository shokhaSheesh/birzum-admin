import { ChevronsUpDown } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WORKSPACE_INFO, WORKSPACES, workspaceOf } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { Listbox } from '@/shared/ui/Listbox'

/**
 * The business the panel is showing, at the top of the sidebar: Birzum, Fortuna Biznes or Vodiy
 * Taraqqiyot. Picking one opens its home page and its own menu.
 */
export function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const current = workspaceOf(useLocation().pathname)
  const info = WORKSPACE_INFO[current]

  return (
    <Listbox
      ariaLabel={t('workspace.label')}
      options={WORKSPACES.map((value) => ({ value, label: WORKSPACE_INFO[value].name }))}
      value={current}
      onChange={(next) => navigate(WORKSPACE_INFO[next].home)}
      fit
      triggerClassName={cn(
        'flex w-full items-center gap-2.5 rounded-control border border-line bg-canvas text-left transition-colors hover:bg-surface',
        collapsed ? 'size-11 justify-center p-0' : 'h-12 px-2.5',
      )}
      trigger={() => (
        <>
          <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-md bg-white p-0.5">
            <img src={info.mark} alt="" className="max-h-full max-w-full object-contain" />
          </span>
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-[11px] font-medium text-ink-subtle">
                  {t(current === 'birzum' ? 'workspace.birzum' : 'workspace.microloan')}
                </span>
                <span className="truncate text-sm font-semibold">{info.name}</span>
              </span>
              <ChevronsUpDown size={16} className="shrink-0 text-ink-subtle" />
            </>
          )}
        </>
      )}
    />
  )
}
