import { appList } from './appList'
import { logMock } from './audit'
import { mockRoutes } from './index'
import { asBody, invalid, isText, text, type Text } from './util'

type Faq = { id: string; app: string; question: Text; answer: Text; visible: boolean }

const COLLATERAL: Record<string, Text> = {
  fortuna: text(
    'Rivoj va Tezkor garovsiz. Ishonch takroriy mijozlar uchun, 3-shaxs kafilligi asosida beriladi.',
    'Rivoj и Tezkor — без залога. Ishonch — для повторных клиентов, под поручительство третьего лица.',
  ),
  vodiy: text(
    'Zar garovsiz va kafilsiz. Ishonch takroriy mijozlar uchun, 3-shaxs kafilligi asosida; Koʻmak garov yoki sugʻurta polisi bilan.',
    'Zar — без залога и поручителя. Ishonch — для повторных клиентов, под поручительство; Koʻmak — под залог или страховой полис.',
  ),
}

const loanFaq = (brand: string): Faq[] =>
  [
    [
      text('Kim qarz olishi mumkin?', 'Кто может получить займ?'),
      text(
        '18 yoshdan katta, pasporti yoki ID-kartasi bor va MyID orqali shaxsini tasdiqlagan Oʻzbekiston fuqarosi.',
        'Гражданин Узбекистана старше 18 лет с паспортом или ID-картой, подтвердивший личность через MyID.',
      ),
    ],
    [text('Garov yoki kafil kerakmi?', 'Нужен ли залог или поручитель?'), COLLATERAL[brand]],
    [
      text('Qaror qancha vaqtda chiqadi?', 'Сколько ждать решения?'),
      text(
        'Odatda bir necha daqiqada. Natija ilovaga keladi, filialga borish shart emas.',
        'Обычно несколько минут. Ответ приходит в приложение, в филиал идти не нужно.',
      ),
    ],
    [
      text('Pul qanday tushadi?', 'Как приходят деньги?'),
      text(
        'Shartnomani SMS-kod bilan imzolaganingizdan keyin pul tanlagan Uzcard yoki Humo kartangizga oʻtkaziladi.',
        'После подписи договора SMS-кодом деньги переводятся на выбранную карту Uzcard или Humo.',
      ),
    ],
    [
      text('Muddatidan oldin yopsam boʻladimi?', 'Можно ли погасить досрочно?'),
      text(
        'Ha, istalgan vaqtda: toʻliq yoki qisman. Qisman toʻlasangiz, oylik toʻlov kamayadi, muddat oʻzgarmaydi.',
        'Да, в любой момент — полностью или частично. При частичном платёж в месяц уменьшается, срок прежний.',
      ),
    ],
  ].map(([question, answer], i) => ({
    id: `${brand}-f${i + 1}`,
    app: brand,
    question,
    answer,
    visible: true,
  }))

const birzum = (id: string, question: Text, answer: Text, visible = true): Faq => ({
  id,
  app: 'birzum',
  question,
  answer,
  visible,
})

const seeds: Record<string, Faq[]> = {
  birzum: [
    birzum(
      'q1',
      text('Limit qanday hisoblanadi?', 'Как рассчитывается лимит?'),
      text(
        'MyID maʼlumotlaringiz, kredit tarixingiz va daromadingiz asosida. Har bir muddat uchun alohida limit chiqadi.',
        'По данным MyID, кредитной истории и доходу. Для каждого срока лимит свой.',
      ),
    ),
    birzum(
      'q2',
      text('Limit qancha muddat amal qiladi?', 'Сколько действует лимит?'),
      text(
        'Olti oy. Muddati tugagach, limitni qayta oling: bu bir necha soniya oladi.',
        'Шесть месяцев. Когда срок истечёт, получите лимит заново — это займёт несколько секунд.',
      ),
    ),
    birzum(
      'q3',
      text('Muddatidan oldin toʻlasam boʻladimi?', 'Можно ли погасить досрочно?'),
      text(
        'Ha. Xarid sahifasida “Toʻlash”ni bosing va “Toʻliq yopish” yoki “Boshqa summa”ni tanlang. Qoʻshimcha haq olinmaydi.',
        'Да. На странице покупки нажмите «Оплатить» и выберите «Погасить полностью» или «Другая сумма». Без доплат.',
      ),
    ),
    birzum(
      'q4',
      text('Toʻlovni kechiktirsam nima boʻladi?', 'Что будет при просрочке?'),
      text(
        'Sizga xabar yuboriladi va limitingiz vaqtincha toʻxtatilishi mumkin. Qarzni toʻlaganingizdan soʻng limit tiklanadi.',
        'Вы получите уведомление, лимит может быть временно приостановлен. После погашения он восстановится.',
      ),
    ),
    birzum(
      'q5',
      text('Kartani qanday almashtiraman?', 'Как сменить карту?'),
      text(
        'Profil → Toʻlov kartalari boʻlimida yangi karta qoʻshing. Har bir toʻlovda kartani tanlash mumkin.',
        'Добавьте новую карту в Профиль → Платёжные карты. Карту можно выбрать при каждой оплате.',
      ),
    ),
    birzum(
      'q6',
      text('Mahsulotni qaytarsam boʻladimi?', 'Можно ли вернуть товар?'),
      text(
        'Qaytarish qoidalari tayyorlanmoqda. Hozircha doʻkon bilan bogʻlaning.',
        'Правила возврата готовятся. Пока обратитесь в магазин.',
      ),
      false,
    ),
  ],
  fortuna: loanFaq('fortuna'),
  vodiy: loanFaq('vodiy'),
}

function build(body: Record<string, any>) {
  const { question, answer } = body
  if (!isText(question) || question.uz.length > 300 || question.ru.length > 300) {
    throw invalid({ question: 'is invalid' })
  }
  if (!isText(answer) || answer.uz.length > 4000 || answer.ru.length > 4000) {
    throw invalid({ answer: 'is invalid' })
  }
  return { question, answer, visible: body.visible !== false }
}

appList<Faq>({
  resource: 'faq',
  apps: ['birzum', 'fortuna', 'vodiy'],
  seeds,
  build,
  section: (app) => (app === 'birzum' ? 'faq' : 'mlFaq'),
  actions: (app) => ({
    created: app === 'birzum' ? 'faqCreated' : 'loanFaqCreated',
    saved: app === 'birzum' ? 'faqSaved' : 'loanFaqSaved',
    deleted: app === 'birzum' ? 'faqDeleted' : 'loanFaqDeleted',
  }),
  target: (item) => item.question.uz,
  entity: 'faq',
  hasVisible: true,
  hasOrder: true,
  extras: (items) => ({
    counts: { shown: items.filter((item) => item.visible).length, total: items.length },
  }),
})

let contacts = {
  phone: '712000000',
  hours: text('Har kuni, 09:00–21:00', 'Ежедневно, 09:00–21:00'),
  telegram: 'birzum_support',
}

mockRoutes(
  { method: 'GET', match: '/admin/apps/birzum/contacts', handle: () => contacts },
  {
    method: 'PUT',
    match: '/admin/apps/birzum/contacts',
    handle({ body }) {
      const input = asBody(body)
      const telegram = String(input.telegram ?? '').replace(/^@/, '')
      if (!/^\d{9}$/.test(String(input.phone ?? ''))) throw invalid()
      if (!/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) throw invalid()
      if (!isText(input.hours)) throw invalid()
      contacts = { phone: input.phone, hours: input.hours, telegram }
      logMock({
        section: 'faq',
        kind: 'update',
        action: 'contactsSaved',
        entity: 'support_contacts',
      })
      return contacts
    },
  },
)
