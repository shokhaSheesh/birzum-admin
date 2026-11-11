import { appList } from './appList'
import { invalid, isText, text, type Text } from './util'

type Reply = { id: string; app: string; topic: string; title: Text; text: Text }

const TOPICS: Record<string, string[]> = {
  birzum: ['any', 'payment', 'limit', 'order', 'other'],
  fortuna: ['any', 'payment', 'early', 'card', 'application', 'other'],
  vodiy: ['any', 'payment', 'early', 'card', 'application', 'other'],
}

const reply = (app: string, id: string, topic: string, title: Text, body: Text): Reply => ({
  id: `${app}-${id}`,
  app,
  topic,
  title,
  text: body,
})

const THANKS = text(
  'Murojaatingiz uchun rahmat! Yana savol boʻlsa, shu yerga yozing.',
  'Спасибо за обращение! Если будут вопросы, пишите сюда.',
)

const loanReplies = (app: string): Reply[] => [
  reply(
    app,
    'late',
    'payment',
    text('Toʻlov oʻtmadi', 'Платёж не прошёл'),
    text(
      'Kartada mablagʻ yetmagani uchun toʻlov oʻtmadi. Kartani toʻldirsangiz, ertalab yana yechib koʻramiz. Ilovada «Toʻlash» tugmasi orqali hozir ham toʻlashingiz mumkin.',
      'Платёж не прошёл: на карте не хватило средств. Пополните карту, утром спишем снова. Или оплатите сейчас кнопкой «Оплатить» в приложении.',
    ),
  ),
  reply(
    app,
    'branch',
    'payment',
    text('Filialda toʻlash', 'Оплата в филиале'),
    text(
      'Naqd pulni istalgan filialimizda toʻlashingiz mumkin, pasportingizni olib keling. Manzillar ilovada: Profil → Kontaktlar.',
      'Наличными можно оплатить в любом нашем филиале, возьмите паспорт. Адреса в приложении: Профиль → Контакты.',
    ),
  ),
  reply(
    app,
    'early',
    'early',
    text('Muddatidan oldin yopish', 'Досрочное погашение'),
    text(
      'Qarzlarim → qarz → «Muddatidan oldin toʻlash». Toʻliq yopsangiz foiz shu kungacha hisoblanadi; qisman toʻlasangiz muddat oʻzgarmaydi, oylik toʻlov kamayadi.',
      'Мои займы → займ → «Досрочное погашение». При полном погашении проценты считаются по этот день; при частичном срок прежний, платёж меньше.',
    ),
  ),
  reply(
    app,
    'review',
    'application',
    text('Ariza koʻrib chiqilmoqda', 'Заявка на рассмотрении'),
    text(
      'Arizangizni mutaxassis koʻrib chiqyapti, odatda bir ish kuni ichida javob beramiz. Natija ilovada va SMS orqali keladi.',
      'Заявку проверяет специалист, обычно отвечаем в течение рабочего дня. Результат придёт в приложение и по SMS.',
    ),
  ),
  reply(app, 'thanks', 'any', text('Xayrlashish', 'Прощание'), THANKS),
]

const seeds: Record<string, Reply[]> = {
  birzum: [
    reply(
      'birzum',
      'payDay',
      'payment',
      text('Toʻlov kuni', 'День оплаты'),
      text(
        'Toʻlov kuni shartnomada belgilangan. Uni oʻzgartirib boʻlmaydi, lekin ilovada istalgan kuni muddatidan oldin toʻlashingiz mumkin.',
        'День оплаты указан в договоре. Его нельзя изменить, но в приложении можно оплатить досрочно в любой день.',
      ),
    ),
    reply(
      'birzum',
      'limitRecalc',
      'limit',
      text('Limitni qayta hisoblash', 'Пересчёт лимита'),
      text(
        'Limit kredit tarixingiz asosida hisoblanadi. Muddati tugagach ilovada "Limitni qayta hisoblash" tugmasi chiqadi.',
        'Лимит считается по кредитной истории. Когда срок истечёт, в приложении появится кнопка «Пересчитать лимит».',
      ),
    ),
    reply(
      'birzum',
      'orderStatus',
      'order',
      text('Buyurtma holati', 'Статус заказа'),
      text(
        'Doʻkon bilan bogʻlandim, ular bugun javob berishadi. Holat ilovadagi "Xaridlar" boʻlimida yangilanadi.',
        'Я связался с магазином, сегодня они ответят. Статус обновится в разделе «Покупки».',
      ),
    ),
    reply('birzum', 'thanks', 'any', text('Xayrlashish', 'Прощание'), THANKS),
  ],
  fortuna: loanReplies('fortuna'),
  vodiy: loanReplies('vodiy'),
}

appList<Reply>({
  resource: 'quick-replies',
  apps: ['birzum', 'fortuna', 'vodiy'],
  seeds,
  limit: 500,
  build(body, app) {
    const topic = String(body.topic || 'any')
    if (!TOPICS[app].includes(topic)) throw invalid({ topic: 'is not a topic of this app' })
    if (!isText(body.title) || body.title.uz.length > 120 || body.title.ru.length > 120) {
      throw invalid({ title: 'is invalid' })
    }
    if (!isText(body.text) || body.text.uz.length > 1000 || body.text.ru.length > 1000) {
      throw invalid({ text: 'is invalid' })
    }
    return { topic, title: body.title, text: body.text }
  },
  section: (app) => (app === 'birzum' ? 'quickReplies' : 'mlReplies'),
  actions: (app) => ({
    created: app === 'birzum' ? 'replyCreated' : 'loanReplyCreated',
    saved: app === 'birzum' ? 'replySaved' : 'loanReplySaved',
    deleted: app === 'birzum' ? 'replyDeleted' : 'loanReplyDeleted',
  }),
  target: (item) => item.title.uz,
  entity: 'quick_reply',
})
