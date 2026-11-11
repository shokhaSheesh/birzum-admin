import { appList } from './appList'
import { BRAND_NAME, logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { ago, asBody, invalid, isText, nowIso, notFound, text, type Text } from './util'

const BRANDS = ['fortuna', 'vodiy']

const brandOf = (app: string) => {
  if (!BRANDS.includes(app)) throw notFound()
  return app
}
const logBrand = (
  section: string,
  action: string,
  app: string,
  target: string,
  entity: string,
  kind: 'update' | 'create' | 'delete' = 'update',
) =>
  logMock({
    section,
    kind,
    action,
    target,
    entity,
    entityId: app,
    company: app,
    params: { brand: BRAND_NAME[app] },
  })

// Menu buttons: a fixed set per brand; the admin changes the order, the label and whether it shows
type Slot = {
  id: string
  app: string
  place: 'action' | 'tab'
  key: string
  label: Text
  visible: boolean
  locked: boolean
}

const slots = (app: string): Slot[] => {
  const slot = (
    place: Slot['place'],
    key: string,
    uz: string,
    ru: string,
    visible = true,
    locked = false,
  ): Slot => ({
    id: `${app}-${place}-${key}`,
    app,
    place,
    key,
    label: text(uz, ru),
    visible,
    locked,
  })
  return [
    slot('action', 'credits', 'Kreditlar', 'Кредиты'),
    slot('action', 'pay', 'Toʻlov', 'Оплата'),
    slot('action', 'cards', 'Kartalar', 'Карты'),
    slot('action', 'support', 'Yordam', 'Помощь'),
    slot('action', 'schedule', 'Jadval', 'График', false),
    slot('action', 'applications', 'Arizalarim', 'Мои заявки', false),
    slot('tab', 'home', 'Asosiy', 'Главная', true, true),
    slot('tab', 'loans', 'Qarzlarim', 'Мои займы'),
    slot('tab', 'apply', 'Qarz olish', 'Взять заём', true, true),
    slot('tab', 'payments', 'Monitoring', 'Мониторинг'),
    slot('tab', 'profile', 'Profil', 'Профиль', true, true),
  ]
}
const menus: Record<string, Slot[]> = { fortuna: slots('fortuna'), vodiy: slots('vodiy') }

const menuView = (items: Slot[]) =>
  items.map((item) => ({
    ...item,
    sort_order: items.filter((s) => s.place === item.place).indexOf(item) + 1,
  }))

mockRoutes(
  {
    method: 'GET',
    match: '/admin/apps/:app/menu',
    handle({ params }) {
      const items = menus[brandOf(params.app)]
      return { items: menuView(items), total: items.length }
    },
  },
  {
    method: 'PUT',
    match: '/admin/apps/:app/menu/order',
    handle({ params, body }) {
      const items = menus[brandOf(params.app)]
      const input = asBody(body)
      if (input.place !== 'action' && input.place !== 'tab') {
        throw invalid({ place: 'must be one of action, tab' })
      }
      const group = items.filter((s) => s.place === input.place)
      const ids = (input.ids ?? []) as string[]
      if (ids.length !== group.length || !group.every((s) => ids.includes(s.id))) {
        throw mockError(400, 'invalid_order', 'The order must list every button')
      }
      const sorted = ids.map((id) => group.find((s) => s.id === id)!)
      let next = 0
      for (let i = 0; i < items.length; i++) {
        if (items[i].place === input.place) items[i] = sorted[next++]
      }
      logBrand('mlOnboarding', 'appMenuOrdered', params.app, 'Menyu', 'menu_slot')
      return {}
    },
  },
  {
    method: 'PUT',
    match: '/admin/apps/:app/menu/:id',
    handle({ params, body }) {
      const items = menus[brandOf(params.app)]
      const slot = items.find((s) => s.id === params.id)
      if (!slot) throw notFound()
      const input = asBody(body)
      if (!isText(input.label)) throw invalid({ label: 'is required in both languages' })
      if (input.visible === false && slot.locked) {
        throw mockError(400, 'slot_locked', 'This button always shows')
      }
      slot.label = input.label
      if (typeof input.visible === 'boolean') slot.visible = input.visible
      logBrand('mlOnboarding', 'appMenuSaved', params.app, slot.label.uz, 'menu_slot')
      return menuView(items).find((s) => s.id === slot.id)
    },
  },
)

// Tiles on the brand's home screen. No /visible call: the whole tile is sent again.
type Tile = {
  id: string
  app: string
  title: Text
  image_url: string
  text: Text
  visible: boolean
}

appList<Tile>({
  resource: 'tiles',
  apps: BRANDS,
  seeds: {
    fortuna: [
      {
        id: 't1',
        app: 'fortuna',
        title: text('Rivoj haqida', 'О Rivoj'),
        image_url: '',
        text: text(
          'Tadbirkorlar uchun garovsiz 50 mln soʻmgacha.',
          'Для предпринимателей, без залога, до 50 млн сумов.',
        ),
        visible: true,
      },
      {
        id: 't2',
        app: 'fortuna',
        title: text('Filiallar', 'Филиалы'),
        image_url: '',
        text: text('8 ta viloyatda filiallarimiz bor.', 'Наши филиалы в 8 регионах.'),
        visible: true,
      },
    ],
    vodiy: [
      {
        id: 't3',
        app: 'vodiy',
        title: text('Zar', 'Зар'),
        image_url: '',
        text: text(
          'Har qanday maqsadga, kafil va garovsiz.',
          'На любые цели, без поручителя и залога.',
        ),
        visible: true,
      },
    ],
  },
  build(body) {
    if (!isText(body.title) || !isText(body.text)) throw invalid({ title: 'is required' })
    return {
      title: body.title,
      text: body.text,
      image_url: String(body.image_url ?? ''),
      visible: body.visible !== false,
    }
  },
  section: () => 'mlOnboarding',
  actions: () => ({ created: 'tileCreated', saved: 'tileSaved', deleted: 'tileDeleted' }),
  target: (item) => item.title.uz,
  entity: 'tile',
  hasOrder: true,
})

// Contacts of the brand
type Contacts = {
  app: string
  phones: string[]
  email: string
  website: string
  telegram: string
  instagram: string
  address: Text
  hours: Text
}
const contacts: Record<string, Contacts> = {
  fortuna: {
    app: 'fortuna',
    phones: ['732444000', '558084000'],
    email: 'info@fortunabiznes.uz',
    website: 'fortunabiznes.uz',
    telegram: 'fortunabiznes_mmt',
    instagram: 'fortunabiznes.mko',
    address: text(
      'Fargʻona viloyati, Fargʻona shahri, B. Margʻinoniy koʻchasi, 12-uy',
      'Ферганская область, г. Фергана, ул. Б. Маргиноний, 12',
    ),
    hours: text('Dushanba–shanba, 9:00–18:00', 'Пн–сб, 9:00–18:00'),
  },
  vodiy: {
    app: 'vodiy',
    phones: ['735291434'],
    email: 'vodiymko@mail.ru',
    website: 'vodiytaraqqiyot.uz',
    telegram: '',
    instagram: '',
    address: text(
      'Fargʻona viloyati, Buvayda tumani, Yangiqoʻrgʻon MFY, Yangiqoʻrgʻon koʻchasi, 2-uy',
      'Ферганская область, Бувайдинский район, МСГ Янгикурган, ул. Янгикурган, 2',
    ),
    hours: text('Dushanba–juma, 9:00–18:00', 'Пн–пт, 9:00–18:00'),
  },
}

const stripAt = (value: unknown) => String(value ?? '').replace(/^@/, '')

mockRoutes(
  {
    method: 'GET',
    match: '/admin/apps/:app/contacts',
    handle({ params }) {
      // Birzum's contacts are the FAQ page's; faq.ts answers that path first
      return contacts[brandOf(params.app)]
    },
  },
  {
    method: 'PUT',
    match: '/admin/apps/:app/contacts',
    handle({ params, body }) {
      const current = contacts[brandOf(params.app)]
      const input = asBody(body)
      const phones = (input.phones ?? []) as string[]
      const website = String(input.website ?? '').replace(/^https?:\/\//, '')
      const email = String(input.email ?? '')
      if (phones.length < 1 || phones.length > 2 || phones.some((p) => !/^\d{9}$/.test(p)))
        throw invalid()
      if (!/^\S+@\S+\.\S+$/.test(email)) throw invalid()
      if (!/^[\w.-]+\.[a-z]{2,}$/i.test(website)) throw invalid()
      if (!isText(input.address) || !isText(input.hours)) throw invalid()
      Object.assign(current, {
        phones,
        email,
        website,
        telegram: stripAt(input.telegram),
        instagram: stripAt(input.instagram),
        address: input.address,
        hours: input.hours,
      })
      logBrand('mlContacts', 'loanContactsSaved', params.app, 'Kontaktlar', 'contacts')
      return current
    },
  },
)

// Branches
type Branch = {
  id: string
  app: string
  region: string
  address: string
  phone: string
  location: { lat: number; lng: number } | null
  schedule: { weekday: number; open: string; close: string }[]
}

const REGIONS = [
  'tashkentCity',
  'tashkent',
  'andijan',
  'fergana',
  'namangan',
  'samarkand',
  'bukhara',
  'jizzakh',
  'kashkadarya',
  'navoi',
  'surkhandarya',
  'syrdarya',
  'khorezm',
  'karakalpakstan',
]

const branches = (app: string, rows: [string, string, string][]): Branch[] =>
  rows.map(([region, address, phone], i) => ({
    id: `${app}-br${i + 1}`,
    app,
    region,
    address,
    phone,
    location: null,
    schedule: [],
  }))

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

appList<Branch>({
  resource: 'branches',
  apps: BRANDS,
  seeds: {
    fortuna: branches('fortuna', [
      ['fergana', 'Margʻilon sh., B. Margʻiloniy koʻchasi, 97-b', '732534000'],
      ['fergana', 'Rishton t., B. Roshidoniy koʻchasi, 195 A', '558014111'],
      ['samarkand', 'Samarqand sh., Narpay koʻchasi, 77-uy', '557024000'],
      ['bukhara', 'Buxoro sh., I. Karimov shoh koʻchasi, 328-uy', '553034000'],
      ['andijan', 'Andijon sh., A. Temur shoh koʻchasi, 44-B', '782980040'],
    ]),
    vodiy: branches('vodiy', [
      ['fergana', 'Buvayda t., Yangiqoʻrgʻon koʻchasi, 2-uy', '735291434'],
      ['fergana', 'Bagʻdod t., Orzu koʻchasi, 11-uy', '558081010'],
      ['andijan', 'Andijon t., Oltin vodiy koʻchasi, 18-uy', '950061155'],
      ['namangan', 'Chust t., Birlik MFY, Chustiy koʻchasi', '953024040'],
      ['tashkent', 'Nurafshon sh., Toshkent yoʻli koʻchasi, 178-uy', '559002200'],
    ]),
  },
  build(body) {
    const address = String(body.address ?? '').trim()
    const phone = String(body.phone ?? '')
    if (!REGIONS.includes(body.region)) throw invalid({ region: 'is invalid' })
    if (address.length < 5 || address.length > 300) throw invalid({ address: 'is invalid' })
    if (phone && !/^\d{9}$/.test(phone)) throw invalid({ phone: 'is invalid' })
    const location = body.location as Branch['location']
    if (
      location &&
      !(location.lat >= 37 && location.lat <= 46 && location.lng >= 55 && location.lng <= 74)
    ) {
      throw mockError(400, 'branch_location_invalid', 'The point is outside Uzbekistan')
    }
    const schedule = ((body.schedule ?? []) as Branch['schedule'])
      .slice()
      .sort((a, b) => a.weekday - b.weekday)
    const bad = schedule.some(
      (d, i) =>
        !(d.weekday >= 1 && d.weekday <= 7) ||
        (i > 0 && schedule[i - 1].weekday === d.weekday) ||
        !TIME.test(d.open) ||
        !TIME.test(d.close) ||
        d.open >= d.close,
    )
    if (bad) throw mockError(400, 'branch_schedule_invalid', 'The schedule is invalid')
    return { region: body.region, address, phone, location: location ?? null, schedule }
  },
  section: () => 'mlContacts',
  actions: () => ({
    created: 'loanBranchAdded',
    saved: 'loanBranchSaved',
    deleted: 'loanBranchDeleted',
  }),
  target: (item) => item.address,
  entity: 'branch',
})

// Pay day rule
type Rule = { from: number; to: number; up_to: number | 'appDay' }
type PayDay = {
  mode: 'fixed' | 'byDay'
  fixed_days: number[]
  rules: Rule[]
  after: number
  updated_at: string
  updated_by: { id: string; name: string } | null
}
type Revision = {
  id: string
  at: string
  by: { id: string; name: string }
  changes: { field: string; from: unknown; to: unknown }[]
}

const defaultPayDay = (): PayDay => ({
  mode: 'byDay',
  fixed_days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  rules: [
    { from: 1, to: 5, up_to: 5 },
    { from: 6, to: 10, up_to: 10 },
    { from: 11, to: 20, up_to: 'appDay' },
  ],
  after: 20,
  updated_at: ago(20),
  updated_by: null,
})
const payDays: Record<string, PayDay> = { fortuna: defaultPayDay(), vodiy: defaultPayDay() }
const history: Record<string, Revision[]> = {
  fortuna: [
    {
      id: 'rev1',
      at: ago(12),
      by: { id: 'a1', name: 'Sardor Saidov' },
      changes: [{ field: 'after', from: 15, to: 20 }],
    },
  ],
  vodiy: [],
}

const inDay = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 28
const badRule = (field: string) =>
  Object.assign(mockError(400, 'pay_day_rules_invalid', 'Invalid pay day rule'), {
    details: { field },
  })

function readPayDay(body: Record<string, any>) {
  const mode = body.mode
  if (mode !== 'fixed' && mode !== 'byDay') throw badRule('mode')
  const fixed = [...new Set((body.fixed_days ?? []) as number[])].sort((a, b) => a - b)
  if (fixed.some((d) => !inDay(d)) || (mode === 'fixed' && fixed.length === 0)) {
    throw badRule('fixed_days')
  }
  const rules = (body.rules ?? []) as Rule[]
  if (mode === 'byDay' && rules.length === 0) throw badRule('rules')
  if (!inDay(body.after)) throw badRule('after')
  rules.forEach((rule, i) => {
    const previous = rules[i - 1]?.to ?? 0
    if (!inDay(rule.from) || rule.from <= previous) throw badRule(`rules[${i}].from`)
    if (rule.to < rule.from || rule.to > body.after) throw badRule(`rules[${i}].to`)
    if (rule.up_to !== 'appDay' && !inDay(rule.up_to)) throw badRule(`rules[${i}].up_to`)
  })
  return { mode, fixed_days: fixed, rules, after: body.after as number }
}

mockRoutes(
  {
    method: 'GET',
    match: '/admin/apps/:app/pay-day',
    handle: ({ params }) => payDays[brandOf(params.app)],
  },
  {
    method: 'GET',
    match: '/admin/apps/:app/pay-day/history',
    handle: ({ params }) => ({ items: history[brandOf(params.app)] }),
  },
  {
    method: 'PUT',
    match: '/admin/apps/:app/pay-day',
    handle({ params, body }) {
      const current = payDays[brandOf(params.app)]
      const next = readPayDay(asBody(body))
      const changes = (['mode', 'fixed_days', 'rules', 'after'] as const)
        .filter((field) => JSON.stringify(current[field]) !== JSON.stringify(next[field]))
        .map((field) => ({ field, from: current[field], to: next[field] }))
      if (changes.length === 0) return current
      Object.assign(current, next, {
        updated_at: nowIso(),
        updated_by: { id: 'demo', name: 'Namuna admin' },
      })
      history[params.app].unshift({
        id: crypto.randomUUID(),
        at: current.updated_at,
        by: { id: 'demo', name: 'Namuna admin' },
        changes,
      })
      logBrand('mlPayDay', 'payDaySaved', params.app, 'Toʻlov kuni', 'pay_day_rules')
      return current
    },
  },
)
