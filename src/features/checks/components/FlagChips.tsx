import type { CheckFlag } from '@/entities/applications/checks'
import { useI18n } from '@/shared/i18n/useI18n'

/** The warning signs as small chips. */
export function FlagChips({ flags }: { flags: CheckFlag[] }) {
  const { t } = useI18n()
  if (flags.length === 0) return <span className="text-sm text-ink-subtle">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <span
          key={flag}
          className="rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-warning"
        >
          {t(`check.flag.${flag}`)}
        </span>
      ))}
    </span>
  )
}
