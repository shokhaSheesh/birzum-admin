import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsStore } from '@/entities/applications/applications'
import { clientsStore, fullName } from '@/entities/clients/clients'
import { AGE_BUCKETS, ageBucketOf, type AgeBucket } from '@/entities/clients/debt'
import {
  daysLate,
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  paymentsStore,
  progressOf,
  type PaymentKind,
  type PaymentMethod,
} from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { usePagination } from '@/shared/lib/usePagination'
import { cn } from '@/shared/lib/cn'
import { inRange, startOfDay } from '@/shared/lib/dates'
import { boundsOf, bucketsOf, thisMonth, type Period } from '@/shared/lib/period'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { ExportMenu } from '@/shared/ui/ExportMenu'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { StatCard } from '@/shared/ui/StatCard'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { CollectionReports } from '../components/CollectionReports'
import { IncomeChart, type Expected } from '../components/IncomeChart'
import { PaymentsTable } from '../components/PaymentsTable'

/** Darker the later; each group also has its name, so colour is never the only cue. */
const AGE_SHADES: Record<AgeBucket, string> = {
  d7: 'bg-danger/30',
  d14: 'bg-danger/55',
  d30: 'bg-danger/80',
  d30plus: 'bg-danger',
}

/**
 * Money from shoppers: figures, the daily income chart and how late the debt is, then two
 * tabs: Toʻlovlar lists every payment and failed card charge, Hisobot the collectors' promises and
 * operators. The work with debtors lives on Qarzdorlar (`/debts`).
 */
export function CollectionsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const clients = clientsStore.useAll()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const merchants = merchantsStore.useAll()
  const [today] = useState(() => new Date())
  const [tab, setTab] = useState<'payments' | 'reports'>('payments')
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))

  // Payments' filters
  const [payQuery, setPayQuery] = useState('')
  const [kind, setKind] = useState<'' | PaymentKind>('')
  const [result, setResult] = useState<'' | 'ok' | 'failed'>('')
  const [payMerchant, setPayMerchant] = useState('')
  const [method, setMethod] = useState<'' | PaymentMethod>('')

  const todayStart = startOfDay(today)
  const bounds = boundsOf(period)
  const inPeriod = (date: Date) => inRange(date, bounds)
  const nasiyas = useMemo(
    () =>
      applications
        .filter((application) => application.status === 'handed' || application.status === 'closed')
        .map((application) => ({
          application,
          progress: progressOf(application, payments, today),
        })),
    [applications, payments, today],
  )
  const open = nasiyas
    .flatMap(({ progress }) => progress.items)
    .filter((item) => item.state !== 'paid')
    .map((item): Expected => ({ date: item.dueDate, amount: item.amount - item.paid }))

  // Debtors: shoppers with a late payment whose day falls in the period
  const debtors = clients
    .map((client) => {
      const own = nasiyas.filter(({ application }) => application.clientId === client.id)
      const late = own.flatMap(({ application, progress }) =>
        progress.items
          .filter((item) => item.state === 'overdue' && inPeriod(item.dueDate))
          .map((item) => ({ ...item, merchantId: application.merchantId })),
      )
      const since = late.reduce<Date | null>(
        (oldest, item) => (!oldest || item.dueDate < oldest ? item.dueDate : oldest),
        null,
      )
      return {
        client,
        overdue: late.reduce((sum, item) => sum + item.amount - item.paid, 0),
        count: late.length,
        days: since ? daysLate(since, today) : 0,
        remaining: own.reduce((sum, { progress }) => sum + progress.remaining, 0),
      }
    })
    .filter((row) => row.overdue > 0)
    .sort((a, b) => b.days - a.days)

  // Figures for the period
  const paid = payments.filter((payment) => !payment.failed && inPeriod(payment.at))
  const dueSoFar = nasiyas
    .flatMap(({ progress }) => progress.items)
    .filter((item) => inPeriod(item.dueDate) && item.dueDate <= today)
  const dueSum = dueSoFar.reduce((sum, item) => sum + item.amount, 0)
  const rate = dueSum
    ? Math.floor(
        (dueSoFar.reduce((sum, item) => sum + Math.min(item.paid, item.amount), 0) / dueSum) * 100,
      )
    : null
  const overdueSum = debtors.reduce((sum, row) => sum + row.overdue, 0)
  const coming = open.filter((item) => item.date >= todayStart && inPeriod(item.date))
  const aging = AGE_BUCKETS.map((bucket) => {
    const rows = debtors.filter((row) => ageBucketOf(row.days) === bucket)
    return { bucket, count: rows.length, sum: rows.reduce((s, row) => s + row.overdue, 0) }
  })
  const buckets = bucketsOf(
    period,
    new Date(2026, 8, 1),
    // All time runs to the last payment still due
    new Date(Math.max(today.getTime(), ...open.map((item) => item.date.getTime()))),
  )

  // Payments table
  const payNeedle = payQuery.trim().toLowerCase()
  const payDigits = payNeedle.replace(/\D/g, '')
  const paymentRows = payments.filter((payment) => {
    const client = clients.find((item) => item.id === payment.clientId)
    return (
      (payNeedle === '' ||
        (!!client && fullName(client).toLowerCase().includes(payNeedle)) ||
        (payDigits.length >= 3 &&
          (payment.applicationId.includes(payDigits) || !!client?.phone.includes(payDigits)))) &&
      (!kind || payment.kind === kind) &&
      (!result || (result === 'failed') === !!payment.failed) &&
      (!payMerchant || payment.merchantId === payMerchant) &&
      (!method || payment.method === method) &&
      inPeriod(payment.at)
    )
  })

  const paymentPager = usePagination(
    paymentRows,
    JSON.stringify([payQuery, kind, result, payMerchant, method, period]),
  )

  const merchantOptions = [
    { value: '', label: t('products.allMerchants') },
    ...merchants.map((item) => ({ value: item.id, label: item.name })),
  ]
  const search = (value: string, onChange: (value: string) => void, placeholder: string) => (
    <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
      <Search size={18} className="shrink-0" />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
      />
    </label>
  )

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.collections')}
        actions={<ExportMenu section="collections" period={period} />}
      />

      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('collections.stat.paid')}
          value={formatSum(paid.reduce((sum, payment) => sum + payment.amount, 0))}
          hint={t('collections.paymentsCount', { count: groupDigits(paid.length) })}
        />
        <StatCard
          label={t('collections.stat.rate')}
          value={rate === null ? '—' : `${rate}%`}
          hint={t(rate === null ? 'collections.stat.rateNone' : 'collections.stat.rateHint')}
        />
        <StatCard
          label={t('client.overdue')}
          value={formatSum(overdueSum)}
          hint={t('collections.stat.debtors', { count: String(debtors.length) })}
        />
        <StatCard
          label={t('collections.chart.expected')}
          value={formatSum(coming.reduce((sum, item) => sum + item.amount, 0))}
          hint={t('collections.paymentsCount', { count: groupDigits(coming.length) })}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <IncomeChart buckets={buckets} payments={payments} expected={open} now={today} />

        <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold">{t('collections.aging.title')}</h2>
            <p className="text-sm text-ink-muted">
              {t('client.overdue')}{' '}
              <span className="font-semibold text-ink tabular-nums">{formatSum(overdueSum)}</span>
            </p>
          </div>
          {overdueSum === 0 ? (
            <p className="text-sm text-ink-muted">{t('collections.aging.none')}</p>
          ) : (
            <>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                {aging
                  .filter((item) => item.sum > 0)
                  .map((item) => (
                    <span
                      key={item.bucket}
                      className={AGE_SHADES[item.bucket]}
                      style={{ flexGrow: item.sum }}
                    />
                  ))}
              </div>
              <ul className="-mx-2 flex flex-col">
                {aging.map((item) => (
                  <li key={item.bucket}>
                    <button
                      type="button"
                      disabled={item.count === 0}
                      onClick={() => navigate(`${ROUTES.debts}?age=${item.bucket}`)}
                      className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-sm hover:bg-surface disabled:hover:bg-transparent"
                    >
                      <span
                        className={cn('size-2.5 shrink-0 rounded-sm', AGE_SHADES[item.bucket])}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="whitespace-nowrap">
                          {t(`collections.aging.${item.bucket}`)}
                        </span>
                        <span className="text-xs whitespace-nowrap text-ink-muted">
                          {t('collections.stat.debtors', { count: String(item.count) })}
                        </span>
                      </span>
                      <span className="text-right font-semibold whitespace-nowrap tabular-nums">
                        {item.sum ? formatSum(item.sum) : '—'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('nav.collections')}
            options={[
              {
                value: 'payments',
                label: t('collections.tab.payments'),
                count: payments.filter((payment) => inPeriod(payment.at)).length,
              },
              { value: 'reports', label: t('collections.tab.reports') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'reports' ? (
          <CollectionReports bounds={bounds} today={today} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 p-4">
              {search(payQuery, setPayQuery, t('collections.search.payments'))}
              <FilterSelect
                label={t('collections.col.kind')}
                options={[
                  { value: '', label: t('payment.kind.all') },
                  ...PAYMENT_KINDS.map((value) => ({
                    value,
                    label: t(`payment.kind.${value}`),
                  })),
                ]}
                value={kind}
                onChange={setKind}
              />
              <FilterSelect
                label={t('merchants.status')}
                options={[
                  { value: '', label: t('payment.state.all') },
                  { value: 'ok', label: t('payment.state.ok') },
                  { value: 'failed', label: t('payment.state.failed') },
                ]}
                value={result}
                onChange={setResult}
              />
              <FilterSelect
                label={t('products.col.merchant')}
                options={merchantOptions}
                value={payMerchant}
                onChange={setPayMerchant}
              />
              <FilterSelect
                label={t('collections.col.method')}
                options={[
                  { value: '', label: t('payment.method.all') },
                  ...PAYMENT_METHODS.map((value) => ({
                    value,
                    label: t(`payment.method.${value}`),
                  })),
                ]}
                value={method}
                onChange={setMethod}
              />
            </div>
            {paymentRows.length === 0 ? (
              <EmptyState title={t('collections.payments.empty')} />
            ) : (
              <>
                <PaymentsTable payments={paymentPager.rows} />
                <Pagination pager={paymentPager} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
