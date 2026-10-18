import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The documents the client app links to; they are fixed, their text changes by version. */
export const DOCUMENT_IDS = ['terms', 'privacy', 'offer'] as const
export type DocumentId = (typeof DOCUMENT_IDS)[number]

/** Where the client app asks shoppers to agree to it. */
export type ConsentPlace = 'signIn' | 'checkout'

export type DocSection = { id: string; heading: LocalizedText; body: LocalizedText }

/**
 * One edition of a document. `draft`: being written, at most one. `published`: the one the
 * apps show now. `archived`: an earlier published one, kept read-only.
 */
export type DocVersion = {
  number: number
  status: 'draft' | 'published' | 'archived'
  sections: DocSection[]
  editedAt: Date
  editedBy: string
  publishedAt?: Date
  publishedBy?: string
  /** What changed, for the history. */
  note?: string
  /** Shoppers had to agree again on their next sign-in or checkout. */
  reconsent?: boolean
}

export type LegalDoc = { id: DocumentId; usedIn: ConsentPlace[]; versions: DocVersion[] }

export const currentOf = (doc: LegalDoc) => doc.versions.find((v) => v.status === 'published')
export const draftOf = (doc: LegalDoc) => doc.versions.find((v) => v.status === 'draft')

// The texts the client app shows today, as written there. Replace with the API.
const texts: Record<DocumentId, Omit<DocSection, 'id'>[]> = {
  terms: [
    {
      heading: { uz: '1. Umumiy qoidalar', ru: '1. Общие положения' },
      body: {
        uz: 'Ushbu shartlar Birzum nasiya ilovasidan foydalanish tartibini belgilaydi. Ilovadan foydalanib, siz ularga rozilik bildirasiz.',
        ru: 'Эти условия определяют порядок использования приложения Birzum nasiya. Пользуясь приложением, вы соглашаетесь с ними.',
      },
    },
    {
      heading: { uz: '2. Hisob va xavfsizlik', ru: '2. Аккаунт и безопасность' },
      body: {
        uz: 'Hisobingizga kirish kodi va PIN-kodni boshqalarga bermang. Telefon raqamingiz oʻzgarsa, bizga xabar bering.',
        ru: 'Не передавайте код входа и PIN-код другим людям. Если ваш номер телефона изменился, сообщите нам.',
      },
    },
    {
      heading: { uz: '3. Nasiya va toʻlovlar', ru: '3. Рассрочка и платежи' },
      body: {
        uz: 'Har bir xarid alohida shartnoma bilan rasmiylashtiriladi. Oylik toʻlovlar tanlangan kartadan belgilangan kunda yechiladi.',
        ru: 'Каждая покупка оформляется отдельным договором. Ежемесячные платежи списываются с выбранной карты в установленный день.',
      },
    },
  ],
  privacy: [
    {
      heading: { uz: '1. Qanday maʼlumotlar yigʻiladi', ru: '1. Какие данные собираются' },
      body: {
        uz: 'Telefon raqami, pasport maʼlumotlari, tugʻilgan sana, daromad va MyID orqali olingan surat.',
        ru: 'Номер телефона, паспортные данные, дата рождения, доход и фото, полученное через MyID.',
      },
    },
    {
      heading: { uz: '2. Nima uchun kerak', ru: '2. Зачем они нужны' },
      body: {
        uz: 'Shaxsingizni tasdiqlash, limitni hisoblash va shartnomalarni rasmiylashtirish uchun.',
        ru: 'Чтобы подтвердить вашу личность, рассчитать лимит и оформить договоры.',
      },
    },
    {
      heading: { uz: '3. Kimga beriladi', ru: '3. Кому передаются' },
      body: {
        uz: 'Faqat siz xarid qilgan doʻkonga va qonun talab qilgan hollarda tegishli idoralarga.',
        ru: 'Только магазину, в котором вы покупаете, и, если требует закон, соответствующим органам.',
      },
    },
  ],
  offer: [
    {
      heading: { uz: '1. Shartnoma predmeti', ru: '1. Предмет договора' },
      body: {
        uz: 'Doʻkon sizga tovarni beradi, siz esa uning narxini tanlangan muddat davomida oylik toʻlovlar bilan toʻlaysiz.',
        ru: 'Магазин передаёт вам товар, а вы оплачиваете его стоимость ежемесячными платежами в течение выбранного срока.',
      },
    },
    {
      heading: { uz: '2. Toʻlovlar', ru: '2. Платежи' },
      body: {
        uz: 'Toʻlov jadvali shartnomada koʻrsatiladi. Muddatidan oldin toʻlash mumkin, qoʻshimcha haq olinmaydi.',
        ru: 'График платежей указан в договоре. Досрочное погашение возможно без дополнительной платы.',
      },
    },
    {
      heading: { uz: '3. Kechikish', ru: '3. Просрочка' },
      body: {
        uz: 'Toʻlov kechiksa, sizga xabar yuboriladi va limitingiz vaqtincha toʻxtatilishi mumkin.',
        ru: 'При просрочке платежа вы получите уведомление, а лимит может быть временно приостановлен.',
      },
    },
  ],
}
const withIds = (id: DocumentId) =>
  texts[id].map((section, i) => ({ id: `${id}-${i}`, ...section }))
const at = (month: number, day: number) => new Date(2026, month, day, 11)

export const documentsStore = createStore<LegalDoc>([
  {
    id: 'terms',
    usedIn: ['signIn'],
    versions: [
      {
        number: 2,
        status: 'published',
        sections: withIds('terms'),
        editedAt: at(8, 28),
        editedBy: 'Sardor Saidov',
        publishedAt: at(9, 1),
        publishedBy: 'Sardor Saidov',
        note: 'PIN-kod va telefon raqami haqida band qoʻshildi.',
        reconsent: false,
      },
      {
        number: 1,
        status: 'archived',
        sections: withIds('terms').filter((s) => s.id !== 'terms-1'),
        editedAt: at(7, 20),
        editedBy: 'Sardor Saidov',
        publishedAt: at(8, 1),
        publishedBy: 'Sardor Saidov',
        note: 'Birinchi nashr.',
      },
    ],
  },
  {
    id: 'privacy',
    usedIn: ['signIn', 'checkout'],
    versions: [
      {
        number: 1,
        status: 'published',
        sections: withIds('privacy'),
        editedAt: at(7, 20),
        editedBy: 'Malika Rasulova',
        publishedAt: at(8, 1),
        publishedBy: 'Malika Rasulova',
        note: 'Birinchi nashr.',
      },
    ],
  },
  {
    id: 'offer',
    usedIn: ['checkout'],
    versions: [
      {
        number: 2,
        status: 'draft',
        sections: [
          ...withIds('offer'),
          {
            id: 'offer-3',
            heading: { uz: '4. Qaytarish', ru: '4. Возврат' },
            body: {
              uz: 'Mahsulotni qaytarish doʻkon qoidalari va Isteʼmolchilar huquqlarini himoya qilish toʻgʻrisidagi qonun asosida amalga oshiriladi.',
              ru: 'Возврат товара производится по правилам магазина и Закону о защите прав потребителей.',
            },
          },
        ],
        editedAt: at(9, 15),
        editedBy: 'Malika Rasulova',
      },
      {
        number: 1,
        status: 'published',
        sections: withIds('offer'),
        editedAt: at(7, 20),
        editedBy: 'Malika Rasulova',
        publishedAt: at(8, 1),
        publishedBy: 'Malika Rasulova',
        note: 'Birinchi nashr.',
      },
    ],
  },
])
