import { Eye, EyeOff, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Review } from '@/entities/reviews/reviews'
import { loadReviews } from '@/entities/reviews/reviewsApi'
import { useResource } from '@/shared/api/useResource'
import { useServerPager } from '@/shared/api/useServerPager'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatDateTime, groupDigits } from '@/shared/lib/format'
import { thisMonth, type Period } from '@/shared/lib/period'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { Stars } from '@/shared/ui/Stars'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import {
  DeleteReviewDialog,
  HideReviewModal,
  RestoreReviewDialog,
} from '../components/ReviewDialogs'

type Tab = 'all' | 'negative' | 'hidden' | 'removed'
const card = 'flex min-w-0 flex-col gap-5 rounded-card border border-line bg-canvas p-5'
const score = (n: number) => n.toFixed(1).replace('.', ',')

/**
 * Every review shoppers left on shops, for the period: figures, how the stars spread, each
 * merchant's rating, then the reviews as cards. The admin hides one that breaks the rules,
 * brings back one a merchant deleted, or deletes one for good.
 */
export function ReviewsPage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [merchant, setMerchant] = useState('')
  const [stars, setStars] = useState('')
  const [hiding, setHiding] = useState<Review | null>(null)
  const [restoring, setRestoring] = useState<Review | null>(null)
  const [deleting, setDeleting] = useState<Review | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(id)
  }, [query])

  // Everything is counted by the server; the tab only picks the rows. The figures follow the
  // period, search, shop and stars, not the tab
  const filters = JSON.stringify([tab, search, merchant, stars, period])
  const { page, limit, pager: pagerOf } = useServerPager(filters)
  const { data, loading, reload } = useResource(
    () =>
      loadReviews({
        period,
        status: tab,
        q: search,
        merchantId: merchant,
        rating: stars,
        page,
        limit,
      }),
    JSON.stringify([filters, page, limit]),
  )
  const rows = data?.items ?? []
  const pager = pagerOf(data?.total ?? 0)
  const counts = data?.counts ?? { all: 0, published: 0, negative: 0, hidden: 0, removed: 0 }
  const count = counts.published
  const average = data?.average ?? 0
  const negativeCount = counts.negative
  const moderatedCount = counts.hidden + counts.removed
  const spread = [5, 4, 3, 2, 1].map((n, i) => ({ n, count: data?.distribution[i] ?? 0 }))
  const byMerchant = data?.merchants ?? []

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.reviews')} />
      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('reviews.stat.count')}
          value={groupDigits(counts.all)}
          hint={t('reviews.stat.countHint', { count: groupDigits(count) })}
        />
        <StatCard
          label={t('reviews.stat.average')}
          value={count ? score(average) : '—'}
          hint={t('reviews.stat.averageHint')}
        />
        <StatCard
          label={t('reviews.tab.negative')}
          value={groupDigits(negativeCount)}
          hint={
            count
              ? t('reviews.stat.share', {
                  share: String(Math.round((negativeCount / count) * 100)),
                })
              : undefined
          }
        />
        <StatCard
          label={t('reviews.stat.moderated')}
          value={groupDigits(moderatedCount)}
          hint={t('reviews.stat.moderatedHint', {
            hidden: String(counts.hidden),
            removed: String(counts.removed),
          })}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className={card}>
          <h2 className="text-lg font-bold">{t('reviews.spread.title')}</h2>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold [font-variant-numeric:normal]">
              {count ? score(average) : '—'}
            </span>
            <div className="flex flex-col gap-1">
              <Stars rating={average} size={20} label={score(average)} />
              <span className="text-sm text-ink-muted">
                {t('reviews.stat.countHint', { count: groupDigits(count) })}
              </span>
            </div>
          </div>
          <ul className="-mx-2 flex flex-col">
            {spread.map((row) => (
              <li key={row.n}>
                <button
                  type="button"
                  disabled={row.count === 0}
                  onClick={() => setStars(stars === String(row.n) ? '' : String(row.n))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-control px-2 py-1.5 text-sm hover:bg-surface disabled:hover:bg-transparent',
                    stars === String(row.n) && 'bg-surface',
                  )}
                >
                  <span className="flex w-8 items-center gap-1 font-semibold tabular-nums">
                    {row.n}
                    <span className="text-warning">★</span>
                  </span>
                  <span className="h-2 flex-1 rounded-full bg-surface">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        row.n <= 2 ? 'bg-danger' : 'bg-warning',
                      )}
                      style={{ width: `${count ? (row.count / count) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-ink-muted tabular-nums">{row.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-lg font-bold">{t('reviews.merchants.title')}</h2>
          {byMerchant.length === 0 ? (
            <p className="text-sm text-ink-subtle">{t('reviews.empty')}</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {byMerchant.map((row) => (
                <li key={row.merchantId}>
                  <button
                    type="button"
                    onClick={() => setMerchant(merchant === row.merchantId ? '' : row.merchantId)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-control p-2 text-left hover:bg-surface',
                      merchant === row.merchantId && 'bg-surface',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{row.merchantName}</span>
                      <span className="truncate text-xs text-ink-muted">
                        {t('reviews.stat.countHint', { count: String(row.published) })}
                        {row.negative > 0 &&
                          ` · ${t('reviews.merchants.negative', { count: String(row.negative) })}`}
                      </span>
                    </span>
                    {row.removed > 0 && (
                      <StatusBadge tone="warning">
                        {t('reviews.merchants.removed', { count: String(row.removed) })}
                      </StatusBadge>
                    )}
                    <span className="flex items-center gap-2">
                      <Stars rating={row.average} size={14} label={score(row.average)} />
                      <span className="w-7 text-right font-bold tabular-nums">
                        {row.published ? score(row.average) : '—'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('nav.reviews')}
            options={(['all', 'negative', 'hidden', 'removed'] as const).map((value) => ({
              value,
              label: t(`reviews.tab.${value}`),
              count: counts[value],
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('reviews.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('reviews.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('products.col.merchant')}
            options={[
              { value: '', label: t('products.allMerchants') },
              ...byMerchant.map((item) => ({ value: item.merchantId, label: item.merchantName })),
            ]}
            value={merchant}
            onChange={setMerchant}
          />
          <FilterSelect
            label={t('reviews.rating')}
            options={[
              { value: '', label: t('reviews.rating.all') },
              ...[5, 4, 3, 2, 1].map((n) => ({
                value: String(n),
                label: t('reviews.rating.n', { n: String(n) }),
              })),
            ]}
            value={stars}
            onChange={setStars}
          />
        </div>

        {loading && !data ? (
          <EmptyState title={t('common.loading')} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('reviews.empty')} />
        ) : (
          <>
            <ul className="flex flex-col border-t border-line">
              {rows.map((review) => {
                return (
                  <li
                    key={review.id}
                    className={cn(
                      'flex flex-col gap-2 border-b border-line p-4 last:border-b-0 lg:px-5',
                      review.status !== 'published' && 'bg-surface/50',
                    )}
                  >
                    <div className="-my-1 flex items-center gap-3">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                        <Stars
                          rating={review.rating}
                          label={t('reviews.rating.n', { n: String(review.rating) })}
                        />
                        <span className="text-sm text-ink-muted tabular-nums">
                          {formatDateTime(review.at)}
                        </span>
                        {review.status !== 'published' && (
                          <StatusBadge tone={review.status === 'hidden' ? 'danger' : 'warning'}>
                            {t(`review.status.${review.status}`)}
                          </StatusBadge>
                        )}
                      </div>
                      <RowActions
                        actions={[
                          review.status === 'published'
                            ? {
                                icon: EyeOff,
                                label: t('review.hide'),
                                onClick: () => setHiding(review),
                              }
                            : {
                                icon: review.status === 'removed' ? RotateCcw : Eye,
                                label: t('review.restore'),
                                onClick: () => setRestoring(review),
                              },
                          {
                            icon: Trash2,
                            label: t('common.delete'),
                            onClick: () => setDeleting(review),
                            danger: true,
                          },
                        ]}
                      />
                    </div>
                    <p
                      className={cn('max-w-4xl', review.status !== 'published' && 'text-ink-muted')}
                    >
                      {review.text}
                    </p>
                    {review.moderation && (
                      <p className="text-sm text-ink-muted">
                        {review.status === 'removed'
                          ? t('review.removedBy', { date: formatDate(review.moderation.at) })
                          : t('review.hiddenBy', {
                              reason: t(`review.reason.${review.moderation.reason ?? 'other'}`),
                              by: review.moderation.by.slice(0, 8),
                              date: formatDate(review.moderation.at),
                            })}
                        {review.moderation.comment && ` — ${review.moderation.comment}`}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      <span className="font-medium">{review.author}</span>
                      <span className="text-ink-muted">{review.merchantName}</span>
                      <span className="text-ink-muted">{review.productName}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Pagination pager={pager} />
          </>
        )}
      </div>

      {hiding && (
        <HideReviewModal review={hiding} onClose={() => setHiding(null)} onDone={reload} />
      )}
      {restoring && (
        <RestoreReviewDialog
          review={restoring}
          onClose={() => setRestoring(null)}
          onDone={reload}
        />
      )}
      {deleting && (
        <DeleteReviewDialog review={deleting} onClose={() => setDeleting(null)} onDone={reload} />
      )}
    </div>
  )
}
