import { ChevronRight, MessageSquareReply } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ratingOf, reviewsStore } from '@/entities/reviews/reviews'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, groupDigits } from '@/shared/lib/format'
import { Stars } from '@/shared/ui/Stars'

const score = (n: number) => n.toFixed(1).replace('.', ',')
const LATEST = 3

/**
 * The product's rating as shoppers see it in the client app (published reviews only), its
 * latest reviews with the merchant's answers, and a link to all of them on Sharhlar.
 */
export function ProductReviewsCard({ productId }: { productId: string }) {
  const { t } = useI18n()
  const reviews = reviewsStore
    .useAll()
    .filter((review) => review.productId === productId)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
  const { count, average } = ratingOf(reviews)
  const latest = reviews.filter((review) => review.status === 'published').slice(0, LATEST)

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t('nav.reviews')}</h2>
        {reviews.length > 0 && (
          <Link
            to={`${ROUTES.reviews}?product=${productId}`}
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            {t('common.all')}
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {count === 0 ? (
        <p className="text-sm text-ink-muted">{t('product.reviews.none')}</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tabular-nums">{score(average)}</span>
            <div className="flex flex-col gap-1">
              <Stars rating={average} size={18} label={score(average)} />
              <span className="text-sm text-ink-muted">
                {t('product.reviews.count', { count: groupDigits(count) })}
              </span>
            </div>
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {latest.map((review) => (
              <li key={review.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{review.author}</span>
                  <span className="text-sm text-ink-subtle">{formatDate(review.at)}</span>
                </div>
                <Stars rating={review.rating} size={14} label={String(review.rating)} />
                <p className="text-sm">{review.text}</p>
                {review.reply && (
                  <p className="flex gap-2 rounded-card bg-surface p-3 text-sm">
                    <MessageSquareReply size={16} className="mt-0.5 shrink-0 text-brand" />
                    {review.reply.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
