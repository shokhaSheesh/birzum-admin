import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'
import type { ChatTopic } from './chats'

/**
 * A saved answer operators drop into a chat, written in both languages so it goes out in the
 * shopper's. `any` fits every topic; the others come first in chats of that topic.
 */
export type QuickReply = {
  id: string
  topic: ChatTopic | 'any'
  title: LocalizedText
  text: LocalizedText
}

// The answers support uses today. Replace with the API.
export const repliesStore = createStore<QuickReply>([
  {
    id: 'q-payDay',
    topic: 'payment',
    title: { uz: 'Toʻlov kuni', ru: 'День оплаты' },
    text: {
      uz: 'Toʻlov kuni shartnomada belgilangan. Uni oʻzgartirib boʻlmaydi, lekin ilovada istalgan kuni muddatidan oldin toʻlashingiz mumkin.',
      ru: 'День оплаты указан в договоре. Его нельзя изменить, но в приложении можно оплатить досрочно в любой день.',
    },
  },
  {
    id: 'q-limitRecalc',
    topic: 'limit',
    title: { uz: 'Limitni qayta hisoblash', ru: 'Пересчёт лимита' },
    text: {
      uz: 'Limit kredit tarixingiz asosida hisoblanadi. Muddati tugagach ilovada "Limitni qayta hisoblash" tugmasi chiqadi.',
      ru: 'Лимит считается по кредитной истории. Когда срок истечёт, в приложении появится кнопка «Пересчитать лимит».',
    },
  },
  {
    id: 'q-orderStatus',
    topic: 'order',
    title: { uz: 'Buyurtma holati', ru: 'Статус заказа' },
    text: {
      uz: 'Doʻkon bilan bogʻlandim, ular bugun javob berishadi. Holat ilovadagi "Xaridlar" boʻlimida yangilanadi.',
      ru: 'Я связался с магазином, сегодня они ответят. Статус обновится в разделе «Покупки».',
    },
  },
  {
    id: 'q-cardChange',
    topic: 'payment',
    title: { uz: 'Kartani almashtirish', ru: 'Смена карты' },
    text: {
      uz: 'Profil → Toʻlov kartalari boʻlimida yangi karta qoʻshing; keyingi toʻlov undan yechiladi.',
      ru: 'Добавьте новую карту в Профиль → Платёжные карты; следующий платёж спишется с неё.',
    },
  },
  {
    id: 'q-thanks',
    topic: 'any',
    title: { uz: 'Xayrlashish', ru: 'Прощание' },
    text: {
      uz: 'Murojaatingiz uchun rahmat! Yana savol boʻlsa, shu yerga yozing.',
      ru: 'Спасибо за обращение! Если будут вопросы, пишите сюда.',
    },
  },
])
