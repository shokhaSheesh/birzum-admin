import type { Brand, Workspace } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'
import type { ChatTopic } from './chats'

/**
 * A saved answer operators drop into a chat, written in both languages so it goes out in the
 * shopper's. `any` fits every topic; the others come first in chats of that topic.
 */
export type QuickReply = {
  id: string
  /** Whose operators use it: Birzum's, or a microloan brand's. */
  app: Workspace
  topic: ChatTopic | 'any'
  title: LocalizedText
  text: LocalizedText
}

// The same starting set for each microloan brand; each brand then edits its own
const loanReplies = (brand: Brand): QuickReply[] => [
  {
    id: `${brand}-q-late`,
    app: brand,
    topic: 'payment',
    title: { uz: 'Toʻlov oʻtmadi', ru: 'Платёж не прошёл' },
    text: {
      uz: 'Kartada mablagʻ yetmagani uchun toʻlov oʻtmadi. Kartani toʻldirsangiz, ertalab yana yechib koʻramiz. Ilovada «Toʻlash» tugmasi orqali hozir ham toʻlashingiz mumkin.',
      ru: 'Платёж не прошёл: на карте не хватило средств. Пополните карту, утром спишем снова. Или оплатите сейчас кнопкой «Оплатить» в приложении.',
    },
  },
  {
    id: `${brand}-q-branch`,
    app: brand,
    topic: 'payment',
    title: { uz: 'Filialda toʻlash', ru: 'Оплата в филиале' },
    text: {
      uz: 'Naqd pulni istalgan filialimizda toʻlashingiz mumkin, pasportingizni olib keling. Manzillar ilovada: Profil → Kontaktlar.',
      ru: 'Наличными можно оплатить в любом нашем филиале, возьмите паспорт. Адреса в приложении: Профиль → Контакты.',
    },
  },
  {
    id: `${brand}-q-early`,
    app: brand,
    topic: 'early',
    title: { uz: 'Muddatidan oldin yopish', ru: 'Досрочное погашение' },
    text: {
      uz: 'Qarzlarim → qarz → «Muddatidan oldin toʻlash». Toʻliq yopsangiz foiz shu kungacha hisoblanadi; qisman toʻlasangiz muddat oʻzgarmaydi, oylik toʻlov kamayadi.',
      ru: 'Мои займы → займ → «Досрочное погашение». При полном погашении проценты считаются по этот день; при частичном срок прежний, платёж меньше.',
    },
  },
  {
    id: `${brand}-q-card`,
    app: brand,
    topic: 'card',
    title: { uz: 'Kartani almashtirish', ru: 'Смена карты' },
    text: {
      uz: 'Avtomatik yechish qarz olingan kartadan boʻladi. Boshqa kartadan toʻlash uchun uni Kartalar boʻlimiga qoʻshing, keyin «Toʻlash»ni bosib yangi kartani tanlang.',
      ru: 'Автосписание идёт с карты, на которую выдан займ. Чтобы платить с другой, добавьте её в «Карты», затем нажмите «Оплатить» и выберите новую карту.',
    },
  },
  {
    id: `${brand}-q-review`,
    app: brand,
    topic: 'application',
    title: { uz: 'Ariza koʻrib chiqilmoqda', ru: 'Заявка на рассмотрении' },
    text: {
      uz: 'Arizangizni mutaxassis koʻrib chiqyapti, odatda bir ish kuni ichida javob beramiz. Natija ilovada va SMS orqali keladi.',
      ru: 'Заявку проверяет специалист, обычно отвечаем в течение рабочего дня. Результат придёт в приложение и по SMS.',
    },
  },
  {
    id: `${brand}-q-thanks`,
    app: brand,
    topic: 'any',
    title: { uz: 'Xayrlashish', ru: 'Прощание' },
    text: {
      uz: 'Murojaatingiz uchun rahmat! Yana savol boʻlsa, shu yerga yozing.',
      ru: 'Спасибо за обращение! Если будут вопросы, пишите сюда.',
    },
  },
]

// The answers support uses today. Replace with the API.
export const repliesStore = createStore<QuickReply>([
  ...loanReplies('fortuna'),
  ...loanReplies('vodiy'),
  {
    app: 'birzum',
    id: 'q-payDay',
    topic: 'payment',
    title: { uz: 'Toʻlov kuni', ru: 'День оплаты' },
    text: {
      uz: 'Toʻlov kuni shartnomada belgilangan. Uni oʻzgartirib boʻlmaydi, lekin ilovada istalgan kuni muddatidan oldin toʻlashingiz mumkin.',
      ru: 'День оплаты указан в договоре. Его нельзя изменить, но в приложении можно оплатить досрочно в любой день.',
    },
  },
  {
    app: 'birzum',
    id: 'q-limitRecalc',
    topic: 'limit',
    title: { uz: 'Limitni qayta hisoblash', ru: 'Пересчёт лимита' },
    text: {
      uz: 'Limit kredit tarixingiz asosida hisoblanadi. Muddati tugagach ilovada "Limitni qayta hisoblash" tugmasi chiqadi.',
      ru: 'Лимит считается по кредитной истории. Когда срок истечёт, в приложении появится кнопка «Пересчитать лимит».',
    },
  },
  {
    app: 'birzum',
    id: 'q-orderStatus',
    topic: 'order',
    title: { uz: 'Buyurtma holati', ru: 'Статус заказа' },
    text: {
      uz: 'Doʻkon bilan bogʻlandim, ular bugun javob berishadi. Holat ilovadagi "Xaridlar" boʻlimida yangilanadi.',
      ru: 'Я связался с магазином, сегодня они ответят. Статус обновится в разделе «Покупки».',
    },
  },
  {
    app: 'birzum',
    id: 'q-cardChange',
    topic: 'payment',
    title: { uz: 'Kartani almashtirish', ru: 'Смена карты' },
    text: {
      uz: 'Profil → Toʻlov kartalari boʻlimida yangi karta qoʻshing; keyingi toʻlov undan yechiladi.',
      ru: 'Добавьте новую карту в Профиль → Платёжные карты; следующий платёж спишется с неё.',
    },
  },
  {
    app: 'birzum',
    id: 'q-thanks',
    topic: 'any',
    title: { uz: 'Xayrlashish', ru: 'Прощание' },
    text: {
      uz: 'Murojaatingiz uchun rahmat! Yana savol boʻlsa, shu yerga yozing.',
      ru: 'Спасибо за обращение! Если будут вопросы, пишите сюда.',
    },
  },
])
