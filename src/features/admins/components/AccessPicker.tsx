import type { Access } from '@/entities/admins/roles'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

const LEVELS: Access[] = ['none', 'view', 'manage']

/**
 * Yoʻq · Koʻrish · Boshqarish for one page, as a small segmented control. A page that only
 * shows things (Arizalar, Mahsulotlar) offers no Boshqarish.
 */
export function AccessPicker({
  label,
  value,
  onChange,
  viewOnly,
  disabled,
}: {
  label: string
  value: Access
  onChange: (value: Access) => void
  viewOnly?: boolean
  disabled?: boolean
}) {
  const { t } = useI18n()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex shrink-0 gap-0.5 rounded-full bg-surface p-0.5"
    >
      {LEVELS.map((level) => {
        const off = disabled || (viewOnly && level === 'manage')
        const on = value === level
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={off}
            onClick={() => onChange(level)}
            className={cn(
              'h-8 min-w-24 rounded-full px-3 text-sm font-semibold transition-colors disabled:cursor-default',
              on
                ? level === 'manage'
                  ? 'bg-primary text-on-primary'
                  : level === 'view'
                    ? 'bg-canvas text-ink shadow-sm'
                    : 'bg-canvas text-ink-muted shadow-sm'
                : 'text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:text-ink-muted',
            )}
          >
            {t(`access.${level}`)}
          </button>
        )
      })}
    </div>
  )
}
