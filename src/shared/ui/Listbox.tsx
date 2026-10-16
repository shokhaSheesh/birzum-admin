import { Check, ChevronDown, Search } from 'lucide-react'
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { usePopover } from '@/shared/lib/usePopover'

export type ListOption<T extends string> = {
  value: T
  label: string
  /** Drawn indented under the option before it, e.g. a subcategory. */
  indent?: boolean
  disabled?: boolean
}

type Props<T extends string> = {
  options: ListOption<T>[]
  value: T
  onChange: (value: T) => void
  /** What the closed button looks like; it gets the open state. */
  trigger: (props: { open: boolean; selected?: ListOption<T> }) => ReactNode
  triggerClassName: string
  /** Read by screen readers when the button has no visible label. */
  ariaLabel?: string
  id?: string
  disabled?: boolean
  /** Popover width follows the button, or fits its longest option. */
  fit?: boolean
}

/**
 * The popover list behind `FilterSelect` and `SelectField`: a button, then a card of options
 * under it with the chosen one ticked. Long lists get a search. Arrows move, Enter picks,
 * Esc or a click outside closes.
 */
export function Listbox<T extends string>({
  options,
  value,
  onChange,
  trigger,
  triggerClassName,
  ariaLabel,
  id,
  disabled,
  fit,
}: Props<T>) {
  const { t } = useI18n()
  const { open, setOpen, ref } = usePopover()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const selected = options.find((option) => option.value === value)
  const needle = query.trim().toLowerCase()
  const shown = options.filter((option) => option.label.toLowerCase().includes(needle))
  const searchable = options.length > 8

  const show = () => {
    setQuery('')
    setActive(Math.max(0, options.indexOf(selected!)))
    setOpen(true)
  }
  const pick = (option: ListOption<T>) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        show()
      }
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((at) => Math.min(shown.length - 1, Math.max(0, at + step)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (shown[active]) pick(shown[active])
    } else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div ref={ref} className="relative" onKeyDown={onKey}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        className={triggerClassName}
      >
        {trigger({ open, selected })}
      </button>
      {open && (
        <div
          className={cn(
            'popover absolute top-full left-0 z-30 mt-1.5 flex max-h-80 flex-col rounded-card border border-line bg-canvas p-1.5 shadow-[0_12px_32px_-12px_rgb(7_42_60/0.35)]',
            fit ? 'w-max max-w-80 min-w-full' : 'w-full',
          )}
        >
          {searchable && (
            <label className="mb-1 flex h-9 shrink-0 items-center gap-2 rounded-control bg-surface px-2.5 text-ink-subtle">
              <Search size={16} className="shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder={t('common.search')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </label>
          )}
          <ul id={listId} role="listbox" className="min-h-0 overflow-y-auto">
            {shown.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-muted">{t('common.nothingFound')}</li>
            )}
            {shown.map((option, index) => {
              const chosen = option.value === value
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={chosen}
                  aria-disabled={option.disabled || undefined}
                  onPointerEnter={() => setActive(index)}
                  onClick={() => pick(option)}
                  className={cn(
                    'flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-sm',
                    option.indent && 'pl-7',
                    index === active && 'bg-surface',
                    chosen
                      ? 'font-semibold text-ink'
                      : option.indent
                        ? 'text-ink-muted'
                        : 'text-ink',
                    option.disabled && 'cursor-default opacity-40',
                  )}
                >
                  <span className="min-w-0 flex-1 whitespace-nowrap">{option.label}</span>
                  {chosen && <Check size={16} className="shrink-0 text-brand" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/** The chevron at the end of a select button, turned while it is open. */
export function SelectChevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      size={18}
      aria-hidden
      className={cn('shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
    />
  )
}
