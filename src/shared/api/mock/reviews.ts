import { logMock } from './audit'
import { mockRoutes } from './index'
import { MERCHANTS } from './merchants'
import { ACTOR, ago, asBody, invalid, matches, notFound, nowIso, paged } from './util'

type Status = 'published' | 'hidden' | 'removed'

type Review = {
  id: string
  merchant_id: string
  merchant_name: string
  author: string
  rating: number
  text: string
  product_name: string
  created_at: string
  status: Status
  moderation: { at: string; by: string; reason: string; comment: string } | null
}

const TEXTS: Record<number, string[]> = {
  5: [
    'Telefonni oʻsha kuniyoq oldim, sotuvchi hammasini tushuntirib berdi.',
    'Rasmiylashtirish 15 daqiqa davom etdi, juda qulay.',
    'Kir yuvish mashinasini ertasi kuni yetkazib berishdi. Rahmat!',
    'Narxi boshqa doʻkonlardan arzon chiqdi, nasiya ham qulay.',
    'Всё быстро оформили, телефон оригинал. Спасибо!',
  ],
  4: [
    'Mahsulot yaxshi, lekin rasmiylashtirish biroz choʻzildi.',
    'Noutbuk zoʻr, faqat sumkasi berilmadi.',
    'Хороший магазин, но пришлось подождать в очереди.',
  ],
  3: [
    'Mahsulot yaxshi, ammo kerakli rang omborda yoʻq edi.',
    'Sotuvchi shartlarni toʻliq tushuntirmadi, ilovadan bilib oldim.',
  ],
  2: [
    'Yetkazib berishni ikki kun kutdim, hech kim qoʻngʻiroq qilmadi.',
    'Quti ochilgan holda keldi, almashtirishni uzoq kutdim.',
  ],
  1: ['Telefonda nuqson bor edi, doʻkon almashtirishdan bosh tortdi.'],
}
const AUTHORS = [
  'Zarina Karimova',
  'Bekzod Aliyev',
  'Dilnoza Rahimova',
  'Otabek Nurmatov',
  'Madina Yusupova',
  'Javlon Ergashev',
  'Sevara Qodirova',
]
const PRODUCTS = [
  'Samsung Galaxy A55',
  'iPhone 15',
  'Artel 55" televizor',
  'LG kir yuvish mashinasi',
  'Lenovo IdeaPad 3',
  'Xiaomi Redmi Note 13',
]
const RATINGS = [5, 5, 4, 5, 3, 5, 4, 2, 5, 5, 1, 4, 5, 3, 5, 5, 2, 4, 5, 5]

const reviews: Review[] = Array.from({ length: 40 }, (_, i) => {
  const rating = RATINGS[i % RATINGS.length]
  const texts = TEXTS[rating]
  const merchant = MERCHANTS[i % MERCHANTS.length]
  return {
    id: `r${i + 1}`,
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    author: AUTHORS[i % AUTHORS.length],
    rating,
    text: texts[i % texts.length],
    product_name: PRODUCTS[i % PRODUCTS.length],
    created_at: ago(Math.floor(i * 0.7), i % 9),
    status: 'published' as Status,
    moderation: null,
  }
})
// A few already moderated, so the hidden and removed tabs have something to show
Object.assign(reviews[3], {
  rating: 1,
  text: 'Sotuvchilar umuman ishlashni bilmaydi, ****lar! Pulingizni bermang.',
  status: 'hidden',
  moderation: { at: ago(2), by: 'a2', reason: 'abuse', comment: 'Soʻkinish bor.' },
})
Object.assign(reviews[11], {
  rating: 1,
  text: 'Arzon iPhone kerakmi? Telegram: @arzon_telefon_uz ga yozing!',
  status: 'hidden',
  moderation: {
    at: ago(5),
    by: 'a2',
    reason: 'spam',
    comment: 'Boshqa savdo kanalining reklamasi.',
  },
})
Object.assign(reviews[7], {
  status: 'removed',
  moderation: { at: ago(4), by: 'merchant', reason: '', comment: '' },
})
Object.assign(reviews[16], {
  status: 'removed',
  moderation: { at: ago(9), by: 'merchant', reason: '', comment: '' },
})

const find = (id: string) => {
  const found = reviews.find((r) => r.id === id)
  if (!found) throw notFound()
  return found
}

const logReview = (action: string, kind: 'update' | 'delete', item: Review) =>
  logMock({
    section: 'reviews',
    kind,
    action,
    target: `${item.author} · ${item.merchant_name}`,
    entity: 'review',
    entityId: item.id,
  })

mockRoutes(
  {
    method: 'GET',
    match: '/admin/reviews',
    handle({ query }) {
      const from = query.from ? Date.parse(query.from) : -Infinity
      const to = query.to ? Date.parse(query.to) : Infinity
      // Everything but the status narrows the figures too
      const scope = reviews.filter((r) => {
        const at = Date.parse(r.created_at)
        return (
          at >= from &&
          at < to &&
          (!query.merchant_id || r.merchant_id === query.merchant_id) &&
          (!query.rating || r.rating === Number(query.rating)) &&
          matches(query.q, r.author, r.product_name, r.text)
        )
      })
      const published = scope.filter((r) => r.status === 'published')
      const count = (status: Status) => scope.filter((r) => r.status === status).length
      const wanted =
        !query.status || query.status === 'all'
          ? scope
          : query.status === 'negative'
            ? published.filter((r) => r.rating <= 2)
            : scope.filter((r) => r.status === query.status)
      const average = (rows: Review[]) =>
        rows.length
          ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 100) / 100
          : 0
      const sorted = [...wanted].sort((a, b) => b.created_at.localeCompare(a.created_at))
      return {
        ...paged(sorted, query),
        counts: {
          all: scope.length,
          published: published.length,
          negative: published.filter((r) => r.rating <= 2).length,
          hidden: count('hidden'),
          removed: count('removed'),
        },
        average: average(published),
        distribution: [5, 4, 3, 2, 1].map((n) => published.filter((r) => r.rating === n).length),
        merchants: MERCHANTS.map((m) => {
          const own = scope.filter((r) => r.merchant_id === m.id)
          const shown = own.filter((r) => r.status === 'published')
          return {
            merchant_id: m.id,
            merchant_name: m.name,
            published: shown.length,
            average: average(shown),
            negative: shown.filter((r) => r.rating <= 2).length,
            removed: own.filter((r) => r.status === 'removed').length,
          }
        }).filter((m) => m.published + m.removed > 0),
      }
    },
  },
  {
    method: 'PUT',
    match: '/admin/reviews/:id/hide',
    handle({ params, body }) {
      const item = find(params.id)
      const input = asBody(body)
      if (!['abuse', 'spam', 'personal', 'offTopic', 'other'].includes(input.reason)) {
        throw invalid({ reason: 'is invalid' })
      }
      item.status = 'hidden'
      item.moderation = {
        at: nowIso(),
        by: ACTOR.id,
        reason: input.reason,
        comment: String(input.comment ?? ''),
      }
      logReview('reviewHidden', 'update', item)
      return item
    },
  },
  {
    method: 'PUT',
    match: '/admin/reviews/:id/restore',
    handle({ params }) {
      const item = find(params.id)
      item.status = 'published'
      item.moderation = null
      logReview('reviewRestored', 'update', item)
      return item
    },
  },
  {
    method: 'DELETE',
    match: '/admin/reviews/:id',
    handle({ params }) {
      const item = find(params.id)
      reviews.splice(reviews.indexOf(item), 1)
      logReview('reviewDeleted', 'delete', item)
      return {}
    },
  },
)
