import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export type RowAction = {
  icon: LucideIcon
  /** Read by screen readers and shown on hover. */
  label: string
  onClick: () => void
  danger?: boolean
}

/**
 * The icon buttons at the end of a table row, e.g. edit and delete. They never trigger the
 * row's own click.
 */
export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {actions.map(({ icon: Icon, label, onClick, danger }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-label={label}
          title={label}
          className={cn(
            'grid size-9 place-items-center rounded-full text-ink-subtle transition-colors',
            danger ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-surface hover:text-ink',
          )}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
