import { Ban, Eye, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loanApplicationsStore } from '@/entities/microloans/applications'
import {
  CLIENT_SEGMENTS,
  loanClientsStore,
  segmentOf,
  segmentTone,
  type ClientSegment,
} from '@/entities/microloans/loanClients'
import { loansStore, progressOf } from '@/entities/microloans/loans'
import { brandClientPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { ALL_TIME, inRange } from '@/shared/lib/dates'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { boundsOf, type Period } from '@/shared/lib/period'
import { usePagination } from '@/shared/lib/usePagination'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Mijozlar of one microloan brand: everyone who signed up in its app, whether they borrowed or
 * not — only signed up, sent an ariza, have a running loan, are late, or have paid everything.
 * The period picks who signed up when. A row opens the client.
 */
export function LoanClientsPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const clients = loanClientsStore.useAll().filter((client) => client.brand === brand)
  const apps = loanApplicationsStore.useAll().filter((app) => app.brand === brand)
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const [segment, setSegment] = useState<'all' | ClientSegment>('all')
  const [query, setQuery] = useState('')
  const [access, setAccess] = useState<'' | 'active' | 'blocked'>('')
  const [period, setPeriod] = useState<Period>(() => ({
    unit: 'all',
    anchor: new Date(),
    range: ALL_TIME,
  }))
  const bounds = boundsOf(period)

  const rows = clients.map((client) => {
    const own = loans.filter((loan) => loan.borrower.passport === client.passport)
    return {
      client,
      segment: segmentOf(client, apps, loans),
      apps: apps.filter((app) => app.borrower.passport === client.passport).length,
      loans: own.length,
      open: own.filter((loan) => !loan.closedAt).length,
      left: own.reduce(
        (sum, loan) => sum + (loan.closedAt ? 0 : progressOf(loan).principalLeft),
        0,
      ),
    }
  })
  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = rows.filter(
    ({ client }) =>
      inRange(client.registeredAt, bounds) &&
      (needle === '' ||
        client.name.toLowerCase().includes(needle) ||
        client.passport.toLowerCase().includes(needle) ||
        (digits.length >= 3 && client.phone.includes(digits))) &&
      (!access || (access === 'blocked' ? !!client.block : !client.block)),
  )
  const shown = filtered.filter((row) => segment === 'all' || row.segment === segment)
  const pager = usePagination(shown, JSON.stringify([query, access, period, segment]))

  const signedUp = rows.filter((row) => inRange(row.client.registeredAt, bounds))
  const borrowed = signedUp.filter((row) => row.loans > 0)
  const withLoan = rows.filter((row) => row.segment === 'active' || row.segment === 'late')
  const late = rows.filter((row) => row.segment === 'late')

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.borrowers')} />

      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('mlClients.stat.signedUp')}
          value={groupDigits(signedUp.length)}
          hint={t('mlClients.stat.signedUpHint')}
        />
        <StatCard
          label={t('mlClients.stat.borrowed')}
          value={`${signedUp.length ? Math.round((borrowed.length / signedUp.length) * 100) : 0}%`}
          hint={t('mlClients.stat.borrowedHint', { count: String(borrowed.length) })}
        />
        <StatCard
          label={t('mlClients.stat.withLoan')}
          value={groupDigits(withLoan.length)}
          hint={t('mlClients.stat.now')}
        />
        <StatCard
          label={t('mlClients.stat.late')}
          value={String(late.length)}
          hint={t('mlClients.stat.now')}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('mlClients.segment')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...CLIENT_SEGMENTS.map((value) => ({
                value,
                label: t(`mlClients.segment.${value}`),
                count: filtered.filter((row) => row.segment === value).length,
              })),
            ]}
            value={segment}
            onChange={setSegment}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('mlClients.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('mlClients.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('mlClients.access')}
            options={[
              { value: '', label: t('mlClients.access.all') },
              { value: 'active', label: t('mlClients.access.active') },
              { value: 'blocked', label: t('mlClients.access.blocked') },
            ]}
            value={access}
            onChange={setAccess}
          />
        </div>

        {shown.length === 0 ? (
          <EmptyState title={t('mlClients.empty')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('loanApps.col.borrower')}</th>
                    <th className={th}>{t('loanApp.passport')}</th>
                    <th className={th}>{t('mlClients.col.since')}</th>
                    <th className={`${th} text-right`}>{t('nav.applications')}</th>
                    <th className={`${th} text-right`}>{t('nav.loans')}</th>
                    <th className={`${th} text-right`}>{t('loans.col.left')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody>
                  {pager.rows.map((row) => (
                    <tr
                      key={row.client.id}
                      onClick={() => navigate(brandClientPath(brand, row.client.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-1.5 truncate">
                            {row.client.name}
                            {row.client.block && (
                              <Ban
                                size={15}
                                className="shrink-0 text-danger"
                                aria-label={t('mlClients.access.blocked')}
                              />
                            )}
                          </span>
                          <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                            {formatPhone(row.client.phone)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                        {row.client.passport.slice(0, 2)} {row.client.passport.slice(2)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                        {formatDate(row.client.registeredAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {row.apps || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {row.loans
                          ? t('mlClients.loansCount', {
                              open: String(row.open),
                              total: String(row.loans),
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap tabular-nums">
                        {row.left ? formatSum(row.left) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={row.client.block ? 'danger' : segmentTone[row.segment]}>
                          {row.client.block
                            ? t('mlClients.access.blocked')
                            : t(`mlClients.segment.${row.segment}`)}
                        </StatusBadge>
                      </td>
                      <td className="pr-3">
                        <RowActions
                          actions={[
                            {
                              icon: Eye,
                              label: t('common.view'),
                              onClick: () => navigate(brandClientPath(brand, row.client.id)),
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
