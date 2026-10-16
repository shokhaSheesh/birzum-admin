/** A period; both ends missing means all time. `to` counts the whole day. */
export type DateRange = { from: Date | null; to: Date | null }

export const ALL_TIME: DateRange = { from: null, to: null }

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime()

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

/** True when the date falls in the range, its last day included. */
export function inRange(date: Date, range: DateRange) {
  if (range.from && date < startOfDay(range.from)) return false
  if (range.to && date >= addDays(range.to, 1)) return false
  return true
}

/** "16.10.2026" -> a date, or null when it is not a real day. */
export function parseDate(text: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text)
  if (!match) return null
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  return date.getDate() === Number(match[1]) ? date : null
}

export const MONTHS = {
  uz: [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ],
  ru: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
}
export const WEEKDAYS = {
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
}
