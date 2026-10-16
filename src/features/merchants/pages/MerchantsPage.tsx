import { ChevronRight, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { filialsStore } from '@/entities/merchants/filials'
import {
  MERCHANT_STATUSES,
  merchantsStore,
  type MerchantStatus,
} from '@/entities/merchants/merchants'
import { merchantStatusTone } from '@/entities/merchants/merchantStatus'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { merchantPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/** Every merchant on the platform: figures on top, then a table filtered by status and search. */
export function MerchantsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const all = merchantsStore.useAll()
  const filials = filialsStore.useAll()
  const [status, setStatus] = useState<'all' | MerchantStatus>('all')
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const rows = all.filter(
    (merchant) =>
      (status === 'all' || merchant.status === status) &&
      (needle === '' ||
        merchant.name.toLowerCase().includes(needle) ||
        merchant.legal.company.toLowerCase().includes(needle) ||
        merchant.legal.inn.includes(needle)),
  )
  const active = all.filter((merchant) => merchant.status === 'active')
  const sales = all.reduce((sum, merchant) => sum + merchant.salesThisMonth, 0)
  const nasiya = all.reduce((sum, merchant) => sum + merchant.activeNasiya, 0)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.merchants')}
        description={t('merchants.description')}
        actions={
          <Button onClick={() => navigate(ROUTES.merchantNew)}>
            <Plus size={20} />
            {t('merchants.add')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('merchants.stat.total')} value={String(all.length)} />
        <StatCard label={t('merchants.stat.active')} value={String(active.length)} />
        <StatCard label={t('merchants.stat.sales')} value={formatSum(sales)} />
        <StatCard label={t('merchants.stat.nasiya')} value={groupDigits(nasiya)} />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: all.length },
              ...MERCHANT_STATUSES.map((value) => ({
                value,
                label: t(`merchant.status.${value}`),
                count: all.filter((merchant) => merchant.status === value).length,
              })),
            ]}
            value={status}
            onChange={setStatus}
          />
          <label className="mb-2 flex h-10 w-full max-w-xs items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('merchants.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('merchants.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('merchants.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('merchants.col.merchant')}</th>
                  <th className={th}>{t('merchants.col.filials')}</th>
                  <th className={th}>{t('merchants.col.products')}</th>
                  <th className={`${th} text-right`}>{t('merchants.col.sales')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((merchant) => (
                  <tr
                    key={merchant.id}
                    onClick={() => navigate(merchantPath(merchant.id))}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MerchantLogo merchant={merchant} size="sm" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">{merchant.name}</span>
                          <span className="truncate text-sm text-ink-muted">
                            {merchant.legal.company} · {t('merchants.inn')} {merchant.legal.inn}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {filials.filter((filial) => filial.merchantId === merchant.id).length}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{merchant.products}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatSum(merchant.salesThisMonth)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={merchantStatusTone[merchant.status]}>
                        {t(`merchant.status.${merchant.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="pr-3">
                      <ChevronRight size={18} className="text-ink-subtle" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
