import { Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationStatusTone } from '@/entities/applications/applicationStatus'
import {
  APPLICATION_STATUSES,
  applicationsStore,
  type ApplicationStatus,
} from '@/entities/applications/applications'
import { filialsStore } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { applicationPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { ALL_TIME, inRange, startOfDay, type DateRange } from '@/shared/lib/dates'
import { formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { DateRangePicker } from '@/shared/ui/DateRangePicker'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Every ariza on the platform, read-only: figures on top, then a table filtered by status,
 * search, merchant, filial and period. Merchants and shoppers create and move arizalar; the
 * admin watches and opens one to see everything about it.
 */
export function ApplicationsPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const all = applicationsStore.useAll()
  const merchants = merchantsStore.useAll()
  const filials = filialsStore.useAll()
  const [status, setStatus] = useState<'all' | ApplicationStatus>('all')
  const [query, setQuery] = useState('')
  const [merchant, setMerchant] = useState('')
  const [filial, setFilial] = useState('')
  const [period, setPeriod] = useState<DateRange>(ALL_TIME)
  const [today] = useState(() => new Date())

  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = all.filter(
    (application) =>
      (needle === '' ||
        application.client.name.toLowerCase().includes(needle) ||
        (digits !== '' &&
          (String(application.number).includes(digits) ||
            application.client.phone.includes(digits)))) &&
      (!merchant || application.merchantId === merchant) &&
      (!filial || application.filialId === filial) &&
      inRange(application.createdAt, period),
  )
  const rows = filtered.filter((application) => status === 'all' || application.status === status)

  const thisMonth = all.filter(
    (application) =>
      application.createdAt.getMonth() === today.getMonth() &&
      application.createdAt.getFullYear() === today.getFullYear(),
  )
  const handedThisMonth = thisMonth.filter(
    (application) => application.status === 'handed' || application.status === 'closed',
  )
  const decided = thisMonth.filter(
    (application) => application.status !== 'pending' && application.status !== 'processing',
  )
  const rejectedShare = decided.length
    ? Math.round(
        (decided.filter((application) => application.status === 'rejected').length /
          decided.length) *
          100,
      )
    : 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.applications')} description={t('applications.description')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('applications.stat.month')}
          value={groupDigits(thisMonth.length)}
          hint={t('applications.stat.today', {
            count: String(all.filter((a) => a.createdAt >= startOfDay(today)).length),
          })}
        />
        <StatCard
          label={t('application.status.pending')}
          value={String(all.filter((application) => application.status === 'pending').length)}
          hint={t('applications.stat.processing', {
            count: String(all.filter((a) => a.status === 'processing').length),
          })}
        />
        <StatCard
          label={t('applications.stat.handed')}
          value={formatSum(handedThisMonth.reduce((sum, a) => sum + a.goodsTotal, 0))}
          hint={t('applications.count', { count: String(handedThisMonth.length) })}
        />
        <StatCard
          label={t('applications.stat.rejected')}
          value={`${rejectedShare}%`}
          hint={t('applications.stat.rejectedHint')}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...APPLICATION_STATUSES.map((value) => ({
                value,
                label: t(`application.status.${value}`),
                count: filtered.filter((application) => application.status === value).length,
              })),
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('applications.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('applications.search')}
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
            onChange={(value) => {
              setMerchant(value)
              setFilial('')
            }}
          />
          <FilterSelect
            label={t('payout.col.filial')}
            options={[
              { value: '', label: t('applications.allFilials') },
              ...filials
                .filter((item) => item.merchantId === merchant)
                .map((item) => ({ value: item.id, label: tl(item.name) })),
            ]}
            value={filial}
            onChange={setFilial}
            disabled={!merchant}
          />
          <DateRangePicker label={t('applications.period')} value={period} onChange={setPeriod} />
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('applications.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('payout.col.ariza')}</th>
                  <th className={th}>{t('applications.col.client')}</th>
                  <th className={th}>{t('products.col.merchant')}</th>
                  <th className={th}>{t('products.col.product')}</th>
                  <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-14" />
                </tr>
              </thead>
              <tbody>
                {rows.map((application) => {
                  const owner = merchants.find((item) => item.id === application.merchantId)
                  const place = filials.find((item) => item.id === application.filialId)
                  const extra = application.lines.length - 1
                  return (
                    <tr
                      key={application.id}
                      onClick={() => navigate(applicationPath(application.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold tabular-nums">
                            № {groupDigits(application.number)}
                          </span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {formatDateTime(application.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{application.client.name}</span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {formatPhone(application.client.phone)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {owner && (
                          <div className="flex items-center gap-2">
                            <MerchantLogo merchant={owner} size="xs" />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm">{owner.name}</span>
                              <span className="truncate text-xs text-ink-muted">
                                {place ? tl(place.name) : ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="max-w-56 px-4 py-3 text-sm">
                        <span className="line-clamp-1">{application.lines[0].name}</span>
                        {extra > 0 && (
                          <span className="text-ink-muted">
                            {t('applications.more', { count: String(extra) })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col">
                          <span className="font-semibold whitespace-nowrap tabular-nums">
                            {formatSum(application.goodsTotal)}
                          </span>
                          <span className="text-sm text-ink-muted">
                            {t('term.months', { count: String(application.term) })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={applicationStatusTone[application.status]}>
                          {t(`application.status.${application.status}`)}
                        </StatusBadge>
                      </td>
                      <td className="pr-3">
                        <RowActions
                          actions={[
                            {
                              icon: Eye,
                              label: t('common.view'),
                              onClick: () => navigate(applicationPath(application.id)),
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
