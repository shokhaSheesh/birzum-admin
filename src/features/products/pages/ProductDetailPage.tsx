import { ArrowLeft, ChevronRight, EyeOff, Package } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { brandsStore } from '@/entities/catalog/brands'
import { categoriesStore, categoryPath } from '@/entities/catalog/categories'
import { productStatusTone } from '@/entities/catalog/productStatus'
import {
  priceOf,
  productsStore,
  statusOf,
  stockOf,
  stockOfVariant,
} from '@/entities/catalog/products'
import { useFilialsOf } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { merchantStatusTone } from '@/entities/merchants/merchantStatus'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { merchantPath, ROUTES } from '@/shared/config/routes'
import { LANGS } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { ModerationCard } from '../components/ModerationCard'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

/**
 * One product: its photos, description in both languages, every variant with its price and
 * stock per filial, characteristics, and who sells it. Merchants change products in their app;
 * the admin checks each new one (approve or reject with a reason) and otherwise only looks.
 */
export function ProductDetailPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const product = productsStore.useAll().find((item) => item.id === id)
  const categories = categoriesStore.useAll()
  const merchant = merchantsStore.useAll().find((item) => item.id === product?.merchantId)
  const filials = useFilialsOf(product?.merchantId)
  const [photo, setPhoto] = useState(0)

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.products)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.products')}
    </button>
  )

  if (!product) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('products.notFound')} />
      </div>
    )
  }

  const status = statusOf(product)
  const brand = brandsStore.get(product.brandId)
  const category = categoryPath(categories, product.categoryId, (item) => tl(item.name))
  const hasVariants = product.variants.length > 1 || product.variants[0].label.uz !== ''

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{tl(product.name)}</h1>
          <StatusBadge tone={productStatusTone[status]}>
            {t(`product.status.${status}`)}
          </StatusBadge>
        </div>
        <p className="text-ink-muted">
          {brand?.name} · {category}
        </p>
      </div>

      {!product.visible && (
        <p className="flex items-center gap-3 rounded-card bg-navy-100 p-4 text-sm">
          <EyeOff size={20} className="shrink-0 text-brand" />
          {t('product.hiddenNote')}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className={card}>
            {product.photos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-subtle">
                <Package size={48} />
                <p className="text-sm text-ink-muted">{t('product.noPhotos')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-start">
                <img
                  src={product.photos[photo]}
                  alt={tl(product.name)}
                  className="aspect-[4/3] min-w-0 flex-1 rounded-control border border-line bg-white object-contain"
                />
                {product.photos.length > 1 && (
                  <div className="flex gap-2 sm:flex-col">
                    {product.photos.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setPhoto(index)}
                        aria-label={t('product.photo', { number: String(index + 1) })}
                        aria-pressed={index === photo}
                        className={cn(
                          'size-16 overflow-hidden rounded-control border-2 bg-white',
                          index === photo ? 'border-primary' : 'border-line',
                        )}
                      >
                        <img src={src} alt="" className="size-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <div className="flex flex-col gap-1 p-5">
              <h2 className="text-lg font-bold">
                {t(hasVariants ? 'product.variants' : 'product.stock')}
              </h2>
              <p className="text-sm text-ink-muted">{t('product.variants.hint')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    {hasVariants && <th className={th}>{t('product.variant')}</th>}
                    <th className={`${th} text-right`}>{t('products.col.price')}</th>
                    {filials.map((filial) => (
                      <th key={filial.id} className={`${th} text-right whitespace-nowrap`}>
                        {tl(filial.name)}
                      </th>
                    ))}
                    <th className={`${th} text-right`}>{t('product.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => {
                    const total = stockOfVariant(variant)
                    return (
                      <tr key={variant.label.uz} className="border-b border-line last:border-b-0">
                        {hasVariants && (
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">
                            {tl(variant.label)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                          {formatSum(variant.price)}
                        </td>
                        {filials.map((filial) => (
                          <td
                            key={filial.id}
                            className={cn(
                              'px-4 py-3 text-right tabular-nums',
                              !variant.stock[filial.id] && 'text-ink-subtle',
                            )}
                          >
                            {variant.stock[filial.id] ?? 0}
                          </td>
                        ))}
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-semibold tabular-nums',
                            total === 0 && 'text-warning',
                          )}
                        >
                          {total}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('product.description')}</h2>
            {LANGS.map((lang) => (
              <div key={lang} className="flex flex-col gap-1">
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {t(`product.lang.${lang}`)}
                </p>
                <p className="leading-relaxed">{product.description[lang] || '—'}</p>
              </div>
            ))}
          </section>

          {product.specs.length > 0 && (
            <section className={card}>
              <h2 className="text-lg font-bold">{t('product.specs')}</h2>
              <dl className="flex flex-col">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label.uz}
                    className="grid grid-cols-[160px_minmax(0,1fr)] gap-3 border-b border-line py-2.5 text-sm last:border-b-0"
                  >
                    <dt className="text-ink-muted">{tl(spec.label)}</dt>
                    <dd className="font-medium">{tl(spec.value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <ModerationCard product={product} />
          {merchant && (
            <Link
              to={merchantPath(merchant.id)}
              className="flex items-center gap-3 rounded-card border border-line bg-canvas p-4 hover:bg-surface/60"
            >
              <MerchantLogo merchant={merchant} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-semibold">{merchant.name}</p>
                <span className="self-start">
                  <StatusBadge tone={merchantStatusTone[merchant.status]}>
                    {t(`merchant.status.${merchant.status}`)}
                  </StatusBadge>
                </span>
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
            </Link>
          )}
          <section className={card}>
            <dl className="flex flex-col gap-2.5">
              {(
                [
                  [
                    t('products.col.price'),
                    hasVariants
                      ? t('products.fromPrice', { sum: formatSum(priceOf(product)) })
                      : formatSum(priceOf(product)),
                  ],
                  [
                    t('product.total'),
                    t('product.pieces', { count: groupDigits(stockOf(product)) }),
                  ],
                  [t('product.sold'), groupDigits(product.sold)],
                  [t('categories.col.name'), category],
                  [t('brands.col.brand'), brand?.name ?? '—'],
                  [t('product.created'), formatDate(product.createdAt)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 text-sm">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="px-1 text-sm text-ink-subtle">{t('product.readOnly')}</p>
        </aside>
      </div>
    </div>
  )
}
