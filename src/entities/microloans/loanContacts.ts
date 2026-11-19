import type { CallResult } from '@/entities/collections/contacts'
import type { DebtStatus } from '@/entities/collections/debtCases'
import { loansStore } from '@/entities/microloans/loans'
import { createStore } from '@/shared/lib/createStore'

/**
 * One step of working with a late loan: a call and what came of it, or the automatic reminder the
 * brand sends. The same results as Birzum's Qarzdorlar.
 */
export type LoanContact = {
  id: string
  loanId: string
  at: Date
  /** The admin who called or sent it; the brand's name for the automatic reminder. */
  by: string
  channel: 'call' | 'reminder'
  result?: CallResult
  /** The day the borrower promised to pay by (a promise or a delay they asked for). */
  promiseDate?: Date
  /** What the person said, in the operator's words. */
  clientAnswer?: string
  /** The operator's own note. */
  comment?: string
  nextCall?: Date
  /** The status the call moved the debt to. */
  statusAfter?: DebtStatus
  /** Who picked up when it was not the borrower: one of their contacts, e.g. "Dilnoza (opa-singil)". */
  whom?: string
}

/** The newest first. */
export const contactsOfLoan = (contacts: LoanContact[], loanId: string) =>
  contacts
    .filter((contact) => contact.loanId === loanId)
    .sort((a, b) => b.at.getTime() - a.at.getTime())

/** The promise from the latest call, if it ended in one. */
export const promiseOfLoan = (contacts: LoanContact[], loanId: string) => {
  const call = contactsOfLoan(contacts, loanId).find((contact) => contact.channel === 'call')
  return call?.promiseDate ?? null
}

const NOTES: Partial<Record<CallResult, { answer?: string; comment: string }>> = {
  promised: {
    answer: 'Maosh kechikdi, juma kuni toʻlayman.',
    comment: 'Vaʼdasiga ishonsa boʻladi.',
  },
  noAnswer: { comment: 'Ikki marta qoʻngʻiroq qildim, koʻtarmadi.' },
  refused: {
    answer: 'Biznesim yopildi, hozir toʻlay olmayman.',
    comment: 'Kontaktlariga qoʻngʻiroq qilish kerak.',
  },
  askedDelay: { answer: 'Ikki hafta muhlat bering, mol sotilyapti.', comment: 'Muhlat soʻradi.' },
  unavailable: { comment: 'Raqam oʻchiq, qoʻshimcha kontaktga qoʻngʻiroq qilish kerak.' },
}

const DAY = 86_400_000
const BRAND_NAME = { fortuna: 'Fortuna Biznes', vodiy: 'Vodiy Taraqqiyot' } as const

// Sample contacts with the late loans: the automatic reminder the day after, and most got a
// call. Replace with the API.
function seed(): LoanContact[] {
  const out: LoanContact[] = []
  const results: CallResult[] = ['promised', 'noAnswer', 'refused', 'askedDelay', 'unavailable']
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
        by: i % 2 ? 'Dilshod Karimov' : 'Sardor Saidov',
        channel: 'call',
        result,
        // The first promise was for two days later and has passed; the others are still ahead
        promiseDate:
          result === 'promised' || result === 'askedDelay'
            ? new Date(
                i === 0
                  ? at.getTime() + 2 * DAY
                  : Date.now() + (result === 'askedDelay' ? 12 : 3) * DAY,
              )
            : undefined,
        clientAnswer: NOTES[result]?.answer,
        comment: NOTES[result]?.comment,
      })
    })
  return out
}

export const loanContactsStore = createStore<LoanContact>(seed())
