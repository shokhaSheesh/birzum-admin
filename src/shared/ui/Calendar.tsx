import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { addDays, MONTHS, sameDay, startOfDay, WEEKDAYS } from '@/shared/lib/dates'

type Props = {
  /** The month first shown. */
  initialMonth: Date
  /** Ends of the chosen range; for a single date both are the same day. */
  from: Date | null
  to: Date | null
  onPick: (date: Date) => void
  /** Days after this cannot be picked. */
  max?: Date
}

/**
 * One month, weeks starting on Monday. Picked ends are navy circles, the days between are a
 * green band; while only the start is picked, hovering previews the band. Today is outlined.
 */
export function Calendar({ initialMonth, from, to, onPick, max }: Props) {
  const { t, lang } = useI18n()
  const [month, setMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  )
  const [hover, setHover] = useState<Date | null>(null)
  const [today] = useState(() => startOfDay(new Date()))

  const first = addDays(month, -((month.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i))
  const end = to ?? (from && hover && hover > from ? hover : null)
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1))

  return (
    <div className="flex w-72 flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label={t('calendar.prev')}
          className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold">
          {MONTHS[lang][month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={t('calendar.next')}
          className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-ink-subtle">
        {WEEKDAYS[lang].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7" onPointerLeave={() => setHover(null)}>
        {days.map((day) => {
          const outside = day.getMonth() !== month.getMonth()
          const disabled = !!max && day > max
          const isEnd = sameDay(day, from) || sameDay(day, end)
          const between = !!from && !!end && day > from && day < end
          return (
            <div
              key={day.getTime()}
              className={cn(
                'flex h-9 items-center justify-center',
                between && 'bg-green-200',
                from &&
                  end &&
                  !sameDay(from, end) &&
                  sameDay(day, from) &&
                  'rounded-l-full bg-green-200',
                from &&
                  end &&
                  !sameDay(from, end) &&
                  sameDay(day, end) &&
                  'rounded-r-full bg-green-200',
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(day)}
                onPointerEnter={() => setHover(day)}
                className={cn(
                  'grid size-9 place-items-center rounded-full text-sm tabular-nums transition-colors',
                  isEnd ? 'bg-primary font-semibold text-on-primary' : 'hover:bg-surface',
                  !isEnd && outside && 'text-ink-subtle',
                  !isEnd && sameDay(day, today) && 'ring-1 ring-navy-400 ring-inset',
                  disabled && 'cursor-default opacity-30 hover:bg-transparent',
                )}
              >
                {day.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
