import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** Who gets it: everyone in that app, or the people picked. */
export type Audience = { kind: 'clients' | 'merchants'; all: boolean; ids: string[] }

/**
 * `draft`: saved, not sent. `scheduled`: goes out by itself at `sendAt`. `sent`: done.
 * `cancelled`: a scheduled one that was called off.
 */
export type BroadcastStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled'
export const BROADCAST_STATUSES: BroadcastStatus[] = ['sent', 'scheduled', 'draft', 'cancelled']

/** A message from Birzum to shoppers or merchants: it lands in the app's Yangiliklar list and as a push. */
export type Broadcast = {
  id: string
  audience: Audience
  title: LocalizedText
  body: LocalizedText
  image?: string
  status: BroadcastStatus
  /** When it went or will go out. */
  sendAt?: Date
  createdAt: Date
  createdBy: string
  /** Counted when sent. */
  stats?: { recipients: number; delivered: number; opened: number; tapped: number }
}

/** Sample delivery figures for a sent broadcast: almost all arrive, some are opened. */
export function statsFor(recipients: number, seed: number) {
  const delivered = Math.round(recipients * (0.94 + (seed % 5) / 100))
  const opened = Math.round(delivered * (0.32 + (seed % 7) / 25))
  return { recipients, delivered, opened, tapped: Math.round(opened * 0.35) }
}

const at = (month: number, day: number, hour: number, minute = 0) =>
  new Date(2026, month, day, hour, minute)

// Invented sample broadcasts. Replace with the API.
export const broadcastsStore = createStore<Broadcast>([
  {
    id: 'b1',
    audience: { kind: 'clients', all: true, ids: [] },
    title: { uz: 'Ilovada yangilik', ru: 'Новое в приложении' },
    body: {
      uz: 'Endi nasiyani muddatidan oldin ilovada yopish mumkin.',
      ru: 'Теперь рассрочку можно погасить досрочно прямо в приложении.',
    },
    status: 'sent',
    sendAt: at(9, 14, 11),
    createdAt: at(9, 14, 10, 20),
    createdBy: 'Sardor Saidov',
    stats: statsFor(36, 3),
  },
  {
    id: 'b2',
    audience: { kind: 'clients', all: true, ids: [] },
    title: { uz: 'Mediaparkda chegirmalar', ru: 'Скидки в Mediapark' },
    body: {
      uz: 'Televizorlarga 15% gacha chegirma, nasiyaga ham.',
      ru: 'Скидки на телевизоры до 15%, и в рассрочку тоже.',
    },
    status: 'sent',
    sendAt: at(9, 10, 12),
    createdAt: at(9, 9, 17, 5),
    createdBy: 'Malika Rasulova',
    stats: statsFor(34, 6),
  },
  {
    id: 'b3',
    audience: { kind: 'clients', all: false, ids: ['c4', 'c9', 'c18', 'c22', 'c26', 'c31'] },
    title: { uz: 'Toʻlovni unutmang', ru: 'Не забудьте об оплате' },
    body: {
      uz: 'Oylik toʻlovingiz muddati oʻtdi. Ilovada bir bosishda toʻlang va yangi xaridlar uchun limitingizni saqlang.',
      ru: 'Срок ежемесячного платежа прошёл. Оплатите в приложении в одно нажатие и сохраните лимит для новых покупок.',
    },
    status: 'sent',
    sendAt: at(9, 12, 10),
    createdAt: at(9, 12, 9, 40),
    createdBy: 'Malika Rasulova',
    stats: statsFor(6, 1),
  },
  {
    id: 'b4',
    audience: { kind: 'merchants', all: true, ids: [] },
    title: { uz: 'Birzumdan yangilik', ru: 'Новости Birzum' },
    body: {
      uz: 'Endi klient mahsulotni olganini surat bilan tasdiqlash mumkin.',
      ru: 'Теперь выдачу товара можно подтвердить фотографией клиента.',
    },
    status: 'sent',
    sendAt: at(9, 6, 9),
    createdAt: at(9, 6, 8, 30),
    createdBy: 'Sardor Saidov',
    stats: statsFor(4, 2),
  },
  {
    id: 'b5',
    audience: { kind: 'clients', all: false, ids: ['c14', 'c3', 'c7'] },
    title: { uz: 'Limitingizni yangilang', ru: 'Обновите лимит' },
    body: {
      uz: 'Limitingiz muddati tugadi. Ilovada bir daqiqada qayta hisoblang.',
      ru: 'Срок лимита истёк. Пересчитайте его в приложении за минуту.',
    },
    status: 'sent',
    sendAt: at(8, 28, 15),
    createdAt: at(8, 28, 14),
    createdBy: 'Sardor Nematov',
    stats: statsFor(3, 4),
  },
  {
    id: 'b6',
    audience: { kind: 'clients', all: true, ids: [] },
    title: { uz: 'Black Friday: 0% ustama', ru: 'Black Friday: 0% наценки' },
    body: {
      uz: '27–30-noyabr kunlari 3 oylik nasiyada ustama yoʻq. Hamkor doʻkonlarda.',
      ru: 'С 27 по 30 ноября рассрочка на 3 месяца без наценки. В магазинах-партнёрах.',
    },
    status: 'scheduled',
    sendAt: at(10, 27, 9),
    createdAt: at(9, 16, 16),
    createdBy: 'Sardor Saidov',
  },
  {
    id: 'b7',
    audience: { kind: 'merchants', all: false, ids: ['m1', 'm2'] },
    title: { uz: 'Hisob-kitob jadvali', ru: 'График выплат' },
    body: {
      uz: 'Noyabrdan boshlab haftalik oʻtkazmalar seshanba emas, dushanba kuni boʻladi.',
      ru: 'С ноября еженедельные выплаты будут по понедельникам, а не по вторникам.',
    },
    status: 'draft',
    createdAt: at(9, 17, 12),
    createdBy: 'Malika Rasulova',
  },
])
