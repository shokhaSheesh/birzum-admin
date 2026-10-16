import castoreLogo from '@/shared/assets/stores/castore.jpg'
import ispaceLogo from '@/shared/assets/stores/ispace.jpg'
import mediaparkLogo from '@/shared/assets/stores/mediapark.jpg'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

export const MERCHANT_STATUSES = ['active', 'onboarding', 'paused'] as const
/** `onboarding`: created, not selling yet. `paused`: hidden from shoppers, no new sales. */
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number]
export type PayoutSchedule = 'weekly' | 'monthly'

export type Merchant = {
  id: string
  /** The shop's name as shoppers see it. */
  name: string
  logo?: string
  description: LocalizedText
  /** Nine digits after +998. */
  phone: string
  legal: {
    /** Registered name, e.g. "Mediapark Group" MChJ. */
    company: string
    /** STIR (INN): nine digits. */
    inn: string
    director: string
    address: string
  }
  bank: { name: string; mfo: string; account: string }
  contract: { number: string; date: string }
  /** How often Birzum pays the merchant for its nasiya sales, in full. */
  payoutSchedule: PayoutSchedule
  /** The first merchant-app account, the shop's owner. */
  owner: { name: string; phone: string; login: string }
  status: MerchantStatus
  createdAt: Date
  // Figures the backend counts. Sample values.
  products: number
  salesThisMonth: number
  activeNasiya: number
}

const text = (uz: string, ru: string): LocalizedText => ({ uz, ru })

// Invented sample merchants. Replace with the API.
export const merchantsStore = createStore<Merchant>([
  {
    id: 'm1',
    name: 'Mediapark',
    logo: mediaparkLogo,
    description: text(
      'Maishiy texnika va elektronika gipermarketlari tarmogʻi.',
      'Сеть гипермаркетов бытовой техники и электроники.',
    ),
    phone: '712001122',
    legal: {
      company: '"Mediapark Group" MChJ',
      inn: '305478219',
      director: 'Akmal Rustamov',
      address: 'Toshkent, Chilonzor tumani, Bunyodkor shoh koʻchasi, 12',
    },
    bank: { name: 'Kapitalbank', mfo: '01088', account: '20208000905478219001' },
    contract: { number: 'BZ-M-0001', date: '12.03.2026' },
    payoutSchedule: 'weekly',
    owner: { name: 'Aziz Karimov', phone: '901112233', login: 'aziz.karimov' },
    status: 'active',
    createdAt: new Date(2026, 2, 12),
    products: 128,
    salesThisMonth: 173_600_000,
    activeNasiya: 214,
  },
  {
    id: 'm2',
    name: 'iSpace',
    logo: ispaceLogo,
    description: text(
      'Apple qurilmalari rasmiy sotuvchisi.',
      'Официальный продавец устройств Apple.',
    ),
    phone: '712003344',
    legal: {
      company: '"iSpace Uzbekistan" MChJ',
      inn: '306112874',
      director: 'Dilshod Nazarov',
      address: 'Toshkent, Yunusobod tumani, Amir Temur koʻchasi, 107',
    },
    bank: { name: 'Ipak Yoʻli banki', mfo: '00444', account: '20208000306112874001' },
    contract: { number: 'BZ-M-0002', date: '02.04.2026' },
    payoutSchedule: 'weekly',
    owner: { name: 'Nodira Yusupova', phone: '935551020', login: 'nodira.y' },
    status: 'active',
    createdAt: new Date(2026, 3, 2),
    products: 64,
    salesThisMonth: 241_900_000,
    activeNasiya: 168,
  },
  {
    id: 'm3',
    name: 'CA.store',
    logo: castoreLogo,
    description: text('Smartfonlar va aksessuarlar doʻkoni.', 'Магазин смартфонов и аксессуаров.'),
    phone: '662005566',
    legal: {
      company: '"CA Store" MChJ',
      inn: '307845120',
      director: 'Bekzod Qodirov',
      address: 'Samarqand, Registon koʻchasi, 5',
    },
    bank: { name: 'Hamkorbank', mfo: '00083', account: '20208000307845120001' },
    contract: { number: 'BZ-M-0003', date: '20.05.2026' },
    payoutSchedule: 'monthly',
    owner: { name: 'Bekzod Qodirov', phone: '977004455', login: 'bekzod.q' },
    status: 'active',
    createdAt: new Date(2026, 4, 20),
    products: 41,
    salesThisMonth: 58_300_000,
    activeNasiya: 47,
  },
  {
    id: 'm4',
    name: 'Texno Dunyo',
    description: text('Televizorlar va kompyuterlar.', 'Телевизоры и компьютеры.'),
    phone: '712007788',
    legal: {
      company: '"Texno Dunyo Savdo" MChJ',
      inn: '308211963',
      director: 'Sherzod Aliyev',
      address: 'Toshkent, Sergeli tumani, Yangi Sergeli 3',
    },
    bank: { name: 'Asakabank', mfo: '00873', account: '20208000308211963001' },
    contract: { number: 'BZ-M-0004', date: '01.08.2026' },
    payoutSchedule: 'weekly',
    owner: { name: 'Sherzod Aliyev', phone: '909990011', login: 'sherzod.a' },
    status: 'paused',
    createdAt: new Date(2026, 7, 1),
    products: 37,
    salesThisMonth: 0,
    activeNasiya: 22,
  },
  {
    id: 'm5',
    name: 'Elektro Market',
    description: text('Maishiy texnika doʻkoni.', 'Магазин бытовой техники.'),
    phone: '652003311',
    legal: {
      company: '"Elektro Market Buxoro" MChJ',
      inn: '309004517',
      director: 'Gulnora Abdullayeva',
      address: 'Buxoro, Mustaqillik koʻchasi, 44',
    },
    bank: { name: 'Agrobank', mfo: '00394', account: '20208000309004517001' },
    contract: { number: 'BZ-M-0005', date: '10.10.2026' },
    payoutSchedule: 'monthly',
    owner: { name: 'Gulnora Abdullayeva', phone: '914443322', login: 'gulnora.a' },
    status: 'onboarding',
    createdAt: new Date(2026, 9, 10),
    products: 0,
    salesThisMonth: 0,
    activeNasiya: 0,
  },
])

/** "Mediapark" -> "ME", for a merchant without a logo. */
export const initialsOf = (name: string) =>
  name
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
