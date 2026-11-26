import { Link } from 'react-router-dom'
import { applicationStatusTone } from '@/entities/applications/applicationStatus'
import { applicationsStore } from '@/entities/applications/applications'
import { productStatusTone } from '@/entities/catalog/productStatus'
import { priceOf, productsStore, statusOf } from '@/entities/catalog/products'
import { reviewsStore } from '@/entities/reviews/reviews'
import { applicationPath, productPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { usePagination } from '@/shared/lib/usePagination'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Pagination } from '@/shared/ui/Pagination'
import { Stars } from '@/shared/ui/Stars'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const td = 'px-4 py-3 text-sm'
const row = 'border-b border-line last:border-b-0 hover:bg-surface/60'

/** The merchant's products, best sellers first; each opens its product page. */
export function MerchantProducts({ merchantId }: { merchantId: string }) {
  const { t, tl } = useI18n()
  const products = productsStore
    .useAll()
    .filter((product) => product.merchantId === merchantId)
    .sort((a, b) => b.sold - a.sold)
  const pager = usePagination(products, merchantId)
  if (products.length === 0) return <EmptyState title={t('products.empty')} />
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-t border-line">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>{t('products.col.product')}</th>
              <th className={th}>{t('products.col.price')}</th>
              <th className={th}>{t('product.sold')}</th>
              <th className={th}>{t('merchants.status')}</th>
            </tr>
          </thead>
          <tbody>
            {pager.rows.map((product) => {
              const status = statusOf(product)
              return (
                <tr key={product.id} className={row}>
                  <td className={td}>
                    <Link
                      to={productPath(product.id)}
                      className="font-semibold hover:text-brand hover:underline"
                    >
                      {tl(product.name)}
                    </Link>
                  </td>
                  <td className={`${td} tabular-nums`}>{formatSum(priceOf(product))}</td>
                  <td className={`${td} tabular-nums`}>{groupDigits(product.sold)}</td>
                  <td className={td}>
                    <StatusBadge tone={productStatusTone[status]}>
                      {t(`product.status.${status}`)}
                    </StatusBadge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination pager={pager} />
    </>
  )
}

/** The merchant's arizalar, newest first; each opens its ariza page. */
export function MerchantApplications({ merchantId }: { merchantId: string }) {
  const { t } = useI18n()
  const applications = applicationsStore
    .useAll()
    .filter((application) => application.merchantId === merchantId)
  const pager = usePagination(applications, merchantId)
  if (applications.length === 0) return <EmptyState title={t('applications.empty')} />
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-t border-line">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>№</th>
              <th className={th}>{t('applications.col.client')}</th>
              <th className={th}>{t('products.col.price')}</th>
              <th className={th}>{t('merchants.status')}</th>
            </tr>
          </thead>
          <tbody>
            {pager.rows.map((application) => (
              <tr key={application.id} className={row}>
                <td className={td}>
                  <Link
                    to={applicationPath(application.id)}
                    className="flex flex-col hover:text-brand"
                  >
                    <span className="font-semibold tabular-nums hover:underline">
                      {groupDigits(application.number)}
                    </span>
                    <span className="text-xs text-ink-muted tabular-nums">
                      {formatDate(application.createdAt)}
                    </span>
                  </Link>
                </td>
                <td className={td}>{application.client.name}</td>
                <td className={`${td} tabular-nums`}>{formatSum(application.goodsTotal)}</td>
                <td className={td}>
                  <StatusBadge tone={applicationStatusTone[application.status]}>
                    {t(`application.status.${application.status}`)}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pager={pager} />
    </>
  )
}

/** The merchant's published reviews, newest first, with its answers. Moderation is on Sharhlar. */
export function MerchantReviews({ merchantId }: { merchantId: string }) {
  const { t } = useI18n()
  const reviews = reviewsStore
    .useAll()
    .filter((review) => review.merchantId === merchantId && review.status === 'published')
    .sort((a, b) => b.at.getTime() - a.at.getTime())
  const pager = usePagination(reviews, merchantId)
  if (reviews.length === 0) return <EmptyState title={t('product.reviews.none')} />
  return (
    <>
      <ul className="flex flex-col border-t border-line">
        {pager.rows.map((review) => (
          <li key={review.id} className="flex flex-col gap-1.5 border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars rating={review.rating} size={14} label={String(review.rating)} />
              <span className="font-semibold">{review.author}</span>
              <span className="ml-auto text-sm text-ink-subtle">{formatDate(review.at)}</span>
            </div>
            {review.productId ? (
              <Link
                to={productPath(review.productId)}
                className="self-start text-sm text-brand hover:underline"
              >
                {review.productName}
              </Link>
            ) : (
              <span className="text-sm text-ink-muted">{review.productName}</span>
            )}
            <p className="text-sm">{review.text}</p>
            {review.reply && (
              <p className="rounded-card bg-surface p-3 text-sm">{review.reply.text}</p>
            )}
          </li>
        ))}
      </ul>
      <Pagination pager={pager} />
    </>
  )
}
