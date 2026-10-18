import { CONTACT_RESULTS, type ContactResult } from '@/entities/collections/contacts'
import { loansStore } from '@/entities/microloans/loans'
import { createStore } from '@/shared/lib/createStore'

export { CONTACT_RESULTS, type ContactResult }

/**
 * One step of working with a late loan: a call and what came of it, or a reminder sent to the
 * borrower's phone and app. The same results as Birzum's Undiruv.
 */
export type LoanContact = {
  id: string
  loanId: string
  at: Date
  /** The admin who called or sent it; the brand's name for the automatic reminder. */
  by: string
  channel: 'call' | 'reminder'
  result?: ContactResult
  /** The day the borrower promised to pay by. */
  promiseDate?: Date
  comment?: string
}

/** The newest first. */
export const contactsOfLoan = (contacts: LoanContact[], loanId: string) =>
  contacts
    .filter((contact) => contact.loanId === loanId)
    .sort((a, b) => b.at.getTime() - a.at.getTime())

/** The promise from the latest call, if it ended in one. */
export const promiseOfLoan = (contacts: LoanContact[], loanId: string) => {
  const call = contactsOfLoan(contacts, loanId).find((contact) => contact.channel === 'call')
  return call?.result === 'promised' ? (call.promiseDate ?? null) : null
}

const NOTES: Record<ContactResult, string> = {
  promised: 'Maosh kechikdi, juma kuni toʻlashini aytdi.',
  noAnswer: 'Ikki marta qoʻngʻiroq qildim, koʻtarmadi.',
  refused: 'Biznesi yopilganini aytdi, hozircha toʻlay olmaydi.',
  wrongNumber: 'Raqam boshqa odamga tegishli ekan.',
}

const DAY = 86_400_000
const BRAND_NAME = { fortuna: 'Fortuna Biznes', vodiy: 'Vodiy Taraqqiyot' } as const

// Sample contacts with the late loans: the automatic reminder the day after, and most got a
// call. Replace with the API.
function seed(): LoanContact[] {
  const out: LoanContact[] = []
  const results: ContactResult[] = ['promised', 'noAnswer', 'promised', 'refused', 'noAnswer']
  loansStore
    .getAll()
    .filter((loan) => loan.overdueSince && !loan.closedAt)
    .forEach((loan, i) => {
      const since = loan.overdueSince!.getTime()
      out.push({
        id: `${loan.id}-r`,
        loanId: loan.id,
        at: new Date(since + DAY + 10 * 3_600_000),
        by: BRAND_NAME[loan.brand],
        channel: 'reminder',
      })
      // Every fourth one nobody has called yet
      if (i % 4 === 3) return
      const result = results[i % results.length]
      // A few days ago, and never before the second day late
      const recent = Date.now() - (1 + (i % 5)) * DAY + (i % 6) * 3_600_000
      const at = new Date(
        Math.max(since + 2 * DAY + 11 * 3_600_000, Math.min(recent, Date.now() - 3_600_000)),
      )
      out.push({
        id: `${loan.id}-c`,
        loanId: loan.id,
        at,
        by: i % 2 ? 'Malika Rasulova' : 'Sardor Nematov',
        channel: 'call',
        result,
        // The first promise was for two days later and has passed; the others are still ahead
        promiseDate:
          result === 'promised'
            ? new Date(i === 0 ? at.getTime() + 2 * DAY : Date.now() + 3 * DAY)
            : undefined,
        comment: NOTES[result],
      })
    })
  return out
}

export const loanContactsStore = createStore<LoanContact>(seed())
