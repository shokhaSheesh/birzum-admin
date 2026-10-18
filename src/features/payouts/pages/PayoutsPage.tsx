import { Banknote, CheckCheck, Eye, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import {
  nextDueDate,
  owedSales,
  payoutsStore,
  salesStore,
  sumOf,
  type PayoutState,
} from '@/entities/payouts/payouts'
import { payoutStateTone } from '@/entities/payouts/payoutState'
import { newPayoutPath, payoutPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { ALL_TIME, inRange, type DateRange } from '@/shared/lib/dates'
import { formatDate, formatSum } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { DateRangePicker } from '@/shared/ui/DateRangePicker'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { MarkPaidDialog } from '../components/MarkPaidDialog'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

type Tab = 'owed' | 'history'

/**
 * Birzum's payouts to merchants for their nasiya sales. "Toʻlanishi kerak" shows what each
 * merchant is owed and when it is due; "Oʻtkazmalar" is every transfer made. A transfer is
 * created on its own page and marked sent once the bank has it.
 */
export function PayoutsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const merchants = merchantsStore.useAll()
  const sales = salesStore.useAll()
  const payouts = payoutsStore.useAll()
  const [tab, setTab] = useState<Tab>('owed')
  const [query, setQuery] = useState('')
  const [merchant, setMerchant] = useState('')
  const [state, setState] = useState<'' | PayoutState>('')
  const [range, setRange] = useState<DateRange>(ALL_TIME)
  const [marking, setMarking] = useState<string | null>(null)
  const [today] = useState(() => new Date())

  const owed = owedSales(sales)
  const owedRows = merchants
    .map((item) => ({ merchant: item, sales: owedSales(owed, item.id) }))
    .filter((row) => row.sales.length > 0)
    .sort((a, b) => sumOf(b.sales) - sumOf(a.sales))
  const processing = payouts.filter((payout) => payout.state === 'processing')
  const paidThisMonth = payouts.filter(
    (payout) =>
      payout.state === 'paid' &&
      payout.date.getMonth() === today.getMonth() &&
      payout.date.getFullYear() === today.getFullYear(),
  )
  const nameOf = (id: string) => merchants.find((item) => item.id === id)

  const needle = query.trim().toLowerCase()
  const history = payouts.filter(
    (payout) =>
      (needle === '' || payout.reference.toLowerCase().includes(needle)) &&
      (!merchant || payout.merchantId === merchant) &&
      (!state || payout.state === state) &&
      inRange(payout.date, range),
  )

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.payouts')}
        description={t('payouts.description')}
        actions={
          <Button onClick={() => navigate(ROUTES.payoutNew)}>
            <Plus size={20} />
            {t('payouts.create')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('payouts.stat.owed')}
          value={formatSum(sumOf(owed))}
          hint={t('payouts.stat.owedHint', { count: String(owed.length) })}
        />
        <StatCard
          label={t('payouts.stat.processing')}
          value={formatSum(sumOf(processing))}
          hint={t('payouts.count', { count: String(processing.length) })}
        />
        <StatCard
          label={t('payouts.stat.paidMonth')}
          value={formatSum(sumOf(paidThisMonth))}
          hint={t('payouts.count', { count: String(paidThisMonth.length) })}
        />
        <StatCard
          label={t('payouts.stat.last')}
          value={payouts[0] ? formatDate(payouts[0].date) : '—'}
          hint={payouts[0] ? nameOf(payouts[0].merchantId)?.name : undefined}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-2">
          <UnderlineTabs
            label={t('nav.payouts')}
            options={[
              { value: 'owed', label: t('payouts.tab.owed'), count: owedRows.length },
              { value: 'history', label: t('payouts.tab.history'), count: payouts.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'owed' ? (
          owedRows.length === 0 ? (
            <EmptyState title={t('payouts.owed.empty')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('products.col.merchant')}</th>
                    <th className={`${th} text-right`}>{t('payouts.col.sales')}</th>
                    <th className={th}>{t('payouts.col.oldest')}</th>
                    <th className={th}>{t('payouts.col.due')}</th>
                    <th className={`${th} text-right`}>{t('payouts.col.owed')}</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {owedRows.map((row) => {
                    const due = nextDueDate(row.merchant, today)
                    // A sale from before the last payout day should already have been paid
                    const late =
                      row.sales[0].handedAt <
                      new Date(
                        due.getTime() -
                          (row.merchant.payoutSchedule === 'weekly' ? 9 : 36) * 24 * 3600 * 1000,
                      )
                    return (
                      <tr
                        key={row.merchant.id}
                        onClick={() => navigate(newPayoutPath(row.merchant.id))}
                        className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <MerchantLogo merchant={row.merchant} size="sm" />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-semibold">{row.merchant.name}</span>
                              <span className="truncate text-sm text-ink-muted">
                                {t(`payouts.schedule.${row.merchant.payoutSchedule}`)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.sales.length}</td>
                        <td className="px-4 py-3 text-sm tabular-nums">
                          {formatDate(row.sales[0].handedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {late ? (
                            <StatusBadge tone="danger">{t('payouts.late')}</StatusBadge>
                          ) : (
                            <span className="text-sm tabular-nums">{formatDate(due)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">
                          {formatSum(sumOf(row.sales))}
                        </td>
                        <td className="pr-3">
                          <RowActions
                            actions={[
                              {
                                icon: Banknote,
                                label: t('payouts.create'),
                                onClick: () => navigate(newPayoutPath(row.merchant.id)),
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
          )
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
              <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
                <Search size={18} className="shrink-0" />
                <span className="sr-only">{t('payouts.search')}</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('payouts.search')}
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
                label={t('merchants.status')}
                options={[
                  { value: '', label: t('payouts.allStates') },
                  { value: 'processing', label: t('payout.state.processing') },
                  { value: 'paid', label: t('payout.state.paid') },
                ]}
                value={state}
                onChange={setState}
              />
              <DateRangePicker label={t('payouts.col.date')} value={range} onChange={setRange} />
            </div>
            {history.length === 0 ? (
              <EmptyState title={t('payouts.empty')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={th}>{t('payouts.col.reference')}</th>
                      <th className={th}>{t('products.col.merchant')}</th>
                      <th className={th}>{t('payouts.col.date')}</th>
                      <th className={`${th} text-right`}>{t('payouts.col.sales')}</th>
                      <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                      <th className={th}>{t('merchants.status')}</th>
                      <th className="w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((payout) => {
                      const owner = nameOf(payout.merchantId)
                      return (
                        <tr
                          key={payout.id}
                          onClick={() => navigate(payoutPath(payout.id))}
                          className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                        >
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            {payout.reference}
                          </td>
                          <td className="px-4 py-3">
                            {owner && (
                              <div className="flex items-center gap-2">
                                <MerchantLogo merchant={owner} size="xs" />
                                <span className="truncate text-sm">{owner.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm tabular-nums">
                            {formatDate(payout.date)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {payout.saleIds.length}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                            {formatSum(payout.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={payoutStateTone[payout.state]}>
                              {t(`payout.state.${payout.state}`)}
                            </StatusBadge>
                          </td>
                          <td className="pr-3">
                            <RowActions
                              actions={[
                                {
                                  icon: Eye,
                                  label: t('common.view'),
                                  onClick: () => navigate(payoutPath(payout.id)),
                                },
                                ...(payout.state === 'processing'
                                  ? [
                                      {
                                        icon: CheckCheck,
                                        label: t('payout.markPaid'),
                                        onClick: () => setMarking(payout.id),
                                      },
                                    ]
                                  : []),
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
          </>
        )}
      </div>

      {marking && <MarkPaidDialog payoutId={marking} onClose={() => setMarking(null)} />}
    </div>
  )
}
