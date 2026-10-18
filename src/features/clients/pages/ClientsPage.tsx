import { Ban, Eye, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsStore } from '@/entities/applications/applications'
import { clientStatusTone } from '@/entities/clients/clientStatus'
import { paymentsStore } from '@/entities/collections/payments'
import { clientsStore, fullName, initialsOf, type Client } from '@/entities/clients/clients'
import { CLIENT_STATUSES, clientStatusOf, debtOf, type ClientStatus } from '@/entities/clients/debt'
import { clientPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { ALL_TIME, inRange, type DateRange } from '@/shared/lib/dates'
import { formatDate, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui/Avatar'
import { DateRangePicker } from '@/shared/ui/DateRangePicker'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { BlockModal, UnblockDialog } from '../components/BlockDialogs'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
type LimitFilter = '' | 'has' | 'expired' | 'none'

/**
 * Every shopper: figures on top, then a table filtered by status, search, limit and sign-up
 * date. A row opens the shopper; the row actions block or unblock.
 */
export function ClientsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const clients = clientsStore.useAll()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const [status, setStatus] = useState<'all' | ClientStatus>('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState<LimitFilter>('')
  const [joined, setJoined] = useState<DateRange>(ALL_TIME)
  const [blocking, setBlocking] = useState<Client | null>(null)
  const [unblocking, setUnblocking] = useState<Client | null>(null)
  const [today] = useState(() => new Date())

  const rowsAll = clients.map((client) => {
    const debt = debtOf(client, applications, payments, today)
    return { client, debt, status: clientStatusOf(client, debt) }
  })
  const limitOf = (client: Client): Exclude<LimitFilter, ''> =>
    !client.limit ? 'none' : client.limit.validUntil < today ? 'expired' : 'has'
  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const filtered = rowsAll.filter(
    ({ client }) =>
      (needle === '' ||
        fullName(client).toLowerCase().includes(needle) ||
        client.passport.toLowerCase().includes(needle) ||
        (digits.length >= 3 && (client.phone.includes(digits) || client.pinfl.includes(digits)))) &&
      (!limit || limitOf(client) === limit) &&
      inRange(client.registeredAt, joined),
  )
  const rows = filtered.filter((row) => status === 'all' || row.status === status)
  const count = (value: ClientStatus) => rowsAll.filter((row) => row.status === value).length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.customers')} description={t('clients.description')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('clients.stat.total')} value={String(clients.length)} />
        <StatCard
          label={t('client.status.running')}
          value={String(count('running') + count('overdue'))}
          hint={formatSum(rowsAll.reduce((sum, row) => sum + row.debt.remaining, 0))}
        />
        <StatCard
          label={t('client.status.overdue')}
          value={String(count('overdue'))}
          hint={formatSum(rowsAll.reduce((sum, row) => sum + row.debt.overdue, 0))}
        />
        <StatCard label={t('client.status.blocked')} value={String(count('blocked'))} />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('merchants.status')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...CLIENT_STATUSES.map((value) => ({
                value,
                label: t(`client.status.${value}`),
                count: filtered.filter((row) => row.status === value).length,
              })),
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('clients.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('clients.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('client.limit')}
            options={[
              { value: '', label: t('clients.limit.all') },
              { value: 'has', label: t('clients.limit.has') },
              { value: 'expired', label: t('clients.limit.expired') },
              { value: 'none', label: t('clients.limit.none') },
            ]}
            value={limit}
            onChange={setLimit}
          />
          <DateRangePicker label={t('clients.joined')} value={joined} onChange={setJoined} />
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('clients.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('applications.col.client')}</th>
                  <th className={th}>{t('application.pinfl')}</th>
                  <th className={`${th} text-right`}>{t('client.limit')}</th>
                  <th className={`${th} text-right`}>{t('clients.col.nasiya')}</th>
                  <th className={`${th} text-right`}>{t('clients.col.debt')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ client, debt, status: clientStatus }) => {
                  const limitState = limitOf(client)
                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(clientPath(client.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar initials={initialsOf(client)} photoUrl={client.photoUrl} />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold">{fullName(client)}</span>
                            <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                              {formatPhone(client.phone)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">{client.pinfl}</td>
                      <td className="px-4 py-3 text-right">
                        {limitState === 'none' ? (
                          <span className="text-sm text-ink-subtle">{t('clients.limit.none')}</span>
                        ) : (
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                'font-semibold whitespace-nowrap tabular-nums',
                                limitState === 'expired' && 'text-ink-subtle line-through',
                              )}
                            >
                              {formatSum(client.limit!.amount)}
                            </span>
                            <span
                              className={cn(
                                'text-xs',
                                limitState === 'expired' ? 'text-warning' : 'text-ink-muted',
                              )}
                            >
                              {limitState === 'expired'
                                ? t('clients.limit.expired')
                                : t('client.limit.until', {
                                    date: formatDate(client.limit!.validUntil),
                                  })}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{debt.running}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col">
                          <span className="font-semibold whitespace-nowrap tabular-nums">
                            {debt.remaining ? formatSum(debt.remaining) : '—'}
                          </span>
                          {debt.overdue > 0 && (
                            <span className="text-xs whitespace-nowrap text-danger">
                              {t('client.overdueDays', { days: String(debt.overdueDays) })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={clientStatusTone[clientStatus]}>
                          {t(`client.status.${clientStatus}`)}
                        </StatusBadge>
                      </td>
                      <td className="pr-3">
                        <RowActions
                          actions={[
                            {
                              icon: Eye,
                              label: t('common.view'),
                              onClick: () => navigate(clientPath(client.id)),
                            },
                            client.block
                              ? {
                                  icon: ShieldCheck,
                                  label: t('client.unblock'),
                                  onClick: () => setUnblocking(client),
                                }
                              : {
                                  icon: Ban,
                                  label: t('client.block'),
                                  onClick: () => setBlocking(client),
                                  danger: true,
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

      {blocking && <BlockModal client={blocking} onClose={() => setBlocking(null)} />}
      {unblocking && <UnblockDialog client={unblocking} onClose={() => setUnblocking(null)} />}
    </div>
  )
}
