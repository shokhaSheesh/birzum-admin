// Stand-in for the client app's analytics (app stores and the app's own events). The numbers
// are invented but steady: the same day always gives the same figures.

/** The first day the app was in the stores. */
export const LAUNCH_DAY = new Date(2026, 8, 1)

const DAY = 24 * 60 * 60 * 1000
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** A steady 0..1 number for a day and a salt. */
function noise(date: Date, salt: number) {
  const n = Math.sin(startOfDay(date).getTime() / DAY + salt * 12.9898) * 43758.5453
  return n - Math.floor(n)
}

/** Installs on one day: growing since launch, busier at the weekend. */
export function downloadsOn(date: Date) {
  if (date < LAUNCH_DAY) return 0
  const days = (startOfDay(date).getTime() - LAUNCH_DAY.getTime()) / DAY
  const weekend = [0, 6].includes(date.getDay()) ? 1.25 : 1
  return Math.round((60 + days * 1.6) * weekend * (0.8 + noise(date, 1) * 0.4))
}

/** Installs between two moments, whole days only. */
export function downloadsIn(from: Date, to: Date) {
  let total = 0
  for (let day = startOfDay(from); day <= to; day = new Date(day.getTime() + DAY)) {
    total += downloadsOn(day)
  }
  return total
}

/** People who opened the app on a day. */
export function activeOn(date: Date) {
  if (date < LAUNCH_DAY) return 0
  const days = (startOfDay(date).getTime() - LAUNCH_DAY.getTime()) / DAY
  return Math.round((180 + days * 9) * (0.85 + noise(date, 2) * 0.3))
}

/** Distinct people over the days up to `date`: daily users overlap, so it grows slower. */
export function activeOver(date: Date, days: number) {
  let sum = 0
  for (let i = 0; i < days; i++) sum += activeOn(new Date(date.getTime() - i * DAY))
  return Math.round(sum / Math.pow(days, 0.42))
}

/**
 * When installs happen across a week, Monday first, hour by hour: evenings and lunch are busy,
 * nights quiet, the weekend busier. Each row sums to that weekday's share.
 */
export const DOWNLOAD_HEAT: number[][] = Array.from({ length: 7 }, (_, weekday) => {
  const weekend = weekday >= 5 ? 1.3 : 1
  return Array.from({ length: 24 }, (_, hour) => {
    const lunch = Math.exp(-((hour - 13) ** 2) / 4)
    const evening = Math.exp(-((hour - 20.5) ** 2) / 5) * 1.6
    const night = hour < 7 ? 0.05 : 0.15
    return (night + lunch + evening) * weekend
  })
})

/** Sign-up steps in the client app, in order. */
export const SIGNUP_STEPS = ['opened', 'phone', 'code', 'details', 'face', 'done'] as const
export type SignupStep = (typeof SIGNUP_STEPS)[number]

/** Share of those who opened the app that reach each step. */
const REACHED: Record<SignupStep, number> = {
  opened: 1,
  phone: 0.81,
  code: 0.74,
  details: 0.57,
  face: 0.49,
  done: 0.44,
}

/** Median minutes spent on a step by those who left there, from opening the app. */
const LEFT_AFTER_MINUTES: Record<SignupStep, number> = {
  opened: 0.7,
  phone: 1.4,
  code: 2.2,
  details: 6.5,
  face: 8.1,
  done: 0,
}

/** How many reach each step, how many stop there, and after how long they stop. */
export function signupFunnel(opened: number) {
  return SIGNUP_STEPS.map((step, i) => {
    const reached = Math.round(opened * REACHED[step])
    const next = SIGNUP_STEPS[i + 1]
    const left = next ? reached - Math.round(opened * REACHED[next]) : 0
    return { step, reached, left, leftAfterMinutes: LEFT_AFTER_MINUTES[step] }
  })
}

/** Views of a thing (a product or a shop) over a period, steady for its id. */
export function viewsOf(id: string, from: Date, to: Date) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  const weight = 0.3 + (hash % 100) / 100
  return Math.round(downloadsIn(from, to) * 2.4 * weight)
}
