import { Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LOAN_APP_STATUSES,
  loanApplicationsStore,
  loanAppStatusTone,
  sumOf,
  type LoanAppStatus,
} from '@/entities/microloans/applications'
import { loanProductsStore } from '@/entities/microloans/products'
import { loanAppPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { inRange } from '@/shared/lib/dates'
import { boundsOf, thisMonth, type Period } from '@/shared/lib/period'
import { formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { usePagination } from '@/shared/lib/usePagination'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { IntakeBanner, IntakeSwitch } from '../components/IntakeSwitch'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Arizalar of one microloan brand: figures on top, then every ariza from its app by status,
 * with search, product and period. The app's rules decide most of them; those they could not
 * ("Qoʻlda qaror") wait here for an admin, who decides on the ariza's page.
 */
export function LoanApplicationsPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const all = loanApplicationsStore.useAll().filter((app) => app.brand === brand)
  const products = loanProductsStore.useAll().filter((p) => p.brand === brand)
  const [status, setStatus] = useState<'all' | LoanAppStatus>('all')
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState('')
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const bounds = boundsOf(period)

  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = all.filter(
    (app) =>
      (needle === '' ||
        app.borrower.name.toLowerCase().includes(needle) ||
        app.borrower.passport.toLowerCase().includes(needle) ||
        (digits !== '' &&
          (String(app.number).includes(digits) || app.borrower.phone.includes(digits)))) &&
      (!product || app.productId === product) &&
      inRange(app.createdAt, bounds),
  )
  const rows = filtered.filter((app) => status === 'all' || app.status === status)
  const pager = usePagination(rows, JSON.stringify([query, product, period, status]))

  // Figures for the period; the ones waiting for a decision are counted as of now
  const inPeriod = all.filter((app) => inRange(app.createdAt, bounds))
  const paid = inPeriod.filter((app) => app.status === 'paidOut')
  const decided = inPeriod.filter((app) => app.status !== 'review')
  const approvedShare = decided.length
    ? Math.round((decided.filter((app) => app.status !== 'declined').length / decided.length) * 100)
    : 0
  const reviewing = all.filter((app) => app.status === 'review').length
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? '—'

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.applications')} actions={<IntakeSwitch brand={brand} />} />
      <IntakeBanner brand={brand} />

      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('loanApps.stat.count')}
          value={groupDigits(inPeriod.length)}
          hint={t('loanApps.stat.countHint', {
            count: String(inPeriod.filter((app) => app.status === 'declined').length),
          })}
        />
        <StatCard
          label={t('loanApp.status.review')}
          value={String(reviewing)}
          hint={t('loanApps.stat.reviewHint')}
        />
        <StatCard
          label={t('loanApps.stat.paid')}
          value={formatSum(paid.reduce((sum, app) => sum + sumOf(app), 0))}
          hint={t('applications.count', { count: String(paid.length) })}
        />
        <StatCard
          label={t('loanApps.stat.approved')}
          value={`${approvedShare}%`}
          hint={t('loanApps.stat.approvedHint')}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...LOAN_APP_STATUSES.map((value) => ({
                value,
                label: t(`loanApp.status.${value}`),
                count: filtered.filter((app) => app.status === value).length,
              })),
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('loanApps.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('loanApps.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('mlProducts.col.product')}
            options={[
              { value: '', label: t('loanApps.allProducts') },
              ...products.map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={product}
            onChange={setProduct}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('applications.empty')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('payout.col.ariza')}</th>
                    <th className={th}>{t('loanApps.col.borrower')}</th>
                    <th className={th}>{t('mlProducts.col.product')}</th>
                    <th className={`${th} text-right`}>{t('loanApps.col.sum')}</th>
                    <th className={`${th} text-right`}>{t('loanApps.col.load')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody>
                  {pager.rows.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(loanAppPath(brand, app.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold tabular-nums">
                            № {groupDigits(app.number)}
                          </span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {formatDateTime(app.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{app.borrower.name}</span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {formatPhone(app.borrower.phone)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium">{productName(app.productId)}</span>
                        <span className="block text-ink-muted">
                          {t(`loanApp.purpose.${app.purpose}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col">
                          <span className="font-semibold whitespace-nowrap tabular-nums">
                            {formatSum(sumOf(app))}
                          </span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {app.offered
                              ? t('loanApps.asked', { sum: formatSum(app.amount) })
                              : t('mlProducts.months', { n: String(app.term) })}
                          </span>
                        </div>
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right text-sm font-semibold tabular-nums',
                          app.checks.load > 50 && 'text-danger',
                        )}
                      >
                        {app.checks.load}%
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={loanAppStatusTone[app.status]}>
                          {t(`loanApp.status.${app.status}`)}
                        </StatusBadge>
                      </td>
                      <td className="pr-3">
                        <RowActions
                          actions={[
                            {
                              icon: Eye,
                              label: t('common.view'),
                              onClick: () => navigate(loanAppPath(brand, app.id)),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pager={pager} />
          </>
        )}
      </div>
    </div>
  )
}
