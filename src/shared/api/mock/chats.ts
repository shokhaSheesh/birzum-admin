import { mockError, mockRoutes } from './index'
import {
  ACTOR,
  asBody,
  invalid,
  matches,
  newId,
  notFound,
  nowIso,
  paged,
  text,
  type Text,
} from './util'

type Staff = { id: string; name: string }
type Kind = 'client' | 'operator' | 'note' | 'system'

type Line = {
  id: string
  kind: Kind
  key?: 'took' | 'handed' | 'closed' | 'reopened'
  target_name?: string
  text: string
  images: string[]
  author: Staff | null
  at: string
}

type Chat = {
  id: string
  app: string
  client: { id: string; name: string; phone: string }
  topic: string
  status: 'open' | 'closed'
  unread: number
  assignee: Staff | null
  created_at: string
  messages: Line[]
}

const OPERATORS: Staff[] = [
  { id: ACTOR.id, name: ACTOR.name },
  { id: 'a2', name: 'Malika Rasulova' },
  { id: 'a3', name: 'Sardor Nematov' },
]

const TOPICS: Record<string, { code: string; label: Text }[]> = {
  birzum: [
    { code: 'payment', label: text('Toʻlov', 'Платёж') },
    { code: 'limit', label: text('Limit', 'Лимит') },
    { code: 'order', label: text('Buyurtma', 'Заказ') },
    { code: 'other', label: text('Boshqa', 'Другое') },
  ],
  fortuna: [
    { code: 'payment', label: text('Toʻlov', 'Платёж') },
    { code: 'early', label: text('Muddatidan oldin', 'Досрочное') },
    { code: 'card', label: text('Karta', 'Карта') },
    { code: 'application', label: text('Ariza', 'Заявка') },
    { code: 'other', label: text('Boshqa', 'Другое') },
  ],
}
TOPICS.vodiy = TOPICS.fortuna

const line = (
  kind: Kind,
  body: string,
  minutesAgo: number,
  author: Staff | null = null,
  key?: Line['key'],
): Line => ({
  id: newId(),
  kind,
  key,
  text: body,
  images: [],
  author,
  at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
})

function chat(
  app: string,
  name: string,
  phone: string,
  topic: string,
  messages: Line[],
  extra: { unread?: number; assignee?: Staff | null; status?: Chat['status'] } = {},
): Chat {
  return {
    id: newId(),
    app,
    client: { id: newId(), name, phone },
    topic,
    status: extra.status ?? 'open',
    unread: extra.unread ?? 0,
    assignee: extra.assignee ?? null,
    created_at: messages[0].at,
    messages,
  }
}

const MALIKA = OPERATORS[1]
const SARDOR = OPERATORS[2]

const chats: Chat[] = [
  chat(
    'birzum',
    'Zarina Karimova',
    '+998901234567',
    'payment',
    [
      line(
        'client',
        'Assalomu alaykum, kartamdan pul yechilmabdi, lekin ilovada qarz turibdi.',
        14,
      ),
      line('client', 'Iltimos, tekshirib bering.', 12),
    ],
    { unread: 2 },
  ),
  chat(
    'birzum',
    'Bekzod Aliyev',
    '+998935551122',
    'limit',
    [line('client', 'Limitim tugagan, qayta hisoblash tugmasi yoʻq.', 95)],
    { unread: 1 },
  ),
  chat(
    'birzum',
    'Dilnoza Rahimova',
    '+998977003344',
    'order',
    [
      line('client', 'Buyurtmam 3 kundan beri yetib kelmadi.', 300),
      line('system', '', 280, MALIKA, 'took'),
      line('operator', 'Doʻkon bilan bogʻlandim, ular bugun javob berishadi.', 270, MALIKA),
      line('note', 'Mediapark menejeri ertaga qaytadi.', 265, MALIKA),
    ],
    { assignee: MALIKA },
  ),
  chat(
    'birzum',
    'Otabek Nurmatov',
    '+998909990011',
    'payment',
    [
      line('client', 'Toʻlov kunini oʻzgartirsam boʻladimi?', 2600),
      line('system', '', 2590, SARDOR, 'took'),
      line(
        'operator',
        'Toʻlov kuni shartnomada belgilangan, lekin istalgan kuni oldindan toʻlashingiz mumkin.',
        2580,
        SARDOR,
      ),
      line('client', 'Tushunarli, rahmat!', 2570),
      line('system', '', 2560, SARDOR, 'closed'),
    ],
    { status: 'closed', assignee: SARDOR },
  ),
  chat(
    'fortuna',
    'Madina Yusupova',
    '+998946541230',
    'payment',
    [line('client', 'Bugun toʻlov kuni edi, kartamda pul bor edi, yechilmadi.', 40)],
    { unread: 1 },
  ),
  chat(
    'fortuna',
    'Javlon Ergashev',
    '+998901237654',
    'application',
    [
      line('client', 'Arizam necha kunda koʻrib chiqiladi?', 180),
      line('system', '', 170, ACTOR, 'took'),
      line('operator', 'Odatda bir ish kuni ichida. Natija SMS orqali keladi.', 160, ACTOR),
    ],
    { assignee: ACTOR },
  ),
  chat(
    'vodiy',
    'Sevara Qodirova',
    '+998915553040',
    'early',
    [line('client', 'Qarzni muddatidan oldin yopmoqchiman, qanday qilaman?', 55)],
    { unread: 1 },
  ),
  chat(
    'vodiy',
    'Aziza Hakimova',
    '+998998887766',
    'card',
    [
      line('client', 'Karta almashtirdim, endi qaysi kartadan yechiladi?', 5000),
      line('system', '', 4990, MALIKA, 'took'),
      line('operator', 'Avtomatik yechish qarz olingan kartadan boʻladi.', 4980, MALIKA),
      line('system', '', 4970, MALIKA, 'closed'),
    ],
    { status: 'closed', assignee: MALIKA },
  ),
]

const appChats = (app: string) => {
  if (!TOPICS[app]) throw notFound()
  return chats.filter((c) => c.app === app)
}

const find = (app: string, id: string) => {
  const found = appChats(app).find((c) => c.id === id)
  if (!found) throw notFound()
  return found
}

const lastOf = (c: Chat) => {
  const real = [...c.messages].reverse().find((m) => m.kind !== 'system')
  return real ?? c.messages[c.messages.length - 1]
}

const updatedAt = (c: Chat) => c.messages[c.messages.length - 1].at

const row = (c: Chat) => {
  const last = lastOf(c)
  return {
    id: c.id,
    client: c.client,
    topic: c.topic,
    status: c.status,
    last_message: {
      from: last.kind,
      text: last.text,
      has_image: last.images.length > 0,
      at: last.at,
    },
    unread: c.unread,
    assignee: c.assignee,
    created_at: c.created_at,
    updated_at: updatedAt(c),
  }
}

const inBox = (c: Chat, box: string) =>
  box === 'queue'
    ? c.status === 'open' && !c.assignee
    : box === 'mine'
      ? c.status === 'open' && c.assignee?.id === ACTOR.id
      : box === 'open'
        ? c.status === 'open'
        : c.status === 'closed'

const add = (c: Chat, next: Line) => {
  c.messages.push(next)
  return next
}
const system = (c: Chat, key: NonNullable<Line['key']>, targetName?: string) =>
  add(c, { ...line('system', '', 0, ACTOR, key), target_name: targetName, at: nowIso() })

mockRoutes(
  {
    method: 'GET',
    match: '/admin/apps/:app/chats',
    handle({ params, query }) {
      const box = query.box ?? 'queue'
      if (!['queue', 'mine', 'open', 'closed'].includes(box)) throw invalid({ box: 'is invalid' })
      const scope = appChats(params.app).filter((c) =>
        matches(query.q, c.client.name, c.client.phone, ...c.messages.map((m) => m.text)),
      )
      const rows = scope
        .filter((c) => inBox(c, box))
        .sort((a, b) => updatedAt(b).localeCompare(updatedAt(a)))
      const count = (name: string) => scope.filter((c) => inBox(c, name)).length
      return {
        ...paged(rows.map(row), query),
        counts: {
          queue: count('queue'),
          mine: count('mine'),
          open: count('open'),
          closed: count('closed'),
        },
      }
    },
  },
  // Fixed paths before `/:id`
  {
    method: 'GET',
    match: '/admin/apps/:app/chats/operators',
    handle({ params }) {
      appChats(params.app)
      return { items: OPERATORS }
    },
  },
  {
    method: 'GET',
    match: '/admin/apps/:app/chat-topics',
    handle({ params }) {
      if (!TOPICS[params.app]) throw notFound()
      return { items: TOPICS[params.app] }
    },
  },
  {
    method: 'GET',
    match: '/admin/apps/:app/chats/:id',
    handle({ params }) {
      const c = find(params.app, params.id)
      return {
        ...row(c),
        client: { ...c.client, status: null, debt: null, applications: [] },
        messages: c.messages,
      }
    },
  },
  {
    method: 'POST',
    match: '/admin/apps/:app/chats/:id/read',
    handle({ params }) {
      find(params.app, params.id).unread = 0
      return {}
    },
  },
  {
    method: 'POST',
    match: '/admin/apps/:app/chats/:id/take',
    handle({ params }) {
      const c = find(params.app, params.id)
      if (c.assignee && c.assignee.id !== ACTOR.id) {
        throw mockError(409, 'chat_taken', 'Another operator has this chat')
      }
      if (!c.assignee) {
        c.assignee = { ...ACTOR }
        system(c, 'took')
      }
      return row(c)
    },
  },
  {
    method: 'POST',
    match: '/admin/apps/:app/chats/:id/assign',
    handle({ params, body }) {
      const c = find(params.app, params.id)
      const target = OPERATORS.find((o) => o.id === asBody(body).staff_id)
      if (!target) {
        throw Object.assign(mockError(400, 'chat_assignee_invalid', 'Invalid operator'), {
          details: { staff_id: 'cannot answer chats' },
        })
      }
      if (c.assignee?.id !== target.id) {
        c.assignee = target
        if (target.id === ACTOR.id) system(c, 'took')
        else system(c, 'handed', target.name)
      }
      return row(c)
    },
  },
  {
    method: 'POST',
    match: '/admin/apps/:app/chats/:id/messages',
    handle({ params, body }) {
      const c = find(params.app, params.id)
      const input = asBody(body)
      const images = (input.images ?? []) as string[]
      const message = String(input.text ?? '').trim()
      if (input.kind !== 'reply' && input.kind !== 'note') throw invalid({ kind: 'is invalid' })
      if ((!message && images.length === 0) || images.length > 5 || message.length > 4000)
        throw invalid()
      if (input.kind === 'reply') {
        if (!c.assignee) {
          c.assignee = { ...ACTOR }
          system(c, 'took')
        }
        if (c.status === 'closed') {
          c.status = 'open'
          system(c, 'reopened')
        }
      }
      const created = add(c, {
        ...line(input.kind === 'reply' ? 'operator' : 'note', message, 0, { ...ACTOR }),
        images,
        at: nowIso(),
      })
      return { message: created, chat: row(c) }
    },
  },
  {
    method: 'POST',
    match: '/admin/apps/:app/chats/:id/close',
    handle({ params }) {
      const c = find(params.app, params.id)
      if (c.status === 'open') {
        c.status = 'closed'
        system(c, 'closed')
      }
      return row(c)
    },
  },
  {
    method: 'POST',
    match: '/admin/apps/:app/chats/:id/reopen',
    handle({ params }) {
      const c = find(params.app, params.id)
      if (c.status === 'closed') {
        c.status = 'open'
        system(c, 'reopened')
      }
      return row(c)
    },
  },
)
