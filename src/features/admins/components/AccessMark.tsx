import { Eye, Minus, PencilLine } from 'lucide-react'
import type { Access } from '@/entities/admins/roles'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

/** One cell of the comparison: an icon and the word, so colour is never the only cue. */
export function AccessMark({ access }: { access: Access }) {
  const { t } = useI18n()
  const Icon = access === 'manage' ? PencilLine : access === 'view' ? Eye : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm whitespace-nowrap',
        access === 'manage' && 'font-semibold text-success',
        access === 'view' && 'text-ink',
        access === 'none' && 'text-ink-subtle',
      )}
    >
      <Icon size={16} />
      {t(`access.${access}`)}
    </span>
  )
}
