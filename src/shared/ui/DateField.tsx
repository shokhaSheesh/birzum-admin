import { CalendarDays } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { parseDate } from '@/shared/lib/dates'
import { formatDate } from '@/shared/lib/format'
import { usePopover } from '@/shared/lib/usePopover'
import { Calendar } from './Calendar'
import { controlClass } from './control'
import { Field } from './Field'

type Props = {
  label: string
  /** "16.10.2026", or empty. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
}

/** One date in a form: the field box, opening our calendar. */
export function DateField({ label, value, onChange, placeholder, hint, error }: Props) {
  const id = useId()
  const { open, setOpen, ref } = usePopover()
  const date = parseDate(value)
  const [today] = useState(() => new Date())

  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <div ref={ref} className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(controlClass(!!error), 'justify-between')}
        >
          <span className={cn('tabular-nums', !date && 'text-ink-subtle')}>
            {date ? formatDate(date) : placeholder}
          </span>
          <CalendarDays size={20} className="shrink-0 text-ink-muted" />
        </button>
        {open && (
          <div
            role="dialog"
            aria-label={label}
            className="popover absolute top-full left-0 z-30 mt-1.5 rounded-card border border-line bg-canvas p-3 shadow-[0_12px_32px_-12px_rgb(7_42_60/0.35)]"
          >
            <Calendar
              initialMonth={date ?? today}
              from={date}
              to={date}
              onPick={(day) => {
                onChange(formatDate(day))
                setOpen(false)
              }}
            />
          </div>
        )}
      </div>
    </Field>
  )
}
