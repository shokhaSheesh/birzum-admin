/** Who a contact is to the client. Birzum's shoppers use the first six. */
export const RELATIONS = [
  'spouse',
  'parent',
  'child',
  'brother',
  'sister',
  'relative',
  'friend',
  'colleague',
] as const
export type Relation = (typeof RELATIONS)[number]

/**
 * Someone to call when the client cannot be reached, from the client's own list (Birzum:
 * Profil → Kontaktlar, also added by the shop; microloans: Profil → Kontaktlarim).
 */
export type PersonContact = { name?: string; phone: string; relation: Relation; comment?: string }

const NAMES = ['Dilnoza', 'Akmal', 'Shahnoza', 'Bekzod', 'Madina', 'Sardor', 'Nilufar', 'Jamshid']
const NOTES = ['', '', 'Ishda, 18:00 dan keyin', '', 'Faqat Telegram orqali', '']

/** Two or three sample contacts, the same every time for the same key. Replace with the API. */
export function sampleContacts(
  key: string,
  relations: readonly Relation[] = RELATIONS,
  withNames = true,
) {
  let seed = [...key].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 1_000_003, 7)
  const next = () => (seed = (seed * 48_271) % 2_147_483_647) / 2_147_483_647
  const count = 2 + Math.floor(next() * 2)
  // Different people and relations, stepping through the lists from a random start
  const name0 = Math.floor(next() * NAMES.length)
  const rel0 = Math.floor(next() * relations.length)
  return Array.from({ length: count }, (_, k): PersonContact => ({
    name: withNames ? NAMES[(name0 + k * 3) % NAMES.length] : undefined,
    phone: `9${1 + Math.floor(next() * 8)}${String(1_000_000 + Math.floor(next() * 8_999_999)).slice(0, 7)}`,
    relation: relations[(rel0 + k * 2) % relations.length],
    comment: NOTES[Math.floor(next() * NOTES.length)] || undefined,
  }))
}
