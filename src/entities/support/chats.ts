import product3 from '@/shared/assets/products/product-3.jpg'
import { createStore } from '@/shared/lib/createStore'

/** The quick topics the client app offers when a chat starts, plus anything else. */
export const CHAT_TOPICS = ['payment', 'limit', 'order', 'other'] as const
export type ChatTopic = (typeof CHAT_TOPICS)[number]

/**
 * `client`: the shopper, from the client app. `operator`: an admin's answer, which the shopper
 * sees. `note`: an admin's internal note, which the shopper never sees. `system`: what
 * happened to the chat (taken, handed over, closed).
 */
export type ChatMessage = {
  id: string
  from: 'client' | 'operator' | 'note' | 'system'
  /** The admin, for operator, note and system lines. */
  author?: string
  text: string
  at: Date
  image?: string
}

export type Chat = {
  id: string
  clientId: string
  topic: ChatTopic
  status: 'open' | 'closed'
  /** The admin answering it; none while it waits in the queue. */
  assignee?: string
  /** Shopper messages no admin has read yet. */
  unread: number
  messages: ChatMessage[]
}

/** Support staff who answer chats. Sample names; the real list comes from Adminlar va rollar. */
export const OPERATORS = ['Sardor Saidov', 'Malika Rasulova', 'Sardor Nematov']

/** Saved answers an operator drops into the reply. */
export const QUICK_REPLIES = [
  'payDay',
  'limitRecalc',
  'orderStatus',
  'cardChange',
  'thanks',
] as const

export const lastMessageOf = (chat: Chat) =>
  chat.messages.filter((message) => message.from !== 'system').at(-1) ?? chat.messages.at(-1)!

const at = (day: number, hour: number, minute: number) => new Date(2026, 9, day, hour, minute)
let n = 0
const msg = (
  from: ChatMessage['from'],
  text: string,
  when: Date,
  extra: Partial<ChatMessage> = {},
) => ({
  id: `m${++n}`,
  from,
  text,
  at: when,
  ...extra,
})

// Invented sample chats with the sample shoppers. Replace with the support system's API.
export const chatsStore = createStore<Chat>([
  {
    id: 'ch1',
    clientId: 'c4',
    topic: 'payment',
    status: 'open',
    unread: 2,
    messages: [
      msg(
        'client',
        'Assalomu alaykum. Kartamdan pul yechilmabdi, endi qarzdor deb chiqyapti.',
        at(18, 9, 12),
      ),
      msg(
        'client',
        'Oylik kechikdi, 20-oktabrgacha toʻlasam boʻladimi? Jarima boʻladimi?',
        at(18, 9, 14),
      ),
    ],
  },
  {
    id: 'ch2',
    clientId: 'c3',
    topic: 'order',
    status: 'open',
    unread: 1,
    messages: [
      msg(
        'client',
        'Telefon qutisi ochilgan holda keldi, ekranda chiziq bor. Rasmini yubordim.',
        at(18, 8, 40),
      ),
      msg('client', '', at(18, 8, 41), { image: product3 }),
    ],
  },
  {
    id: 'ch3',
    clientId: 'c13',
    topic: 'limit',
    status: 'open',
    assignee: 'Sardor Saidov',
    unread: 1,
    messages: [
      msg('client', 'Nega menga limit berilmadi? MyID dan oʻtdim.', at(17, 18, 5)),
      msg('system', 'Sardor Saidov chatni oldi', at(17, 18, 20), { author: 'Sardor Saidov' }),
      msg(
        'operator',
        'Assalomu alaykum, Zarina! Limitni FlexSoft kredit tarixi asosida hisoblaydi. Bir daqiqa, tekshirib koʻraman.',
        at(17, 18, 22),
        { author: 'Sardor Saidov' },
      ),
      msg(
        'note',
        'FlexSoft javobi: kredit tarixi yoʻq. 30 kundan keyin qayta hisoblash mumkin.',
        at(17, 18, 30),
        {
          author: 'Sardor Saidov',
        },
      ),
      msg('client', 'Xoʻp, unda qachon qayta urinsam boʻladi?', at(18, 7, 55)),
    ],
  },
  {
    id: 'ch4',
    clientId: 'c9',
    topic: 'payment',
    status: 'open',
    assignee: 'Malika Rasulova',
    unread: 0,
    messages: [
      msg('client', 'Toʻlov kunini 5-sanadan 15-sanaga oʻzgartirish mumkinmi?', at(17, 14, 2)),
      msg('system', 'Malika Rasulova chatni oldi', at(17, 14, 10), { author: 'Malika Rasulova' }),
      msg(
        'operator',
        'Shahnoza, toʻlov kuni shartnomada belgilangan, uni faqat merchant bilan yangi shartnoma orqali oʻzgartirish mumkin. Lekin toʻlovni muddatidan oldin qilsangiz boʻladi.',
        at(17, 14, 15),
        { author: 'Malika Rasulova' },
      ),
      msg('client', 'Tushunarli, rahmat. Bu oy 22-sanagacha toʻlayman.', at(17, 14, 30)),
      msg('note', 'Klient 22.10 gacha toʻlashga vaʼda berdi.', at(17, 14, 32), {
        author: 'Malika Rasulova',
      }),
    ],
  },
  {
    id: 'ch5',
    clientId: 'c7',
    topic: 'order',
    status: 'open',
    assignee: 'Sardor Nematov',
    unread: 0,
    messages: [
      msg(
        'client',
        'Buyurtmam hali ham "Koʻrib chiqilmoqda". Qachon tasdiqlanadi?',
        at(16, 11, 20),
      ),
      msg('system', 'Sardor Nematov chatni oldi', at(16, 11, 26), { author: 'Sardor Nematov' }),
      msg(
        'operator',
        'Kamola, doʻkon bilan bogʻlandim, bugun soat 15:00 gacha javob berishadi.',
        at(16, 11, 40),
        { author: 'Sardor Nematov' },
      ),
    ],
  },
  {
    id: 'ch6',
    clientId: 'c1',
    topic: 'other',
    status: 'open',
    unread: 1,
    messages: [msg('client', 'Ilovada rus tiliga qanday oʻtkazaman?', at(18, 10, 3))],
  },
  {
    id: 'ch7',
    clientId: 'c2',
    topic: 'payment',
    status: 'closed',
    assignee: 'Sardor Saidov',
    unread: 0,
    messages: [
      msg('client', 'Nasiyani muddatidan oldin yopsam ustama kamayadimi?', at(15, 16, 0)),
      msg('system', 'Sardor Saidov chatni oldi', at(15, 16, 4), { author: 'Sardor Saidov' }),
      msg(
        'operator',
        'Jasur, ilovada "Toʻliq yopish"ni tanlasangiz qolgan summani bir martada toʻlaysiz. Ustama shartnomada belgilangan, u oʻzgarmaydi.',
        at(15, 16, 8),
        { author: 'Sardor Saidov' },
      ),
      msg('client', 'Tushundim, rahmat!', at(15, 16, 12)),
      msg('system', 'Sardor Saidov chatni yopdi', at(15, 16, 13), { author: 'Sardor Saidov' }),
    ],
  },
  {
    id: 'ch8',
    clientId: 'c10',
    topic: 'limit',
    status: 'closed',
    assignee: 'Malika Rasulova',
    unread: 0,
    messages: [
      msg('client', 'Limitim tugab qoldi, qanday oshiraman?', at(14, 12, 30)),
      msg('system', 'Malika Rasulova chatni oldi', at(14, 12, 33), { author: 'Malika Rasulova' }),
      msg(
        'operator',
        'Ulugʻbek, limit toʻlovlaringiz yopilgan sari qaytadi. Muddati tugasa, ilovada "Limitni qayta hisoblash" tugmasi chiqadi.',
        at(14, 12, 36),
        { author: 'Malika Rasulova' },
      ),
      msg('system', 'Malika Rasulova chatni yopdi', at(14, 12, 50), { author: 'Malika Rasulova' }),
    ],
  },
  {
    id: 'ch9',
    clientId: 'c5',
    topic: 'order',
    status: 'closed',
    assignee: 'Sardor Nematov',
    unread: 0,
    messages: [
      msg('client', 'Kir yuvish mashinasini oʻrnatib berishadimi?', at(13, 10, 5)),
      msg('system', 'Sardor Nematov chatni oldi', at(13, 10, 9), { author: 'Sardor Nematov' }),
      msg('operator', 'Ha, Mediapark Toshkent ichida bepul oʻrnatib beradi.', at(13, 10, 12), {
        author: 'Sardor Nematov',
      }),
      msg('system', 'Sardor Nematov chatni yopdi', at(13, 10, 30), { author: 'Sardor Nematov' }),
    ],
  },
])
