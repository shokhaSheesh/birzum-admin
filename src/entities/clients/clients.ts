import humoLogo from '@/shared/assets/cards/humo.png'
import uzcardLogo from '@/shared/assets/cards/uzcard.png'
import user1 from '@/shared/assets/people/user-1.jpg'
import user2 from '@/shared/assets/people/user-2.jpg'
import user3 from '@/shared/assets/people/user-3.jpg'
import user4 from '@/shared/assets/people/user-4.jpg'
import { createStore } from '@/shared/lib/createStore'

export const CARD_LOGOS = { humo: humoLogo, uzcard: uzcardLogo }
export type Card = { id: string; brand: keyof typeof CARD_LOGOS; last4: string; expiry: string }

export const BLOCK_REASONS = ['fraud', 'request', 'debt', 'other'] as const
export type BlockReason = (typeof BLOCK_REASONS)[number]
/** A blocked shopper can still sign in and pay, but cannot start a new nasiya. */
export type Block = { reason: BlockReason; comment: string; at: Date; by: string }

/**
 * A shopper, as MyID and the client app know them. The limit comes from FlexSoft's scoring; the
 * admin only sees it.
 */
export type Client = {
  id: string
  lastName: string
  firstName: string
  middleName: string
  photoUrl?: string
  /** Nine digits after +998. */
  phone: string
  /** JSHSHIR, 14 digits. */
  pinfl: string
  passport: string
  passportExpiresOn: Date
  birthDate: Date
  address: string
  registeredAt: Date
  /** Null until the shopper has had a limit worked out. */
  limit: { amount: number; validUntil: Date } | null
  cards: Card[]
  /** Sample flag: this shopper misses their latest monthly payment. How late they are comes from the schedule. */
  late: boolean
  block?: Block
}

export const fullName = (client: Pick<Client, 'lastName' | 'firstName'>) =>
  `${client.firstName} ${client.lastName}`
export const initialsOf = (client: Pick<Client, 'lastName' | 'firstName'>) =>
  `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`.toUpperCase()

type Seed = [
  id: string,
  first: string,
  last: string,
  middle: string,
  phone: string,
  born: [number, number, number],
  limit: number | null,
  late: number,
  photo?: string,
]

const ADDRESSES = [
  'Toshkent sh., Chilonzor tumani, 19-kvartal, 7-uy',
  'Toshkent sh., Yunusobod tumani, 11-mavze, 23-uy',
  'Samarqand sh., Rudakiy koʻchasi, 44-uy',
  'Toshkent sh., Mirzo Ulugʻbek tumani, Buyuk Ipak Yoʻli, 150',
  'Buxoro sh., Mustaqillik koʻchasi, 12-uy',
]

// Invented sample shoppers. Replace with the API.
const seeds: Seed[] = [
  ['c1', 'Dilnoza', 'Rahimova', 'Akmalovna', '901234567', [1994, 3, 12], 42_000_000, 0, user1],
  ['c2', 'Jasur', 'Toshmatov', 'Bahodirovich', '935557711', [1989, 7, 2], 60_000_000, 0, user2],
  ['c3', 'Malika', 'Yusupova', 'Rustamovna', '977001122', [1998, 11, 25], 25_000_000, 0],
  ['c4', 'Otabek', 'Karimov', 'Sherzodovich', '909876543', [1991, 1, 9], 18_000_000, 12, user3],
  ['c5', 'Nigora', 'Saidova', 'Olimovna', '881112233', [1985, 5, 30], 35_000_000, 0],
  ['c6', 'Sardor', 'Aliyev', 'Jamshidovich', '946663344', [2000, 9, 14], 15_000_000, 0],
  ['c7', 'Kamola', 'Ergasheva', 'Nodirovna', '998887766', [1996, 2, 18], 30_000_000, 0],
  ['c8', 'Bekzod', 'Mirzayev', 'Anvarovich', '915554433', [1993, 12, 1], 22_000_000, 4],
  ['c9', 'Shahnoza', 'Qodirova', 'Ilhomovna', '933332211', [1990, 6, 21], 40_000_000, 9],
  ['c10', 'Ulugʻbek', 'Nazarov', 'Farhodovich', '971239876', [1987, 4, 4], 50_000_000, 0, user4],
  ['c11', 'Feruza', 'Abdullayeva', 'Zafarovna', '903334455', [1999, 8, 8], 28_000_000, 0],
  ['c12', 'Javohir', 'Rasulov', 'Otabekovich', '950001199', [2001, 10, 3], 12_000_000, 0],
  ['c13', 'Zarina', 'Hamidova', 'Baxtiyorovna', '977776655', [1997, 3, 27], null, 0],
  ['c14', 'Doniyor', 'Ismoilov', 'Rahimovich', '901110022', [1995, 1, 15], 20_000_000, 0],
  // More shoppers without photos, so each has only a few arizalar
  ...(
    [
      ['Aziza', 'Tursunova', 'Komilovna'],
      ['Rustam', 'Xolmatov', 'Azizovich'],
      ['Mohira', 'Sultonova', 'Ravshanovna'],
      ['Sanjar', 'Ahmedov', 'Tohirovich'],
      ['Gulnoza', 'Jurayeva', 'Hasanovna'],
      ['Elbek', 'Normatov', 'Ulugʻbekovich'],
      ['Laylo', 'Fayzullayeva', 'Botirovna'],
      ['Temur', 'Yoqubov', 'Saidovich'],
      ['Sevara', 'Rashidova', 'Muhammadovna'],
      ['Azamat', 'Qosimov', 'Ergashevich'],
      ['Dildora', 'Murodova', 'Shavkatovna'],
      ['Islom', 'Boboyev', 'Akramovich'],
      ['Nilufar', 'Karimova', 'Davronovna'],
      ['Shoxrux', 'Umarov', 'Alisherovich'],
      ['Madina', 'Xasanova', 'Jasurovna'],
      ['Behruz', 'Sobirov', 'Rustamovich'],
      ['Yulduz', 'Ortiqova', 'Nurmatovna'],
      ['Akmal', 'Rahmonov', 'Ilyosovich'],
      ['Charos', 'Valiyeva', 'Murodovna'],
      ['Nodir', 'Tojiyev', 'Baxromovich'],
      ['Ozoda', 'Ibragimova', 'Sherzodovna'],
      ['Firdavs', 'Ganiyev', 'Zokirovich'],
    ] as const
  ).map(([first, last, middle], i): Seed => [
    `c${15 + i}`,
    first,
    last,
    middle,
    `9${String(10_000_000 + i * 3_761_113).slice(-8)}`,
    [1986 + (i % 16), 1 + (i % 12), 1 + ((i * 7) % 28)],
    i % 7 === 6 ? null : (10 + ((i * 7) % 40)) * 1_000_000,
    i === 3 || i === 7 || i === 11 || i === 16 ? 1 : 0,
  ]),
]

export const clientsStore = createStore<Client>(
  seeds.map(([id, firstName, lastName, middleName, phone, born, limit, late, photo], i) => ({
    id,
    firstName,
    lastName,
    middleName,
    photoUrl: photo,
    phone,
    pinfl:
      `${born[0] < 2000 ? 3 : 5}${String(born[2]).padStart(2, '0')}${String(born[1]).padStart(2, '0')}${String(born[0]).slice(2)}${String(26400 + i * 731).padStart(7, '0')}`.slice(
        0,
        14,
      ),
    passport: `A${String.fromCharCode(65 + (i % 6))}${String(4_210_000 + i * 15_377).slice(0, 7)}`,
    passportExpiresOn: new Date(2029 + (i % 5), i % 12, 10),
    birthDate: new Date(born[0], born[1] - 1, born[2]),
    address: ADDRESSES[i % ADDRESSES.length],
    // Spread from June to mid-October, earliest first
    registeredAt: new Date(2026, 5, 1 + Math.floor((i * 137) / seeds.length), 10 + (i % 9)),
    // A few limits ran out and wait for the shopper to recalculate
    limit:
      limit === null
        ? null
        : { amount: limit, validUntil: new Date(2026, i === 13 ? 8 : 11 + (i % 4), 15) },
    cards: [
      {
        id: `${id}-1`,
        brand: i % 3 === 0 ? 'humo' : 'uzcard',
        last4: String(1000 + i * 613).slice(-4),
        expiry: `0${1 + (i % 9)}/2${8 + (i % 2)}`,
      },
      ...(i % 4 === 1
        ? [
            {
              id: `${id}-2`,
              brand: 'humo' as const,
              last4: String(4400 + i * 37).slice(-4),
              expiry: '11/27',
            },
          ]
        : []),
    ],
    late: late > 0,
    block:
      id === 'c12'
        ? {
            reason: 'fraud',
            comment: 'Boshqa odamning pasporti bilan ariza berishga urindi.',
            at: new Date(2026, 9, 3, 16, 40),
            by: 'Malika Rasulova',
          }
        : undefined,
  })),
)
