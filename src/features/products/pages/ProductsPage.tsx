import { Eye, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProducts } from '@/entities/catalog/moderationApi'
import { PRODUCT_STATUSES, type ProductStatus } from '@/entities/catalog/products'
import { productStatusTone } from '@/entities/catalog/productStatus'
import { ProductThumb } from '@/entities/catalog/ui/ProductThumb'
import { useResource } from '@/shared/api/useResource'
import { useServerPager } from '@/shared/api/useServerPager'
import { productPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const COUNT_KEY = {
  review: 'review',
  selling: 'selling',
  soldOut: 'sold_out',
  hidden: 'hidden',
  rejected: 'rejected',
} as const

/**
 * Every merchant's products (`GET /admin/products`): figures on top, then a table filtered by
 * status, search, merchant, category and brand, all by the server. New ones wait in "Tekshiruvda"
 * until the admin approves them on their page. The merchant, category and brand lists are read from
 * the first 100 products, since the backend has no lists of its own for them.
 */
export function ProductsPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'all' | ProductStatus>('all')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(id)
  }, [query])

  const filters = JSON.stringify([status, search, merchant, category, brand])
  const { page, limit, pager: pagerOf } = useServerPager(filters)
  const list = useResource(
    () => loadProducts({ status, q: search, merchantId: merchant, category, brand, page, limit }),
    JSON.stringify([filters, page, limit]),
  )
  const options = useResource(() => loadProducts({ limit: 100 }), 'options')
  const rows = list.data?.items ?? []
  const counts = list.data?.counts
  const pager = pagerOf(list.data?.total ?? 0)

  const pickFrom = (
    pick: (p: {
      merchantId: string
      merchantName: string
      category: string
      brand: string
    }) => [string, string],
  ) => {
    const seen = new Map<string, string>()
    for (const product of options.data?.items ?? []) {
      const [value, label] = pick(product)
      if (value) seen.set(value, label)
    }
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]))
  }
  const merchants = pickFrom((p) => [p.merchantId, p.merchantName])
  const categories = pickFrom((p) => [p.category, p.category])
  const brands = pickFrom((p) => [p.brand, p.brand])

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.products')} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t('products.stat.total')} value={String(counts?.all ?? '—')} />
        {PRODUCT_STATUSES.map((value) => (
          <StatCard
            key={value}
            label={t(`product.status.${value}`)}
            value={String(counts?.[COUNT_KEY[value]] ?? '—')}
          />
        ))}
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: counts?.all },
              ...PRODUCT_STATUSES.map((value) => ({
                value,
                label: t(`product.status.${value}`),
                count: counts?.[COUNT_KEY[value]],
              })),
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('products.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('products.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('products.col.merchant')}
            options={[
              { value: '', label: t('products.allMerchants') },
              ...merchants.map(([value, label]) => ({ value, label })),
            ]}
            value={merchant}
            onChange={setMerchant}
          />
          <FilterSelect
            label={t('categories.col.name')}
            options={[
              { value: '', label: t('products.allCategories') },
              ...categories.map(([value, label]) => ({ value, label })),
            ]}
            value={category}
            onChange={setCategory}
          />
          <FilterSelect
            label={t('brands.col.brand')}
            options={[
              { value: '', label: t('products.allBrands') },
              ...brands.map(([value, label]) => ({ value, label })),
            ]}
            value={brand}
            onChange={setBrand}
          />
        </div>

        {list.loading && !list.data ? (
          <EmptyState title={t('common.loading')} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('products.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('products.col.product')}</th>
                  <th className={th}>{t('products.col.merchant')}</th>
                  <th className={th}>{t('categories.col.name')}</th>
                  <th className={`${th} text-right`}>{t('products.col.price')}</th>
                  <th className={`${th} text-right`}>{t('products.col.stock')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-14" />
                </tr>
              </thead>
              <tbody>
                {rows.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => navigate(productPath(product.id))}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb photo={product.photo || undefined} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">{tl(product.name)}</span>
                          <span className="truncate text-sm text-ink-muted">{product.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{product.merchantName}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">
                      {[product.category, product.subcategory].filter(Boolean).join(' › ')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                      {product.hasVariants
                        ? t('products.fromPrice', { sum: formatSum(product.priceTiyin / 100) })
                        : formatSum(product.priceTiyin / 100)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {groupDigits(product.stock)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={productStatusTone[product.status]}>
                        {t(`product.status.${product.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="pr-3">
                      <RowActions
                        actions={[
                          {
                            icon: Eye,
                            label: t('common.view'),
                            onClick: () => navigate(productPath(product.id)),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pager={pager} />
      </div>
    </div>
  )
}
