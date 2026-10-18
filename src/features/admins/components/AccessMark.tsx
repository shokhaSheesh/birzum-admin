import { Eye, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import { opsOf, type Op } from '@/entities/admins/roles'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

const ICONS: Record<Op, LucideIcon> = { read: Eye, create: Plus, update: Pencil, delete: Trash2 }

/**
 * One cell of the comparison: the page's actions as four small icons, dark when the role has
 * it, faint when not, missing when the page does not offer it. "—" when the role cannot even
 * open the page. Each icon names itself for screen readers and on hover.
 */
export function AccessMark({ section, ops }: { section: string; ops: Op[] }) {
  const { t } = useI18n()
  if (!ops.includes('read')) return <span className="text-sm text-ink-subtle">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      {opsOf(section).map((op) => {
        const Icon = ICONS[op]
        const on = ops.includes(op)
        return (
          <span
            key={op}
            title={`${t(`op.${op}`)}: ${t(on ? 'op.yes' : 'op.no')}`}
            aria-label={`${t(`op.${op}`)}: ${t(on ? 'op.yes' : 'op.no')}`}
            className={cn(
              'grid size-6 place-items-center rounded-md',
              on ? 'bg-green-200 text-ink' : 'text-navy-200',
            )}
          >
            <Icon size={14} />
          </span>
        )
      })}
    </span>
  )
}
