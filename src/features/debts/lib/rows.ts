import { useMemo } from 'react'
import { adminsStore } from '@/entities/admins/admins'
import { applicationsStore, type Application } from '@/entities/applications/applications'
import { initialsOf } from '@/entities/clients/clients'
import { clientsStore, fullName, type Client } from '@/entities/clients/clients'
import { contactsStore, type Contact } from '@/entities/collections/contacts'
import { debtCasesStore, operatorsOf } from '@/entities/collections/debtCases'
import { debtPath } from '@/shared/config/routes'
import { newId } from '@/shared/lib/createStore'
import type { CallEntry } from '../components/DebtDialogs'
import type { BoardRow, DebtTarget } from './board'
import { lateOf, useSyncedDebtCases, type DebtCase } from '@/entities/collections/debtCases'
import { paymentsStore } from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { addDays, startOfDay } from '@/shared/lib/dates'

export type NextCallState = 'missed' | 'today' | 'later' | 'none'

/** Everything the board, the table and a file show about one late nasiya. */
export type DebtRow = {
  file: DebtCase
  application: Application
  client: Client
  merchantName: string
  late: ReturnType<typeof lateOf>
  /** Calls and reminders about this nasiya, newest first. */
  contacts: Contact[]
  /** The newest note: the operator's comment or what the shopper said. */
  lastNote?: { text: string; at: Date }
  operatorName?: string
  nextCallState: NextCallState
  openedAt: Date
}

export function nextCallStateOf(file: DebtCase, today: Date): NextCallState {
  if (!file.nextCall || file.status === 'closed') return 'none'
  if (file.nextCall.at < today) return 'missed'
  return file.nextCall.at < addDays(startOfDay(today), 1) ? 'today' : 'later'
}

/** The board's rows, kept in step with the system's opening and closing of files. */
export function useDebtRows(today: Date) {
  const cases = useSyncedDebtCases(today)
  const applications = applicationsStore.useAll()
  const clients = clientsStore.useAll()
  const payments = paymentsStore.useAll()
  const contacts = contactsStore.useAll()
  const merchants = merchantsStore.useAll()
  const admins = adminsStore.useAll()

  return useMemo(() => {
    const rows: DebtRow[] = []
    for (const file of cases) {
      const application = applications.find((item) => item.id === file.id)
      const client = clients.find((item) => item.id === file.clientId)
      if (!application || !client) continue
      const own = contacts
        .filter((contact) => contact.applicationId === file.id)
        .sort((a, b) => b.at.getTime() - a.at.getTime())
      const noted = own.find((contact) => contact.comment || contact.clientAnswer)
      rows.push({
        file,
        application,
        client,
        merchantName: merchants.find((item) => item.id === application.merchantId)?.name ?? '—',
        late: lateOf(application, payments, today),
        contacts: own,
        lastNote: noted
          ? { text: (noted.clientAnswer ?? noted.comment)!, at: noted.at }
          : undefined,
        operatorName: admins.find((admin) => admin.id === file.operatorId)?.name,
        nextCallState: nextCallStateOf(file, today),
        openedAt: file.history[0]?.at ?? today,
      })
    }
    // The latest first, then the bigger sum
    return rows.sort((a, b) => b.late.days - a.late.days || b.late.overdue - a.late.overdue)
  }, [cases, applications, clients, payments, contacts, merchants, admins, today])
}

/** Half-hour slots of the working day, for the call times. */
export const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hours = 8 + Math.floor(i / 2)
  return `${String(hours).padStart(2, '0')}:${i % 2 ? '30' : '00'}`
})

/** The slot at or just before a moment, e.g. 14:47 → 14:30. */
export const slotOf = (date: Date) => {
  const hours = Math.min(21, Math.max(8, date.getHours()))
  const half = date.getHours() < 8 ? '00' : date.getMinutes() >= 30 ? '30' : '00'
  return `${String(hours).padStart(2, '0')}:${half}`
}

/** A day picked in a `DateField` plus a slot. */
export const atSlot = (day: Date, slot: string) => {
  const [hours, minutes] = slot.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes)
}

/** "18.11.2026" for a `DateField`. */
export const dateText = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`

/** A Birzum debt as the shared board and table show it. */
export const toBoardRow = (row: DebtRow): BoardRow => ({
  file: row.file,
  name: fullName(row.client),
  phone: row.client.phone,
  initials: initialsOf(row.client),
  photoUrl: row.client.photoUrl,
  personKey: row.client.id,
  ref: `№${row.application.number}`,
  sub: `${row.application.lines[0]?.name ?? ''} · ${row.merchantName}`,
  groupId: row.application.merchantId,
  overdue: row.late.overdue,
  overdueCount: row.late.overdueCount,
  days: row.late.days,
  remaining: row.late.remaining,
  lastNote: row.lastNote,
  operatorName: row.operatorName,
  nextCallState: row.nextCallState,
  openedAt: row.openedAt,
  href: debtPath(row.file.id),
})

/** What the shared dialogs need for a Birzum debt. */
export const birzumTarget = (name: string, id: string): DebtTarget => ({
  name,
  href: debtPath(id),
  section: 'debts',
  store: debtCasesStore,
  operators: operatorsOf('birzum'),
})

/** Keeps a call on a Birzum nasiya. */
export const saveBirzumCall = (clientId: string) => (fileId: string, entry: CallEntry) =>
  contactsStore.save({
    id: newId(),
    clientId,
    applicationId: fileId,
    channel: 'call',
    ...entry,
  })
