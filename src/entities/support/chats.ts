import { loanApplicationsStore } from '@/entities/microloans/applications'
import { loanClientsStore, segmentOf, type ClientSegment } from '@/entities/microloans/loanClients'
import { loansStore } from '@/entities/microloans/loans'
import product3 from '@/shared/assets/products/product-3.jpg'
import type { Brand, Workspace } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

/** The quick topics the client app offers when a chat starts, plus anything else. */
export const CHAT_TOPICS = ['payment', 'limit', 'order', 'other'] as const
/** The quick topics of the microloan apps' Yordam chati (Fortuna and Vodiy). */
export const LOAN_CHAT_TOPICS = ['payment', 'early', 'card', 'application', 'other'] as const
export type ChatTopic = (typeof CHAT_TOPICS)[number] | (typeof LOAN_CHAT_TOPICS)[number]
export const topicsOf = (app: Workspace): readonly ChatTopic[] =>
  app === 'birzum' ? CHAT_TOPICS : LOAN_CHAT_TOPICS

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
  /** Whose app the chat came from: Birzum's client app, or a microloan brand's. */
  app: Workspace
  /** A Birzum client, or a brand's LoanClient. */
  clientId: string
  topic: ChatTopic
  status: 'open' | 'closed'
  /** The admin answering it; none while it waits in the queue. */
  assignee?: string
  /** Shopper messages no admin has read yet. */
  unread: number
  messages: ChatMessage[]
}

/** Support staff who answer chats. Sample names; the real list comes from Adminlar. */
export const OPERATORS = ['Sardor Saidov', 'Malika Rasulova', 'Sardor Nematov']

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

// Microloan chats: who writes about what, by where the client is with the brand
type LoanChatSample = {
  segment: ClientSegment
  topic: ChatTopic
  assignee?: string
  closed?: boolean
  unread: number
  lines: [ChatMessage['from'], string, Date][]
}
const LOAN_SAMPLES: LoanChatSample[] = [
  {
    segment: 'late',
    topic: 'payment',
    unread: 2,
    lines: [
      ['client', 'Assalomu alaykum. Kartamda pul yoʻq edi, toʻlov oʻtmay qoldi.', at(18, 9, 31)],
      ['client', 'Bugun filialga naqd olib borsam boʻladimi? Filial qayerda?', at(18, 9, 33)],
    ],
  },
  {
    segment: 'applied',
    topic: 'application',
    unread: 1,
    lines: [['client', 'Arizamga hali javob kelmadi. Qachon maʼlum boʻladi?', at(18, 8, 2)]],
  },
  {
    segment: 'active',
    topic: 'early',
    assignee: 'Malika Rasulova',
    unread: 1,
    lines: [
      [
        'client',
        'Qarzni muddatidan oldin toʻliq yopmoqchiman. Foiz qayta hisoblanadimi?',
        at(17, 16, 40),
      ],
      ['system', 'Malika Rasulova chatni oldi', at(17, 16, 44)],
      [
        'operator',
        'Ha, toʻliq yopsangiz foiz faqat shu kungacha hisoblanadi. Ilovada Qarzlarim → qarz → «Muddatidan oldin toʻlash»ni tanlang.',
        at(17, 16, 47),
      ],
      ['client', 'Rahmat, ertaga yopaman.', at(17, 17, 5)],
    ],
  },
  {
    segment: 'active',
    topic: 'card',
    assignee: 'Sardor Saidov',
    unread: 0,
    lines: [
      [
        'client',
        'Kartam muddati tugayapti, yangisini qoʻshdim. Toʻlov endi qaysi kartadan yechiladi?',
        at(16, 12, 10),
      ],
      ['system', 'Sardor Saidov chatni oldi', at(16, 12, 15)],
      [
        'operator',
        'Avtomatik yechish qarz olingan kartadan boʻladi. Yangi kartadan toʻlash uchun «Toʻlash»ni bosib, uni tanlang.',
        at(16, 12, 18),
      ],
      [
        'note',
        'Eski karta noyabrda tugaydi. Keyingi toʻlov kuni avtomatik yechish oʻtmasa, qoʻngʻiroq qilish.',
        at(16, 12, 20),
      ],
    ],
  },
  {
    segment: 'registered',
    topic: 'other',
    assignee: 'Sardor Saidov',
    closed: true,
    unread: 0,
    lines: [
      ['client', 'Biznes uchun qarz olsa boʻladimi? Qancha muddatga beriladi?', at(14, 11, 0)],
      ['system', 'Sardor Saidov chatni oldi', at(14, 11, 6)],
      [
        'operator',
        'Ha, mahsulotlar roʻyxatida hammasi bor: summa, muddat va foiz. Ilovadagi kalkulyatorda oylik toʻlovni oldindan koʻrasiz.',
        at(14, 11, 9),
      ],
      ['client', 'Tushunarli, rahmat!', at(14, 11, 15)],
      ['system', 'Sardor Saidov chatni yopdi', at(14, 11, 16)],
    ],
  },
  {
    segment: 'repaid',
    topic: 'other',
    assignee: 'Malika Rasulova',
    closed: true,
    unread: 0,
    lines: [
      ['client', 'Qarzim yopildi. Kredit tarixida qachon koʻrinadi?', at(12, 15, 20)],
      ['system', 'Malika Rasulova chatni oldi', at(12, 15, 24)],
      [
        'operator',
        'Yopilgan qarz kredit byurosiga 3 ish kuni ichida yuboriladi. Undan keyin yangi ariza bersangiz boʻladi.',
        at(12, 15, 28),
      ],
      ['system', 'Malika Rasulova chatni yopdi', at(12, 15, 40)],
    ],
  },
]

function loanChats(brand: Brand): Chat[] {
  const apps = loanApplicationsStore.getAll().filter((app) => app.brand === brand)
  const loans = loansStore.getAll().filter((loan) => loan.brand === brand)
  const clients = loanClientsStore.getAll().filter((client) => client.brand === brand)
  const used = new Set<string>()
  return LOAN_SAMPLES.flatMap((sample, i) => {
    const client = clients.find(
      (c) => !used.has(c.id) && !c.block && segmentOf(c, apps, loans) === sample.segment,
    )
    if (!client) return []
    used.add(client.id)
    // Vodiy's chats an hour later, so the two brands' lists are not the same
    const shift = brand === 'vodiy' ? 3_600_000 : 0
    return [
      {
        id: `${brand}-ch${i + 1}`,
        app: brand,
        clientId: client.id,
        topic: sample.topic,
        status: sample.closed ? 'closed' : 'open',
        assignee: sample.assignee,
        unread: sample.unread,
        messages: sample.lines.map(([from, text, when]) =>
          msg(from, text, new Date(when.getTime() + shift), {
            author: from === 'client' ? undefined : sample.assignee,
          }),
        ),
      },
    ]
  })
}

// Invented sample chats with the sample shoppers. Replace with the support system's API.
export const chatsStore = createStore<Chat>([
  ...loanChats('fortuna'),
  ...loanChats('vodiy'),
  {
    id: 'ch1',
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
    clientId: 'c1',
    topic: 'other',
    status: 'open',
    unread: 1,
    messages: [msg('client', 'Ilovada rus tiliga qanday oʻtkazaman?', at(18, 10, 3))],
  },
  {
    id: 'ch7',
    app: 'birzum',
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
    app: 'birzum',
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
    app: 'birzum',
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
