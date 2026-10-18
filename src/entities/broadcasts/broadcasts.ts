import { loanApplicationsStore } from '@/entities/microloans/applications'
import {
  loanClientsStore,
  segmentOf,
  type ClientSegment,
  type LoanClient,
} from '@/entities/microloans/loanClients'
import { loansStore } from '@/entities/microloans/loans'
import type { Brand, Workspace } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** Who gets it: everyone in that app, or the people picked. `loanClients`: a brand's app users. */
export type Audience = {
  kind: 'clients' | 'merchants' | 'loanClients'
  all: boolean
  ids: string[]
}

/** A brand's app users in the given groups, for the sample audiences. */
function inSegments(brand: Brand, segments: ClientSegment[]): LoanClient[] {
  const apps = loanApplicationsStore.getAll().filter((app) => app.brand === brand)
  const loans = loansStore.getAll().filter((loan) => loan.brand === brand)
  return loanClientsStore
    .getAll()
    .filter((client) => client.brand === brand && segments.includes(segmentOf(client, apps, loans)))
}

/**
 * `draft`: saved, not sent. `scheduled`: goes out by itself at `sendAt`. `sent`: done.
 * `cancelled`: a scheduled one that was called off.
 */
export type BroadcastStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled'
export const BROADCAST_STATUSES: BroadcastStatus[] = ['sent', 'scheduled', 'draft', 'cancelled']

/**
 * A message from Birzum to shoppers or merchants, or from a microloan brand to its app users: it
 * lands in the app's news list (Bildirishnomalar in the brands' apps) and as a push.
 */
export type Broadcast = {
  id: string
  /** Whose app sends it. */
  app: Workspace
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

const idsIn = (brand: Brand, segments: ClientSegment[]) =>
  inSegments(brand, segments).map((client) => client.id)
const brandSize = (brand: Brand) =>
  loanClientsStore.getAll().filter((client) => client.brand === brand).length
const product = { fortuna: 'Rivoj', vodiy: 'Zar' }
const upTo = { fortuna: '50', vodiy: '100' }

// A few messages per brand: news to all, a reminder to the late ones, an offer, a draft
const loanBroadcasts = (brand: Brand): Broadcast[] => [
  {
    id: `${brand}-b1`,
    app: brand,
    audience: { kind: 'loanClients', all: true, ids: [] },
    title: { uz: 'Ilova yangilandi', ru: 'Приложение обновлено' },
    body: {
      uz: 'Endi qarzni muddatidan oldin qisman ham toʻlash mumkin: oylik toʻlov kamayadi, muddat oʻzgarmaydi.',
      ru: 'Теперь займ можно погасить досрочно и частично: платёж в месяц меньше, срок прежний.',
    },
    status: 'sent',
    sendAt: at(9, 8, 11),
    createdAt: at(9, 8, 10, 15),
    createdBy: 'Sardor Saidov',
    stats: statsFor(brandSize(brand), 4),
  },
  {
    id: `${brand}-b2`,
    app: brand,
    audience: { kind: 'loanClients', all: false, ids: idsIn(brand, ['late']) },
    title: { uz: 'Toʻlov kechikmoqda', ru: 'Платёж просрочен' },
    body: {
      uz: 'Oylik toʻlovingiz muddati oʻtdi. Ilovada «Toʻlash»ni bosing yoki yaqin filialga keling. Qiyinchilik boʻlsa, chatga yozing.',
      ru: 'Срок ежемесячного платежа прошёл. Нажмите «Оплатить» в приложении или приходите в ближайший филиал. Если трудности, напишите в чат.',
    },
    status: 'sent',
    sendAt: at(9, 15, 10),
    createdAt: at(9, 15, 9, 30),
    createdBy: 'Malika Rasulova',
    stats: statsFor(idsIn(brand, ['late']).length, 2),
  },
  {
    id: `${brand}-b3`,
    app: brand,
    audience: { kind: 'loanClients', all: false, ids: idsIn(brand, ['registered', 'repaid']) },
    title: {
      uz: `${product[brand]}: ${upTo[brand]} mln gacha`,
      ru: `${product[brand]}: до ${upTo[brand]} млн`,
    },
    body: {
      uz: 'Garovsiz mikroqarz, ariza ilovada 5 daqiqada. Pul Uzcard yoki Humo kartangizga tushadi.',
      ru: 'Микрозайм без залога, заявка в приложении за 5 минут. Деньги придут на карту Uzcard или Humo.',
    },
    status: 'scheduled',
    sendAt: at(9, 25, 10),
    createdAt: at(9, 17, 16, 40),
    createdBy: 'Sardor Saidov',
  },
  {
    id: `${brand}-b4`,
    app: brand,
    audience: { kind: 'loanClients', all: false, ids: idsIn(brand, ['applied']) },
    title: { uz: 'Arizangizni yakunlang', ru: 'Завершите заявку' },
    body: {
      uz: 'Arizangiz holatini ilovada koʻring. Taklif kelgan boʻlsa, u 3 kun amal qiladi: shartnomani SMS-kod bilan imzolang va pulni kartaga oling.',
      ru: 'Проверьте статус заявки в приложении. Если пришло предложение, оно действует 3 дня: подпишите договор SMS-кодом и получите деньги на карту.',
    },
    status: 'draft',
    createdAt: at(9, 18, 9, 5),
    createdBy: 'Malika Rasulova',
  },
]

// Invented sample broadcasts. Replace with the API.
export const broadcastsStore = createStore<Broadcast>([
  ...loanBroadcasts('fortuna'),
  ...loanBroadcasts('vodiy'),
  {
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
