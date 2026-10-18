import { Check } from 'lucide-react'
import { WORKSPACE_INFO, WORKSPACES, type Workspace } from '@/shared/config/workspaces'
import { cn } from '@/shared/lib/cn'

/** Tick the businesses, each a card with its logo and name: Birzum, Fortuna, Vodiy. */
export function BrandChecks({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string
  value: Workspace[]
  onChange: (value: Workspace[]) => void
  error?: string
  hint?: string
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="pb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {WORKSPACES.map((workspace) => {
          const on = value.includes(workspace)
          return (
            <button
              key={workspace}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() =>
                onChange(
                  on
                    ? value.filter((item) => item !== workspace)
                    : WORKSPACES.filter((item) => item === workspace || value.includes(item)),
                )
              }
              className={cn(
                'flex min-h-14 items-center gap-2.5 rounded-control border px-3 py-2 text-left transition-colors',
                on ? 'border-primary bg-green-200/50' : 'border-line hover:border-navy-400',
              )}
            >
              <span className="relative shrink-0">
                <span className="grid size-8 place-items-center overflow-hidden rounded-lg border border-line bg-white p-1">
                  <img
                    src={WORKSPACE_INFO[workspace].mark}
                    alt=""
                    className="max-h-full max-w-full"
                  />
                </span>
                {on && (
                  <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-primary text-on-primary ring-2 ring-canvas">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-tight font-semibold">
                {WORKSPACE_INFO[workspace].name}
              </span>
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        hint && <p className="text-sm text-ink-muted">{hint}</p>
      )}
    </fieldset>
  )
}
