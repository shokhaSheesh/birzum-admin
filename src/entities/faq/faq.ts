import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** One question in the client app's Savol-javoblar, in the order shoppers see them. */
export type Faq = {
  id: string
  question: LocalizedText
  answer: LocalizedText
  /** Hidden: kept here, not shown in the app. */
  visible: boolean
}

// The questions the client app shows today. Replace with the API.
export const faqStore = createStore<Faq>([
  {
    id: 'q1',
    visible: true,
    question: { uz: 'Limit qanday hisoblanadi?', ru: 'Как рассчитывается лимит?' },
    answer: {
      uz: 'MyID maʼlumotlaringiz, kredit tarixingiz va daromadingiz asosida. Har bir muddat uchun alohida limit chiqadi.',
      ru: 'По данным MyID, кредитной истории и доходу. Для каждого срока лимит свой.',
    },
  },
  {
    id: 'q2',
    visible: true,
    question: { uz: 'Limit qancha muddat amal qiladi?', ru: 'Сколько действует лимит?' },
    answer: {
      uz: 'Olti oy. Muddati tugagach, limitni qayta oling: bu bir necha soniya oladi.',
      ru: 'Шесть месяцев. Когда срок истечёт, получите лимит заново — это займёт несколько секунд.',
    },
  },
  {
    id: 'q3',
    visible: true,
    question: { uz: 'Muddatidan oldin toʻlasam boʻladimi?', ru: 'Можно ли погасить досрочно?' },
    answer: {
      uz: 'Ha. Xarid sahifasida “Toʻlash”ni bosing va “Toʻliq yopish” yoki “Boshqa summa”ni tanlang. Qoʻshimcha haq olinmaydi.',
      ru: 'Да. На странице покупки нажмите «Оплатить» и выберите «Погасить полностью» или «Другая сумма». Без доплат.',
    },
  },
  {
    id: 'q4',
    visible: true,
    question: { uz: 'Toʻlovni kechiktirsam nima boʻladi?', ru: 'Что будет при просрочке?' },
    answer: {
      uz: 'Sizga xabar yuboriladi va limitingiz vaqtincha toʻxtatilishi mumkin. Qarzni toʻlaganingizdan soʻng limit tiklanadi.',
      ru: 'Вы получите уведомление, лимит может быть временно приостановлен. После погашения он восстановится.',
    },
  },
  {
    id: 'q5',
    visible: true,
    question: { uz: 'Kartani qanday almashtiraman?', ru: 'Как сменить карту?' },
    answer: {
      uz: 'Profil → Toʻlov kartalari boʻlimida yangi karta qoʻshing. Har bir toʻlovda kartani tanlash mumkin.',
      ru: 'Добавьте новую карту в Профиль → Платёжные карты. Карту можно выбрать при каждой оплате.',
    },
  },
  {
    id: 'q6',
    visible: true,
    question: { uz: 'Buyurtmani qanday bekor qilaman?', ru: 'Как отменить заказ?' },
    answer: {
      uz: 'Doʻkon hali javob bermagan boʻlsa, xarid sahifasida “Buyurtmani bekor qilish”ni bosing. Tasdiqlangandan keyin doʻkonga murojaat qiling.',
      ru: 'Пока магазин не ответил, нажмите «Отменить заказ» на странице покупки. После подтверждения обратитесь в магазин.',
    },
  },
  {
    id: 'q7',
    visible: false,
    question: { uz: 'Mahsulotni qaytarsam boʻladimi?', ru: 'Можно ли вернуть товар?' },
    answer: {
      uz: 'Qaytarish qoidalari tayyorlanmoqda. Hozircha doʻkon bilan bogʻlaning.',
      ru: 'Правила возврата готовятся. Пока обратитесь в магазин.',
    },
  },
])

/** How shoppers reach support, shown under the questions in the app. */
export type SupportContacts = {
  id: 'contacts'
  phone: string
  hours: LocalizedText
  telegram: string
}

export const contactsInfoStore = createStore<SupportContacts>([
  {
    id: 'contacts',
    phone: '712000000',
    hours: { uz: 'Har kuni, 09:00–21:00', ru: 'Ежедневно, 09:00–21:00' },
    telegram: 'birzum_support',
  },
])
