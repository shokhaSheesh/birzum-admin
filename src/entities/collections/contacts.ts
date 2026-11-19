import { createStore } from '@/shared/lib/createStore'
import { applicationsStore } from '../applications/applications'
import { clientsStore } from '../clients/clients'
import type { DebtStatus } from './debtCases'

/** How a call with a debtor went, as the Qarzdorlar call form offers it (all workspaces). */
export const CALL_RESULTS = [
  'promised',
  'askedDelay',
  'answered',
  'alreadyPaid',
  'noAnswer',
  'unavailable',
  'refused',
  'other',
] as const
export type CallResult = (typeof CALL_RESULTS)[number]

/** Results that mean the shopper was reached, for the operators' report. */
export const REACHED_RESULTS: readonly CallResult[] = [
  'promised',
  'askedDelay',
  'answered',
  'alreadyPaid',
  'refused',
  'other',
]

/**
 * One step of working with a debtor: a call and what came of it, or a reminder sent to the
 * shopper's phone and app.
 */
export type Contact = {
  id: string
  clientId: string
  /** The nasiya the call was about; a call can be written on several of a client's nasiyalar. */
  applicationId?: string
  at: Date
  /** The admin who called or sent it; "Birzum" for the automatic reminder. */
  by: string
  channel: 'call' | 'reminder'
  result?: CallResult
  /** The day the shopper promised to pay by (a promise or a delay they asked for). */
  promiseDate?: Date
  /** What the shopper said, in the operator's words. */
  clientAnswer?: string
  /** The operator's own note on the call. */
  comment?: string
  /** When to call next, set from the call. */
  nextCall?: Date
  /** The status the call moved the debt to. */
  statusAfter?: DebtStatus
}

/** The newest contact first. */
export const contactsOf = (contacts: Contact[], clientId: string) =>
  contacts
    .filter((contact) => contact.clientId === clientId)
    .sort((a, b) => b.at.getTime() - a.at.getTime())

/** The latest promise, if the shopper's last call ended in one. */
export const promiseOf = (contacts: Contact[], clientId: string) => {
  const call = contactsOf(contacts, clientId).find((contact) => contact.channel === 'call')
  return call?.promiseDate ?? null
}

const NOTES: Partial<Record<CallResult, { answer?: string; comment: string }>> = {
  promised: {
    answer: 'Maosh kechikdi, juma kuni toʻlayman.',
    comment: 'Xushmuomala, vaʼdasiga ishonsa boʻladi.',
  },
  noAnswer: { comment: 'Ikki marta qoʻngʻiroq qildim, koʻtarmadi.' },
  refused: {
    answer: 'Mahsulot buzildi, toʻlamayman.',
    comment: 'Doʻkon bilan gaplashmoqchi, merchantga xabar berish kerak.',
  },
  unavailable: { comment: 'Raqam oʻchiq, qoʻshimcha kontaktga qoʻngʻiroq qilish kerak.' },
  askedDelay: {
    answer: 'Ikki hafta muhlat bering, ishga joylashyapman.',
    comment: 'Muhlat soʻradi.',
  },
}

// Invented sample contacts with the shoppers marked late. Replace with the API.
function seed(): Contact[] {
  const out: Contact[] = []
  const results: CallResult[] = ['promised', 'noAnswer', 'refused', 'askedDelay', 'unavailable']
  const applications = applicationsStore.getAll()
  clientsStore
    .getAll()
    .filter((client) => client.late)
    .forEach((client, i) => {
      const nasiya = applications.find(
        (application) => application.clientId === client.id && application.status === 'handed',
      )
      out.push({
        id: `k${client.id}-r`,
        clientId: client.id,
        applicationId: nasiya?.id,
        at: new Date(2026, 9, 11, 10, 5),
        by: 'Birzum',
        channel: 'reminder',
      })
      // Every fourth one nobody has called yet
      if (i % 4 === 3) return
      const result = results[i % results.length]
      out.push({
        id: `k${client.id}-c`,
        clientId: client.id,
        applicationId: nasiya?.id,
        at: new Date(2026, 9, 13 + (i % 3), 11 + i, 20),
        by: i % 2 ? 'Malika Rasulova' : 'Dilshod Karimov',
        channel: 'call',
        result,
        // One promise is already broken
        promiseDate:
          result === 'promised' || result === 'askedDelay'
            ? new Date(2026, 9, i === 0 ? 17 : result === 'askedDelay' ? 30 : 22)
            : undefined,
        clientAnswer: NOTES[result]?.answer,
        comment: NOTES[result]?.comment,
      })
    })
  return out
}

export const contactsStore = createStore<Contact>(seed())
