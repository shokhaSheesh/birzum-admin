import { Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { brandsStore } from '@/entities/catalog/brands'
import { categoriesStore, categoryPath, childrenOf, rootsOf } from '@/entities/catalog/categories'
import {
  PRODUCT_STATUSES,
  priceOf,
  productsStore,
  statusOf,
  stockOf,
  type ProductStatus,
} from '@/entities/catalog/products'
import { productStatusTone } from '@/entities/catalog/productStatus'
import { ProductThumb } from '@/entities/catalog/ui/ProductThumb'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { productPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Every merchant's products, read-only: figures on top, then a table filtered by status,
 * search, merchant, category and brand. Merchants create and change products in their app.
 */
export function ProductsPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const all = productsStore.useAll()
  const merchants = merchantsStore.useAll()
  const categories = categoriesStore.useAll()
  const brands = brandsStore.useAll()
  const [status, setStatus] = useState<'all' | ProductStatus>('all')
  const [query, setQuery] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')

  const needle = query.trim().toLowerCase()
  const brandName = (id: string) => brands.find((item) => item.id === id)?.name ?? ''
  // Picking a category also matches the products in its subcategories
  const inCategory = (id: string) =>
    !category || id === category || categories.find((item) => item.id === id)?.parentId === category
  const filtered = all.filter(
    (product) =>
      (needle === '' ||
        tl(product.name).toLowerCase().includes(needle) ||
        brandName(product.brandId).toLowerCase().includes(needle)) &&
      (!merchant || product.merchantId === merchant) &&
      inCategory(product.categoryId) &&
      (!brand || product.brandId === brand),
  )
  const rows = filtered.filter((product) => status === 'all' || statusOf(product) === status)
  const countOf = (value: ProductStatus) =>
    all.filter((product) => statusOf(product) === value).length

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.products')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('products.stat.total')} value={String(all.length)} />
        {PRODUCT_STATUSES.map((value) => (
          <StatCard
            key={value}
            label={t(`product.status.${value}`)}
            value={String(countOf(value))}
          />
        ))}
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...PRODUCT_STATUSES.map((value) => ({
                value,
                label: t(`product.status.${value}`),
                count: filtered.filter((product) => statusOf(product) === value).length,
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
              ...merchants.map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={merchant}
            onChange={setMerchant}
          />
          <FilterSelect
            label={t('categories.col.name')}
            options={[
              { value: '', label: t('products.allCategories') },
              ...rootsOf(categories).flatMap((root) => [
                { value: root.id, label: tl(root.name) },
                ...childrenOf(categories, root.id).map((child) => ({
                  value: child.id,
                  label: tl(child.name),
                  indent: true,
                })),
              ]),
            ]}
            value={category}
            onChange={setCategory}
          />
          <FilterSelect
            label={t('brands.col.brand')}
            options={[
              { value: '', label: t('products.allBrands') },
              ...[...brands]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={brand}
            onChange={setBrand}
          />
        </div>

        {rows.length === 0 ? (
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
                {rows.map((product) => {
                  const owner = merchants.find((item) => item.id === product.merchantId)
                  const productStatus = statusOf(product)
                  return (
                    <tr
                      key={product.id}
                      onClick={() => navigate(productPath(product.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb photo={product.photos[0]} />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold">{tl(product.name)}</span>
                            <span className="truncate text-sm text-ink-muted">
                              {brandName(product.brandId)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {owner && (
                          <div className="flex items-center gap-2">
                            <MerchantLogo merchant={owner} size="xs" />
                            <span className="truncate text-sm">{owner.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-muted">
                        {categoryPath(categories, product.categoryId, (item) => tl(item.name))}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                        {product.variants.length > 1
                          ? t('products.fromPrice', { sum: formatSum(priceOf(product)) })
                          : formatSum(priceOf(product))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {groupDigits(stockOf(product))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={productStatusTone[productStatus]}>
                          {t(`product.status.${productStatus}`)}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
