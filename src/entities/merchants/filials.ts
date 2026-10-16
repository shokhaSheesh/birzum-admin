import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/**
 * One of a merchant's shops. The merchant adds and edits them in the merchant app; the admin
 * only sees them.
 */
export type Filial = {
  id: string
  merchantId: string
  name: LocalizedText
  address: LocalizedText
  /** Nine digits after +998. */
  phone: string
  /** Entered once, e.g. "09:00–20:00". */
  hours: string
  /** Merchant-app accounts assigned to this shop. */
  staff: number
  /** A closed shop is hidden from shoppers at checkout. */
  active: boolean
}

const text = (uz: string, ru: string): LocalizedText => ({ uz, ru })

// Invented sample shops. Replace with the API.
export const filialsStore = createStore<Filial>([
  {
    id: 'f1',
    merchantId: 'm1',
    name: text('Chilonzor filiali', 'Филиал Чиланзар'),
    address: text('Toshkent, Chilonzor 9-kvartal, 12-uy', 'Ташкент, Чиланзар, 9-й квартал, 12'),
    phone: '712001122',
    hours: '09:00–20:00',
    staff: 6,
    active: true,
  },
  {
    id: 'f2',
    merchantId: 'm1',
    name: text('Yunusobod filiali', 'Филиал Юнусабад'),
    address: text('Toshkent, Yunusobod 4-mavze, 7-uy', 'Ташкент, Юнусабад, 4-й массив, 7'),
    phone: '712001133',
    hours: '10:00–21:00',
    staff: 4,
    active: true,
  },
  {
    id: 'f3',
    merchantId: 'm1',
    name: text('Samarqand filiali', 'Филиал Самарканд'),
    address: text('Samarqand, Registon koʻchasi, 5-uy', 'Самарканд, улица Регистан, 5'),
    phone: '662001144',
    hours: '09:00–19:00',
    staff: 2,
    active: false,
  },
  {
    id: 'f4',
    merchantId: 'm2',
    name: text('Amir Temur', 'Амир Темур'),
    address: text('Toshkent, Amir Temur koʻchasi, 107', 'Ташкент, улица Амира Темура, 107'),
    phone: '712003344',
    hours: '10:00–22:00',
    staff: 5,
    active: true,
  },
  {
    id: 'f5',
    merchantId: 'm2',
    name: text('Samarqand Darvoza', 'Самарканд Дарвоза'),
    address: text('Toshkent, Qoratosh koʻchasi, 5A', 'Ташкент, улица Караташ, 5А'),
    phone: '712003355',
    hours: '10:00–22:00',
    staff: 3,
    active: true,
  },
  {
    id: 'f6',
    merchantId: 'm3',
    name: text('Registon', 'Регистан'),
    address: text('Samarqand, Registon koʻchasi, 5', 'Самарканд, улица Регистан, 5'),
    phone: '662005566',
    hours: '09:00–20:00',
    staff: 3,
    active: true,
  },
  {
    id: 'f7',
    merchantId: 'm4',
    name: text('Sergeli', 'Сергели'),
    address: text('Toshkent, Yangi Sergeli 3', 'Ташкент, Янги Сергели, 3'),
    phone: '712007788',
    hours: '09:00–19:00',
    staff: 2,
    active: false,
  },
  {
    id: 'f8',
    merchantId: 'm4',
    name: text('Olmazor', 'Алмазар'),
    address: text(
      'Toshkent, Olmazor tumani, Talabalar shaharchasi',
      'Ташкент, Алмазар, Студгородок',
    ),
    phone: '712007799',
    hours: '09:00–19:00',
    staff: 1,
    active: false,
  },
])

/** Live list of one merchant's shops. */
export const useFilialsOf = (merchantId: string | undefined) =>
  filialsStore.useAll().filter((filial) => filial.merchantId === merchantId)
