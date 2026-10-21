import { Search, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { usePopover } from '@/shared/lib/usePopover'
import { controlClass } from './control'
import { Field } from './Field'
import { SelectChevron } from './Listbox'
import { TableCheckbox } from './TableCheckbox'

export type MultiOption = {
  value: string
  label: string
  /** A quieter second line, e.g. the phone number. */
  sub?: string
  /** A photo or logo before the name. */
  leading?: ReactNode
}

/** `all`: every option, including ones added later. Otherwise the ticked ones. */
export type MultiValue = { all: boolean; ids: string[] }

type Props = {
  label: string
  options: MultiOption[]
  value: MultiValue
  onChange: (value: MultiValue) => void
  /** e.g. "Barcha klientlar". Left out, there is no "Hammasi" row: only ticked ones count. */
  allLabel?: string
  placeholder: string
  hint?: string
  error?: string
}

/**
 * Pick one, several or all of a long list in a form. The box shows "Hammasi" or the picked
 * names as removable chips; the list under it has a search, a "Hammasi" checkbox on top (a
 * minus when only some are ticked) and a checkbox per row. It stays open while ticking.
 */
export function MultiSelectField({
  label,
  options,
  value,
  onChange,
  allLabel,
  placeholder,
  hint,
  error,
}: Props) {
  const { t } = useI18n()
  const id = useId()
  const { open, setOpen, ref } = usePopover()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = options.filter(
    (option) =>
      needle === '' ||
      option.label.toLowerCase().includes(needle) ||
      !!option.sub?.toLowerCase().includes(needle),
  )
  const picked = value.all ? options.map((o) => o.value) : value.ids
  const isOn = (v: string) => value.all || value.ids.includes(v)
  const toggle = (v: string) => {
    const next = isOn(v) ? picked.filter((x) => x !== v) : [...picked, v]
    onChange({ all: !!allLabel && next.length === options.length, ids: next })
  }
  const allState = value.all ? true : value.ids.length ? 'mixed' : false
  const chosen = options.filter((o) => value.ids.includes(o.value))

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div ref={ref} className="relative">
        <div
          id={id}
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
            }
          }}
          className={cn(
            controlClass(!!error),
            'h-auto min-h-13 cursor-pointer flex-wrap justify-between py-2',
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {value.all ? (
              <span className="font-medium">
                {allLabel} · {options.length}
              </span>
            ) : chosen.length === 0 ? (
              <span className="text-ink-subtle">{placeholder}</span>
            ) : (
              <>
                {chosen.slice(0, 3).map((option) => (
                  <span
                    key={option.value}
                    className="flex items-center gap-1 rounded-full bg-green-200 py-1 pr-1 pl-2.5 text-sm font-medium"
                  >
                    {option.label}
                    <button
                      type="button"
                      aria-label={`${t('common.remove')}: ${option.label}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggle(option.value)
                      }}
                      className="grid size-5 place-items-center rounded-full hover:bg-canvas"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {chosen.length > 3 && (
                  <span className="text-sm text-ink-muted">
                    {t('multi.more', { count: String(chosen.length - 3) })}
                  </span>
                )}
              </>
            )}
          </span>
          <SelectChevron open={open} />
        </div>

        {open && (
          <div className="popover absolute top-full left-0 z-30 mt-1.5 flex max-h-96 w-full flex-col rounded-card border border-line bg-canvas p-1.5 shadow-[0_12px_32px_-12px_rgb(7_42_60/0.35)]">
            <label className="mb-1 flex h-9 shrink-0 items-center gap-2 rounded-control bg-surface px-2.5 text-ink-subtle">
              <Search size={16} className="shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </label>
            {needle === '' && allLabel && (
              <div
                onClick={() => onChange({ all: !value.all, ids: [] })}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border-b border-line px-3 py-2 text-sm font-semibold hover:bg-surface"
              >
                <TableCheckbox
                  label={allLabel}
                  checked={allState}
                  onChange={() => onChange({ all: !value.all, ids: [] })}
                />
                <span className="flex-1">{allLabel}</span>
                <span className="text-ink-muted tabular-nums">{options.length}</span>
              </div>
            )}
            <ul role="listbox" aria-multiselectable className="min-h-0 overflow-y-auto">
              {shown.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-muted">{t('common.nothingFound')}</li>
              )}
              {shown.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isOn(option.value)}
                  onClick={() => toggle(option.value)}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-1.5 text-sm hover:bg-surface"
                >
                  <TableCheckbox
                    label={option.label}
                    checked={isOn(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  {option.leading}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{option.label}</span>
                    {option.sub && (
                      <span className="truncate text-xs text-ink-muted tabular-nums">
                        {option.sub}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Field>
  )
}
