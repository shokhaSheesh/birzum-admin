import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import type { TranslationKey } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { addDays, ALL_TIME, sameDay, startOfDay, type DateRange } from '@/shared/lib/dates'
import { formatDate } from '@/shared/lib/format'
import { usePopover } from '@/shared/lib/usePopover'
import { Calendar } from './Calendar'

type Preset = { key: TranslationKey; range: (today: Date) => DateRange }

const PRESETS: Preset[] = [
  { key: 'range.today', range: (d) => ({ from: d, to: d }) },
  { key: 'range.yesterday', range: (d) => ({ from: addDays(d, -1), to: addDays(d, -1) }) },
  { key: 'range.last7', range: (d) => ({ from: addDays(d, -6), to: d }) },
  { key: 'range.last30', range: (d) => ({ from: addDays(d, -29), to: d }) },
  {
    key: 'range.thisMonth',
    range: (d) => ({ from: new Date(d.getFullYear(), d.getMonth(), 1), to: d }),
  },
  {
    key: 'range.lastMonth',
    range: (d) => ({
      from: new Date(d.getFullYear(), d.getMonth() - 1, 1),
      to: new Date(d.getFullYear(), d.getMonth(), 0),
    }),
  },
  { key: 'range.all', range: () => ALL_TIME },
]

const same = (a: DateRange, b: DateRange) =>
  (a.from === b.from || sameDay(a.from, b.from)) && (a.to === b.to || sameDay(a.to, b.to))

type Props = {
  /** Read by screen readers, e.g. "Sana". */
  label: string
  value: DateRange
  onChange: (range: DateRange) => void
}

/**
 * Filters a table by a period: ready periods on the left, a calendar on the right. On the
 * calendar the first click is the start, the second the end, and the filter applies then.
 * The button names the preset or shows the dates, and is navy-outlined while a period is set.
 */
export function DateRangePicker({ label, value, onChange }: Props) {
  const { t } = useI18n()
  const { open, setOpen, ref } = usePopover()
  const [today] = useState(() => startOfDay(new Date()))
  const [draft, setDraft] = useState<DateRange>(value)

  const preset = PRESETS.find((item) => same(item.range(today), value))
  const text = preset
    ? t(preset.key)
    : value.from && value.to
      ? sameDay(value.from, value.to)
        ? formatDate(value.from)
        : `${formatDate(value.from)} – ${formatDate(value.to)}`
      : t('range.all')
  const set = !!value.from || !!value.to

  const apply = (range: DateRange) => {
    onChange(range)
    setOpen(false)
  }
  const pick = (day: Date) => {
    if (!draft.from || draft.to) setDraft({ from: day, to: null })
    else apply(day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(value)
          setOpen(!open)
        }}
        className={cn(
          'flex h-10 items-center gap-2 rounded-control border bg-canvas px-3 text-sm whitespace-nowrap transition-colors',
          set
            ? 'border-primary font-semibold text-ink'
            : 'border-line text-ink hover:border-navy-400',
        )}
      >
        <CalendarDays size={18} className="shrink-0 text-ink-muted" />
        {text}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="popover absolute top-full right-0 z-30 mt-1.5 flex gap-4 rounded-card border border-line bg-canvas p-3 shadow-[0_12px_32px_-12px_rgb(7_42_60/0.35)]"
        >
          <ul className="flex w-40 flex-col gap-0.5 border-r border-line pr-3">
            {PRESETS.map((item) => {
              const chosen = item === preset
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => apply(item.range(today))}
                    className={cn(
                      'flex h-9 w-full items-center rounded-control px-3 text-left text-sm',
                      chosen ? 'bg-primary font-semibold text-on-primary' : 'hover:bg-surface',
                    )}
                  >
                    {t(item.key)}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-col gap-2">
            <Calendar
              initialMonth={value.to ?? today}
              from={draft.from}
              to={draft.to}
              onPick={pick}
              max={today}
            />
            <p className="text-center text-xs text-ink-subtle">
              {draft.from && !draft.to ? t('range.pickEnd') : t('range.pickStart')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
