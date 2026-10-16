import { LANG_NAMES, LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

type Props = {
  value: Lang
  onChange: (lang: Lang) => void
  /** Languages that still need text. Each gets a red dot. */
  missing?: Lang[]
}

/**
 * The small UZ / RU switch at the top right of a field or section that holds one text
 * (or one set of photos) per language. Everything without it is entered once. It switches
 * what is shown, so it looks like the other view switches: a white pill on grey.
 */
export function LangToggle({ value, onChange, missing = [] }: Props) {
  const { t } = useI18n()

  return (
    <div
      role="tablist"
      aria-label={t('form.language')}
      className="flex shrink-0 gap-0.5 rounded-lg bg-surface p-0.5"
    >
      {LANGS.map((lang) => {
        const selected = lang === value
        return (
          <button
            key={lang}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={LANG_NAMES[lang]}
            onClick={() => onChange(lang)}
            className={cn(
              'relative h-6 rounded-md px-2 text-xs font-bold uppercase transition-colors',
              selected ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted',
            )}
          >
            {lang}
            {missing.includes(lang) && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger ring-2 ring-canvas" />
            )}
          </button>
        )
      })}
    </div>
  )
}
