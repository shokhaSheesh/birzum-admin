import type { Brand, Workspace } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** One question in an app's Savol-javoblar (Birzum's or a brand's), in the order people see them. */
export type Faq = {
  id: string
  app: Workspace
  question: LocalizedText
  answer: LocalizedText
  /** Hidden: kept here, not shown in the app. */
  visible: boolean
}

// The questions the microloan apps show today; only the collateral answer names each brand's own
// products. Replace with the API.
const COLLATERAL: Record<Brand, LocalizedText> = {
  fortuna: {
    uz: 'Rivoj va Tezkor garovsiz. Ishonch takroriy mijozlar uchun, 3-shaxs kafilligi asosida beriladi.',
    ru: 'Rivoj и Tezkor — без залога. Ishonch — для повторных клиентов, под поручительство третьего лица.',
  },
  vodiy: {
    uz: 'Zar garovsiz va kafilsiz. Ishonch takroriy mijozlar uchun, 3-shaxs kafilligi asosida; Koʻmak garov yoki sugʻurta polisi bilan.',
    ru: 'Zar — без залога и поручителя. Ishonch — для повторных клиентов, под поручительство; Koʻmak — под залог или страховой полис.',
  },
}
const loanFaq = (brand: Brand): Faq[] =>
  (
    [
      [
        { uz: 'Kim qarz olishi mumkin?', ru: 'Кто может получить займ?' },
        {
          uz: '18 yoshdan katta, pasporti yoki ID-kartasi bor va MyID orqali shaxsini tasdiqlagan Oʻzbekiston fuqarosi.',
          ru: 'Гражданин Узбекистана старше 18 лет с паспортом или ID-картой, подтвердивший личность через MyID.',
        },
      ],
      [
        { uz: 'Garov yoki kafil kerakmi?', ru: 'Нужен ли залог или поручитель?' },
        COLLATERAL[brand],
      ],
      [
        { uz: 'Qaror qancha vaqtda chiqadi?', ru: 'Сколько ждать решения?' },
        {
          uz: 'Odatda bir necha daqiqada. Natija ilovaga keladi, filialga borish shart emas.',
          ru: 'Обычно несколько минут. Ответ приходит в приложение, в филиал идти не нужно.',
        },
      ],
      [
        { uz: 'Pul qanday tushadi?', ru: 'Как приходят деньги?' },
        {
          uz: 'Shartnomani SMS-kod bilan imzolaganingizdan keyin pul tanlagan Uzcard yoki Humo kartangizga oʻtkaziladi.',
          ru: 'После подписи договора SMS-кодом деньги переводятся на выбранную карту Uzcard или Humo.',
        },
      ],
      [
        { uz: 'Toʻlov qanday yechiladi?', ru: 'Как списываются платежи?' },
        {
          uz: 'Har oyning toʻlov kunida summa kartangizdan avtomatik yechiladi. Ilovada oldinroq oʻzingiz ham toʻlashingiz mumkin.',
          ru: 'В день платежа сумма списывается с карты автоматически. В приложении можно оплатить и раньше.',
        },
      ],
      [
        { uz: 'Muddatidan oldin yopsam boʻladimi?', ru: 'Можно ли погасить досрочно?' },
        {
          uz: 'Ha, istalgan vaqtda: toʻliq yoki qisman. Qisman toʻlasangiz, oylik toʻlov kamayadi, muddat oʻzgarmaydi.',
          ru: 'Да, в любой момент — полностью или частично. При частичном платёж в месяц уменьшается, срок прежний.',
        },
      ],
      [
        { uz: 'Toʻlovni kechiktirsam nima boʻladi?', ru: 'Что будет, если опоздать с платежом?' },
        {
          uz: 'Ilova va SMS orqali eslatamiz. Kechikish kredit tarixingizga taʼsir qiladi, shuning uchun muammo boʻlsa, oldindan yozing.',
          ru: 'Мы напомним в приложении и по SMS. Просрочка влияет на кредитную историю, поэтому при трудностях напишите заранее.',
        },
      ],
    ] as [LocalizedText, LocalizedText][]
  ).map(([question, answer], i) => ({
    id: `${brand}-f${i + 1}`,
    app: brand,
    question,
    answer,
    visible: true,
  }))

// The questions the client app shows today. Replace with the API.
export const faqStore = createStore<Faq>([
  ...loanFaq('fortuna'),
  ...loanFaq('vodiy'),
  {
    app: 'birzum',
    id: 'q1',
    visible: true,
    question: { uz: 'Limit qanday hisoblanadi?', ru: 'Как рассчитывается лимит?' },
    answer: {
      uz: 'MyID maʼlumotlaringiz, kredit tarixingiz va daromadingiz asosida. Har bir muddat uchun alohida limit chiqadi.',
      ru: 'По данным MyID, кредитной истории и доходу. Для каждого срока лимит свой.',
    },
  },
  {
    app: 'birzum',
    id: 'q2',
    visible: true,
    question: { uz: 'Limit qancha muddat amal qiladi?', ru: 'Сколько действует лимит?' },
    answer: {
      uz: 'Olti oy. Muddati tugagach, limitni qayta oling: bu bir necha soniya oladi.',
      ru: 'Шесть месяцев. Когда срок истечёт, получите лимит заново — это займёт несколько секунд.',
    },
  },
  {
    app: 'birzum',
    id: 'q3',
    visible: true,
    question: { uz: 'Muddatidan oldin toʻlasam boʻladimi?', ru: 'Можно ли погасить досрочно?' },
    answer: {
      uz: 'Ha. Xarid sahifasida “Toʻlash”ni bosing va “Toʻliq yopish” yoki “Boshqa summa”ni tanlang. Qoʻshimcha haq olinmaydi.',
      ru: 'Да. На странице покупки нажмите «Оплатить» и выберите «Погасить полностью» или «Другая сумма». Без доплат.',
    },
  },
  {
    app: 'birzum',
    id: 'q4',
    visible: true,
    question: { uz: 'Toʻlovni kechiktirsam nima boʻladi?', ru: 'Что будет при просрочке?' },
    answer: {
      uz: 'Sizga xabar yuboriladi va limitingiz vaqtincha toʻxtatilishi mumkin. Qarzni toʻlaganingizdan soʻng limit tiklanadi.',
      ru: 'Вы получите уведомление, лимит может быть временно приостановлен. После погашения он восстановится.',
    },
  },
  {
    app: 'birzum',
    id: 'q5',
    visible: true,
    question: { uz: 'Kartani qanday almashtiraman?', ru: 'Как сменить карту?' },
    answer: {
      uz: 'Profil → Toʻlov kartalari boʻlimida yangi karta qoʻshing. Har bir toʻlovda kartani tanlash mumkin.',
      ru: 'Добавьте новую карту в Профиль → Платёжные карты. Карту можно выбрать при каждой оплате.',
    },
  },
  {
    app: 'birzum',
    id: 'q6',
    visible: true,
    question: { uz: 'Buyurtmani qanday bekor qilaman?', ru: 'Как отменить заказ?' },
    answer: {
      uz: 'Doʻkon hali javob bermagan boʻlsa, xarid sahifasida “Buyurtmani bekor qilish”ni bosing. Tasdiqlangandan keyin doʻkonga murojaat qiling.',
      ru: 'Пока магазин не ответил, нажмите «Отменить заказ» на странице покупки. После подтверждения обратитесь в магазин.',
    },
  },
  {
    app: 'birzum',
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
