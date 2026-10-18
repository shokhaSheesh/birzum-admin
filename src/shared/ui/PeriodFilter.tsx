import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { startOfDay, type DateRange } from '@/shared/lib/dates'
import { boundsOf, PERIOD_UNITS, shiftPeriod, type Period } from '@/shared/lib/period'
import { usePeriodLabel } from '@/shared/lib/usePeriodLabel'
import { usePopover } from '@/shared/lib/usePopover'
import { Calendar } from './Calendar'

/**
 * The one period a whole page is about: Kun · Hafta · Oy · Yil · Oraliq · Butun davr on the
 * left, and on the right ‹ the current one › to step back and forward, or the picked range,
 * which opens our calendar. "Bugun" jumps back to the period holding today.
 */
export function PeriodFilter({
  value,
  onChange,
}: {
  value: Period
  onChange: (period: Period) => void
}) {
  const { t } = useI18n()
  const { open, setOpen, ref } = usePopover()
  const [today] = useState(() => startOfDay(new Date()))
  const [draft, setDraft] = useState<DateRange>(value.range)
  const bounds = boundsOf(value)

  const label = usePeriodLabel(value)
  const holdsToday = (!bounds.from || bounds.from <= today) && (!bounds.to || bounds.to >= today)
  const steps = value.unit !== 'range' && value.unit !== 'all'

  const pick = (day: Date) => {
    if (!draft.from || draft.to) setDraft({ from: day, to: null })
    else {
      const range = day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day }
      setDraft(range)
      onChange({ ...value, unit: 'range', range })
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label={t('period.label')}
        className="flex max-w-full gap-1 overflow-x-auto rounded-control bg-surface p-1"
      >
        {PERIOD_UNITS.map((unit) => {
          const selected = unit === value.unit
          return (
            <button
              key={unit}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                if (unit === 'range') {
                  // Start from what is shown now, so the calendar opens on familiar days
                  const range = value.unit === 'all' ? { from: today, to: today } : bounds
                  setDraft(range)
                  onChange({ ...value, unit, range })
                  setOpen(true)
                } else onChange({ ...value, unit, anchor: holdsToday ? today : value.anchor })
              }}
              className={cn(
                'h-9 shrink-0 rounded-[10px] px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                selected ? 'bg-raised text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              )}
            >
              {t(`period.${unit}`)}
            </button>
          )
        })}
      </div>

      <div ref={ref} className="relative flex items-center gap-1">
        {steps && !holdsToday && (
          <button
            type="button"
            onClick={() => onChange({ ...value, anchor: today })}
            className="mr-1 h-9 rounded-full px-3 text-sm font-semibold text-brand hover:bg-surface"
          >
            {t('period.today')}
          </button>
        )}
        {steps && (
          <button
            type="button"
            aria-label={t('period.prev')}
            title={t('period.prev')}
            onClick={() => onChange(shiftPeriod(value, -1))}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {value.unit === 'range' ? (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              setDraft(value.range)
              setOpen(!open)
            }}
            className="flex h-10 items-center gap-2 rounded-control border border-primary bg-canvas px-3 text-sm font-semibold whitespace-nowrap tabular-nums"
          >
            <CalendarDays size={18} className="shrink-0 text-ink-muted" />
            {label}
          </button>
        ) : (
          value.unit !== 'all' && (
            <span className="min-w-36 text-center text-sm font-semibold whitespace-nowrap tabular-nums">
              {label}
            </span>
          )
        )}
        {steps && (
          <button
            type="button"
            aria-label={t('period.next')}
            title={t('period.next')}
            onClick={() => onChange(shiftPeriod(value, 1))}
            className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface"
          >
            <ChevronRight size={18} />
          </button>
        )}
        {open && value.unit === 'range' && (
          <div
            role="dialog"
            aria-label={t('period.range')}
            className="popover absolute top-full right-0 z-30 mt-1.5 flex flex-col gap-2 rounded-card border border-line bg-canvas p-3 shadow-[0_12px_32px_-12px_rgb(7_42_60/0.35)]"
          >
            <Calendar
              initialMonth={draft.to ?? draft.from ?? today}
              from={draft.from}
              to={draft.to}
              onPick={pick}
            />
            <p className="text-center text-xs text-ink-subtle">
              {draft.from && !draft.to ? t('range.pickEnd') : t('range.pickStart')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
