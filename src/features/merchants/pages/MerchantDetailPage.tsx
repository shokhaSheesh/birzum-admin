import { ArrowLeft, Palette } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { applicationsStore } from '@/entities/applications/applications'
import { productsStore } from '@/entities/catalog/products'
import { useFilialsOf } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { staffOfFilial, staffStore } from '@/entities/merchants/staff'
import { merchantStatusTone } from '@/entities/merchants/merchantStatus'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { reviewsStore } from '@/entities/reviews/reviews'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { MerchantLookModal } from '../components/MerchantLookModal'
import { MerchantDashboard } from '../components/MerchantDashboard'
import {
  MerchantApplications,
  MerchantProducts,
  MerchantReviews,
} from '../components/MerchantLists'
import { MerchantStaff } from '../components/MerchantStaff'

type Tab = 'filials' | 'staff' | 'products' | 'applications' | 'reviews'
const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/** One card of the details column: a title, then label and value rows. */
function Details({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
      <h2 className="font-bold">{title}</h2>
      <dl className="flex flex-col gap-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 text-sm">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="font-medium break-words tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * One merchant as the admin sees it. The merchant's data comes from FlexSoft and is read-only
 * here: a dashboard for a period (sales, arizalar, rating, sales over time), then tabs with its
 * filials, staff, products, arizalar and reviews, and every detail from its form on the right.
 * Only the shop's look in the client app is set here.
 */
export function MerchantDetailPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const merchant = merchantsStore.useAll().find((item) => item.id === id)
  const filials = useFilialsOf(id)
  const [editingLook, setEditingLook] = useState(false)
  const [tab, setTab] = useState<Tab>('filials')
  const staff = staffStore.useAll().filter((user) => user.merchantId === id)
  const productCount = productsStore.useAll().filter((p) => p.merchantId === id).length
  const applicationCount = applicationsStore.useAll().filter((a) => a.merchantId === id).length
  const reviewCount = reviewsStore
    .useAll()
    .filter((r) => r.merchantId === id && r.status === 'published').length

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.merchants)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.merchants')}
    </button>
  )

  if (!merchant) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('merchant.notFound')} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-wrap items-center gap-5">
        <MerchantLogo merchant={merchant} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{merchant.name}</h1>
            <StatusBadge tone={merchantStatusTone[merchant.status]}>
              {t(`merchant.status.${merchant.status}`)}
            </StatusBadge>
          </div>
          <p className="text-ink-muted">
            {merchant.legal.company} · {t('merchants.inn')} {merchant.legal.inn} ·{' '}
            {t('merchant.since', { date: formatDate(merchant.createdAt) })}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditingLook(true)}>
          <Palette size={18} />
          {t('merchant.look.edit')}
        </Button>
      </div>

      <MerchantDashboard merchant={merchant} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col rounded-card border border-line bg-canvas">
          <div className="px-5 pt-2">
            <UnderlineTabs
              label={merchant.name}
              options={[
                { value: 'filials', label: t('merchant.filials'), count: filials.length },
                { value: 'staff', label: t('staff.title'), count: staff.length },
                { value: 'products', label: t('nav.products'), count: productCount },
                { value: 'applications', label: t('nav.applications'), count: applicationCount },
                { value: 'reviews', label: t('nav.reviews'), count: reviewCount },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          {tab === 'staff' ? (
            <MerchantStaff merchant={merchant} />
          ) : tab === 'products' ? (
            <MerchantProducts merchantId={merchant.id} />
          ) : tab === 'applications' ? (
            <MerchantApplications merchantId={merchant.id} />
          ) : tab === 'reviews' ? (
            <MerchantReviews merchantId={merchant.id} />
          ) : filials.length === 0 ? (
            <EmptyState
              title={t('merchant.filials.empty')}
              hint={t('merchant.filials.emptyHint')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('merchant.filials')}</th>
                    <th className={th}>{t('filial.col.phone')}</th>
                    <th className={th}>{t('filial.col.hours')}</th>
                    <th className={th}>{t('filial.col.staff')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filials.map((filial) => (
                    <tr key={filial.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-semibold">{tl(filial.name)}</span>
                          <span className="text-sm text-ink-muted">{tl(filial.address)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                        {formatPhone(filial.phone)}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">{filial.hours}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {staffOfFilial(staff, merchant.id, filial.id).length}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={filial.active ? 'success' : 'neutral'}>
                          {t(filial.active ? 'filial.open' : 'filial.closed')}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <Details
            title={t('merchant.section.shop')}
            rows={[
              [t('merchant.description'), tl(merchant.description) || '—'],
              [t('merchant.phone'), formatPhone(merchant.phone)],
            ]}
          />
          <Details
            title={t('merchant.section.legal')}
            rows={[
              [t('merchant.company'), merchant.legal.company],
              [t('merchants.inn'), merchant.legal.inn],
              [t('merchant.director'), merchant.legal.director],
              [t('merchant.address'), merchant.legal.address],
            ]}
          />
          <Details
            title={t('merchant.section.bank')}
            rows={[
              [t('merchant.bank'), merchant.bank.name],
              [t('merchant.mfo'), merchant.bank.mfo],
              [t('merchant.account'), merchant.bank.account],
            ]}
          />
          <Details
            title={t('merchant.section.contract')}
            rows={[
              [t('merchant.contract'), merchant.contract.number],
              [t('merchant.contractDate'), merchant.contract.date],
              [t('merchant.tariff'), t('merchant.tariff.value', { tariff: merchant.tariff })],
            ]}
          />
          <Details
            title={t('merchant.section.owner')}
            rows={[
              [t('merchant.owner'), merchant.owner.name],
              [t('merchant.phone'), formatPhone(merchant.owner.phone)],
              [t('login.username'), merchant.owner.login],
            ]}
          />
        </div>
      </div>

      {editingLook && (
        <MerchantLookModal merchant={merchant} onClose={() => setEditingLook(false)} />
      )}
    </div>
  )
}
