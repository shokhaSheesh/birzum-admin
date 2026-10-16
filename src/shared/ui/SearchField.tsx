import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { controlClass, inputClass } from './control'

type Props = {
  /** Read by screen readers; the placeholder is the visible prompt. */
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  /** Called when the keyboard's search key (Enter) is pressed. */
  onSubmit?: () => void
}

export function SearchField({ label, placeholder, value, onChange, autoFocus, onSubmit }: Props) {
  const { t } = useI18n()
  const id = useId()

  return (
    <div role="search" className={controlClass()}>
      <Search size={20} className="shrink-0 text-ink-subtle" />
      <input
        id={id}
        type="search"
        enterKeyHint="search"
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={label}
        placeholder={placeholder}
        className={`${inputClass} [&::-webkit-search-cancel-button]:hidden`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.clear')}
          className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-subtle active:bg-surface"
        >
          <X size={20} />
        </button>
      )}
    </div>
  )
}
