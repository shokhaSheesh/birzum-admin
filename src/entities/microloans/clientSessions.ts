import type { LoanClient } from './loanClients'

/**
 * One phone the client signed in on. Only one is signed in at a time: signing in on a new phone
 * ends the session on the old one (31.10 call).
 */
export type ClientSession = {
  id: string
  device: string
  os: string
  ip: string
  startedAt: Date
  /** Absent while it is the signed-in one. */
  endedAt?: Date
  /** Why it ended: a new phone signed in, or the client signed out. */
  endReason?: 'newDevice' | 'signOut'
}

const PHONES = {
  ios: ['iPhone 15 Pro', 'iPhone 13', 'iPhone 12 mini'],
  android: ['Samsung Galaxy A54', 'Redmi Note 13', 'Samsung Galaxy S23'],
}
const OS = { ios: ['iOS 18.1', 'iOS 17.6'], android: ['Android 15', 'Android 14'] }
const hoursBefore = (date: Date, hours: number) => new Date(date.getTime() - hours * 3_600_000)

/** The client's sessions, newest first: the signed-in one and the ones before. Sample, by id. */
export function sessionsOf(client: LoanClient): ClientSession[] {
  const seed = [...client.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const os = client.device.os
  const ip = (n: number) =>
    `${84 + (seed % 9)}.${54 + n}.${(seed * 7 + n) % 250}.${(seed * 13 + n * 29) % 250}`
  const current: ClientSession = {
    id: `${client.id}-s0`,
    device: PHONES[os][seed % 3],
    os: OS[os][0],
    ip: ip(0),
    startedAt: hoursBefore(client.lastSeenAt, 3),
  }
  const earlier = Array.from({ length: seed % 3 }, (_, i): ClientSession => {
    const kind = (seed + i) % 2 ? 'android' : 'ios'
    // The one just before ended when the current phone signed in
    const ended = i === 0 ? current.startedAt : hoursBefore(current.startedAt, 24 * (i * 9 + 2))
    return {
      id: `${client.id}-s${i + 1}`,
      device: PHONES[kind][(seed + i + 1) % 3],
      os: OS[kind][1],
      ip: ip(i + 1),
      startedAt: hoursBefore(ended, 24 * 30),
      endedAt: ended,
      endReason: i === 0 ? 'newDevice' : 'signOut',
    }
  })
  return [current, ...earlier]
}
