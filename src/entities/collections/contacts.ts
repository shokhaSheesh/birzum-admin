import { createStore } from '@/shared/lib/createStore'
import { clientsStore } from '../clients/clients'

export const CONTACT_RESULTS = ['promised', 'noAnswer', 'refused', 'wrongNumber'] as const
export type ContactResult = (typeof CONTACT_RESULTS)[number]

/**
 * One step of working with a debtor: a call and what came of it, or a reminder sent to the
 * shopper's phone and app.
 */
export type Contact = {
  id: string
  clientId: string
  at: Date
  /** The admin who called or sent it; "Birzum" for the automatic reminder. */
  by: string
  channel: 'call' | 'reminder'
  result?: ContactResult
  /** The day the shopper promised to pay by. */
  promiseDate?: Date
  comment?: string
}

/** The newest contact first. */
export const contactsOf = (contacts: Contact[], clientId: string) =>
  contacts
    .filter((contact) => contact.clientId === clientId)
    .sort((a, b) => b.at.getTime() - a.at.getTime())

/** The latest promise, if the shopper's last call ended in one. */
export const promiseOf = (contacts: Contact[], clientId: string) => {
  const call = contactsOf(contacts, clientId).find((contact) => contact.channel === 'call')
  return call?.result === 'promised' ? (call.promiseDate ?? null) : null
}

const NOTES: Record<ContactResult, string> = {
  promised: 'Maosh kechikdi, juma kuni toʻlashini aytdi.',
  noAnswer: 'Ikki marta qoʻngʻiroq qildim, koʻtarmadi.',
  refused: 'Mahsulotdan norozi, doʻkon bilan gaplashmoqchi.',
  wrongNumber: 'Raqam boshqa odamga tegishli ekan.',
}

// Invented sample contacts with the shoppers marked late. Replace with the API.
function seed(): Contact[] {
  const out: Contact[] = []
  const results: ContactResult[] = ['promised', 'noAnswer', 'promised', 'refused', 'noAnswer']
  clientsStore
    .getAll()
    .filter((client) => client.late)
    .forEach((client, i) => {
      out.push({
        id: `k${client.id}-r`,
        clientId: client.id,
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
        at: new Date(2026, 9, 13 + (i % 3), 11 + i, 20),
        by: i % 2 ? 'Malika Rasulova' : 'Sardor Nematov',
        channel: 'call',
        result,
        // One promise is already broken
        promiseDate: result === 'promised' ? new Date(2026, 9, i === 0 ? 17 : 22) : undefined,
        comment: NOTES[result],
      })
    })
  return out
}

export const contactsStore = createStore<Contact>(seed())
