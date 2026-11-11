import { appList } from './appList'
import { mockError } from './index'
import { invalid, isText, text, todayTashkent, type Text } from './util'

type Image = { uz: string; ru: string }

/** An uploaded picture per language; both or (on a built-in row) neither. */
function readImage(body: Record<string, any>, builtIn: boolean): Image {
  const image: Image = { uz: String(body.image?.uz ?? ''), ru: String(body.image?.ru ?? '') }
  const empty = !image.uz && !image.ru
  if ((!builtIn && empty) || (!empty && (!image.uz || !image.ru))) {
    throw mockError(400, 'image_required', 'A picture is required in both languages')
  }
  return image
}

type Slide = {
  id: string
  app: string
  image: Image
  built_in: boolean
  title: Text
  visible: boolean
}

const slide = (id: string, app: string, title: Text): Slide => ({
  id,
  app,
  image: { uz: '', ru: '' },
  built_in: true,
  title,
  visible: true,
})

const LOAN_SLIDES = [
  text('Summa va muddatni tanlang', 'Выберите сумму и срок'),
  text('Qaror onlayn', 'Решение онлайн'),
  text('Pul kartangizga', 'Деньги на карту'),
  text('Toʻlovlar nazoratda', 'Платежи под контролем'),
]

appList<Slide>({
  resource: 'slides',
  apps: ['birzum', 'fortuna', 'vodiy'],
  seeds: {
    birzum: [
      slide('b1', 'birzum', text('Limitingizni biling', 'Узнайте свой лимит')),
      slide(
        'b2',
        'birzum',
        text('Doʻkonlardan nasiyaga xarid qiling', 'Покупайте в рассрочку в магазинах'),
      ),
      slide('b3', 'birzum', text('Toʻlovlarni ilovada qiling', 'Платите прямо в приложении')),
    ],
    fortuna: LOAN_SLIDES.map((title, i) => slide(`f${i + 1}`, 'fortuna', title)),
    vodiy: LOAN_SLIDES.map((title, i) => slide(`v${i + 1}`, 'vodiy', title)),
  },
  build(body, _app, current) {
    if (!isText(body.title)) throw invalid({ title: 'is required in both languages' })
    return {
      image: readImage(body, !!current?.built_in),
      built_in: current?.built_in ?? false,
      title: body.title,
      visible: body.visible !== false,
    }
  },
  section: (app) => (app === 'birzum' ? 'onboarding' : 'mlOnboarding'),
  actions: () => ({
    created: 'slideCreated',
    saved: 'slideSaved',
    deleted: 'slideDeleted',
    hidden: 'slideHidden',
    shown: 'slideShown',
  }),
  target: (item) => item.title.uz,
  entity: 'slide',
  hasVisible: true,
  hasOrder: true,
})

type Banner = {
  id: string
  app: string
  title: Text
  image: Image
  built_in: boolean
  target: string
  ids: string[]
  visible: boolean
  starts_on: string
  ends_on: string
}

const banner = (
  id: string,
  app: string,
  title: Text,
  target: string,
  ids: string[] = [],
): Banner => ({
  id,
  app,
  title,
  image: { uz: '', ru: '' },
  built_in: true,
  target,
  ids,
  visible: true,
  starts_on: '',
  ends_on: '',
})

const stateOf = (item: Banner) => {
  const today = todayTashkent()
  if (!item.visible) return 'hidden'
  if (item.starts_on && today < item.starts_on) return 'scheduled'
  if (item.ends_on && today > item.ends_on) return 'ended'
  return 'live'
}

const isDay = (value: string) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)

appList<Banner>({
  resource: 'banners',
  apps: ['birzum', 'fortuna', 'vodiy'],
  seeds: {
    birzum: [
      banner(
        'bb1',
        'birzum',
        text('Sizga eng yaqin doʻkondan xarid qiling', 'Покупайте в ближайшем к вам магазине'),
        'nearest',
      ),
      banner(
        'bb2',
        'birzum',
        text(
          'Xaridni amalga oshiring va toʻlovni boʻlib toʻlang',
          'Совершите покупку и платите частями',
        ),
        'products',
      ),
      banner(
        'bb3',
        'birzum',
        text('Telefon va noutbuklar nasiyaga', 'Телефоны и ноутбуки в рассрочку'),
        'categories',
        ['phones', 'laptops'],
      ),
      banner(
        'bb4',
        'birzum',
        text(
          'Mediapark va iSpace doʻkonlaridan xarid qiling',
          'Покупайте в магазинах Mediapark и iSpace',
        ),
        'merchants',
      ),
    ],
    fortuna: [
      banner(
        'fb1',
        'fortuna',
        text(
          'Rivoj: tadbirkorlar uchun 50 mln soʻmgacha',
          'Ривож: для предпринимателей до 50 млн сум',
        ),
        'loanProducts',
      ),
      banner(
        'fb2',
        'fortuna',
        text(
          'Tezkor: rasmiy daromadi borlar uchun, garovsiz',
          'Тезкор: при официальном доходе, без залога',
        ),
        'loanProducts',
      ),
    ],
    vodiy: [
      banner(
        'vb1',
        'vodiy',
        text('Zar: 100 mln soʻmgacha mikroqarz', 'Зар: микрозайм до 100 млн сум'),
        'loanProducts',
      ),
      banner('vb2', 'vodiy', text('Koʻmak mikroqarzi', 'Микрозайм Кўмак'), 'loanProducts'),
    ],
  },
  decorate: (item) => ({ state: stateOf(item) }),
  build(body, app, current) {
    if (!isText(body.title)) throw invalid({ title: 'is required in both languages' })
    const targets =
      app === 'birzum' ? ['products', 'categories', 'merchants', 'nearest'] : ['loanProducts']
    const target = String(body.target)
    if (!targets.includes(target)) {
      throw mockError(400, 'banner_target_invalid', 'This app cannot use that target')
    }
    const ids = target === 'nearest' ? [] : [...new Set((body.ids ?? []) as string[])]
    if (target !== 'nearest' && ids.length === 0) {
      throw mockError(400, 'banner_ids_required', 'Pick at least one')
    }
    const starts = String(body.starts_on ?? '')
    const ends = String(body.ends_on ?? '')
    if (!isDay(starts)) throw invalid({ starts_on: 'must be a date as YYYY-MM-DD' })
    if (!isDay(ends)) throw invalid({ ends_on: 'must be a date as YYYY-MM-DD' })
    if (starts && ends && ends < starts) {
      throw mockError(400, 'banner_dates_order', 'The end is before the start')
    }
    return {
      title: body.title,
      image: readImage(body, !!current?.built_in),
      built_in: current?.built_in ?? false,
      target,
      ids,
      visible: body.visible !== false,
      starts_on: starts,
      ends_on: ends,
    }
  },
  section: (app) => (app === 'birzum' ? 'onboarding' : 'mlOnboarding'),
  actions: () => ({
    created: 'bannerCreated',
    saved: 'bannerSaved',
    deleted: 'bannerDeleted',
    hidden: 'bannerHidden',
    shown: 'bannerShown',
  }),
  target: (item) => item.title.uz,
  entity: 'banner',
  hasVisible: true,
  hasOrder: true,
})
