import { createStore } from '@/shared/lib/createStore'
import { applicationsStore, handedAtOf } from '../applications/applications'
import { clientsStore, fullName } from '../clients/clients'

export const HIDE_REASONS = ['abuse', 'spam', 'personal', 'offTopic', 'other'] as const
export type HideReason = (typeof HIDE_REASONS)[number]

/**
 * `published`: on the shop and counted in its rating. `hidden`: an admin took it down, with a
 * reason. `removed`: the merchant deleted it in the merchant app; the admin still sees it and
 * can bring it back.
 */
export type ReviewStatus = 'published' | 'hidden' | 'removed'
export const REVIEW_STATUSES: ReviewStatus[] = ['published', 'hidden', 'removed']

/** What a shopper said about a shop after a purchase, from the client app. */
export type Review = {
  id: string
  applicationId: string
  merchantId: string
  clientId: string
  author: string
  /** 1 to 5. */
  rating: number
  text: string
  productName: string
  at: Date
  status: ReviewStatus
  /** Who changed the status, when and why. */
  moderation?: { at: Date; by: string; reason?: HideReason; comment?: string }
}

/** Only published reviews count in a rating. */
export function ratingOf(reviews: Review[]) {
  const shown = reviews.filter((review) => review.status === 'published')
  return {
    count: shown.length,
    average: shown.length ? shown.reduce((sum, r) => sum + r.rating, 0) / shown.length : 0,
  }
}

const TEXTS: Record<number, string[]> = {
  5: [
    'Telefonni oʻsha kuniyoq oldim, sotuvchi hammasini tushuntirib berdi.',
    'Rasmiylashtirish 15 daqiqa davom etdi, juda qulay.',
    'Kir yuvish mashinasini ertasi kuni yetkazib berishdi. Rahmat!',
    'Narxi boshqa doʻkonlardan arzon chiqdi, nasiya ham qulay.',
    'Sotuvchi juda xushmuomala, yana shu yerdan olaman.',
    'Всё быстро оформили, телефон оригинал. Спасибо!',
  ],
  4: [
    'Mahsulot yaxshi, lekin rasmiylashtirish biroz choʻzildi.',
    'Noutbuk zoʻr, faqat sumkasi berilmadi.',
    'Yetkazib berish bir kun kechikdi, ammo hammasi joyida.',
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
  1: [
    'Telefonda nuqson bor edi, doʻkon almashtirishdan bosh tortdi.',
    'Oʻn kun kutdim, keyin buyurtmani bekor qilishdi. Endi bu yerdan olmayman.',
  ],
}
// Two that broke the rules, so the hidden tab has something to show
const ABUSE = 'Sotuvchilar umuman ishlashni bilmaydi, ****lar! Pulingizni bermang.'
const SPAM = 'Arzon iPhone kerakmi? Telegram: @arzon_telefon_uz ga yozing!'

// Invented sample reviews, one for about half of the handed-over arizalar. Replace with the API.
function seed(): Review[] {
  let state = 7
  const rand = () => (state = (state * 48271) % 2147483647) / 2147483647
  const sampledAt = new Date(2026, 9, 16, 15)
  const out: Review[] = []
  for (const application of applicationsStore.getAll()) {
    const handed = handedAtOf(application)
    if (!handed || rand() > 0.55) continue
    const at = new Date(handed.getTime() + (1 + rand() * 5) * 86_400_000)
    if (at > sampledAt) continue
    const roll = rand()
    const rating = roll < 0.55 ? 5 : roll < 0.78 ? 4 : roll < 0.88 ? 3 : roll < 0.94 ? 2 : 1
    const texts = TEXTS[rating]
    const client = clientsStore.get(application.clientId)
    out.push({
      id: `r${application.id}`,
      applicationId: application.id,
      merchantId: application.merchantId,
      clientId: application.clientId,
      author: client ? fullName(client) : application.client.name,
      rating,
      text: texts[Math.floor(rand() * texts.length)],
      productName: application.lines[0].name,
      at,
      status: 'published',
    })
  }
  out.sort((a, b) => b.at.getTime() - a.at.getTime())

  // A few already moderated: two hidden by an admin, the merchant removed two bad ones
  const hide = (review: Review | undefined, text: string, reason: HideReason, comment: string) => {
    if (!review) return
    Object.assign(review, {
      rating: 1,
      text,
      status: 'hidden',
      moderation: {
        at: new Date(review.at.getTime() + 5 * 3_600_000),
        by: 'Malika Rasulova',
        reason,
        comment,
      },
    })
  }
  hide(out[3], ABUSE, 'abuse', 'Soʻkinish bor. Klientga qoidalar haqida yozdik.')
  hide(out[11], SPAM, 'spam', 'Boshqa savdo kanalining reklamasi.')
  out
    .filter((review) => review.rating <= 2 && review.status === 'published')
    .slice(0, 2)
    .forEach((review) => {
      review.status = 'removed'
      review.moderation = { at: new Date(review.at.getTime() + 20 * 3_600_000), by: 'merchant' }
    })
  return out
}

export const reviewsStore = createStore<Review>(seed())
