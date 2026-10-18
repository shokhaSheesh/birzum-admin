import { ChevronRight } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { loanApplicationsStore, type LoanApplication } from '@/entities/microloans/applications'
import { loanClientsStore } from '@/entities/microloans/loanClients'
import { paymentsOf } from '@/entities/microloans/loanPayments'
import { lateOf, loansStore, progressOf } from '@/entities/microloans/loans'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { changeOf, compactSum, previousOf } from '@/shared/lib/chartAxis'
import { inRange, type DateRange } from '@/shared/lib/dates'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { boundsOf, bucketsOf, thisMonth, type Period } from '@/shared/lib/period'
import { BarList } from '@/shared/ui/charts/BarList'
import { ColumnChart } from '@/shared/ui/charts/ColumnChart'
import { KpiTile } from '@/shared/ui/charts/KpiTile'
import { LineChart } from '@/shared/ui/charts/LineChart'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'

const card = 'flex min-w-0 flex-col gap-5 rounded-card border border-line bg-canvas p-5'

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {note && <span className="text-sm text-ink-subtle">{note}</span>}
      </div>
      {children}
    </section>
  )
}

/** Statuses an ariza reaches once the decision is "yes". */
const SAID_YES: LoanApplication['status'][] = [
  'approved',
  'counter',
  'signed',
  'paidOut',
  'expired',
]
/** Who made the decision: the app's rules or an admin. Undecided arizalar have neither. */
const decidedBy = (app: LoanApplication) => {
  const decision = app.history.find((event) =>
    ['approved', 'counter', 'declined'].includes(event.status),
  )
  return !decision ? null : decision.by === 'rules' ? 'rules' : 'admin'
}

/**
 * A microloan brand at a glance for one period: four figures with their change, money paid out
 * against money collected, how arizalar went and who decided them, products, decline reasons and
 * terms, and the loan book as it stands today.
 */
export function LoanDashboardPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const apps = loanApplicationsStore.useAll().filter((app) => app.brand === brand)
  const loans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const clients = loanClientsStore.useAll().filter((client) => client.brand === brand)
  const products = loanProductsStore.useAll()
  const [now] = useState(() => new Date())
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const bounds = boundsOf(period)
  const previous = previousOf(period, now)
  const before = previous?.range ?? null
  const unit = (key: 'mln' | 'mlrd', n: string) => t(`unit.${key}`, { n })

  const payments = useMemo(() => paymentsOf(loans).filter((payment) => payment.ok), [loans])
  // The first day with sample data: the oldest loan or ariza
  const firstDay = useMemo(
    () =>
      new Date(
        Math.min(
          ...loans.map((loan) => loan.issuedAt.getTime()),
          ...apps.map((app) => app.createdAt.getTime()),
        ),
      ),
    [loans, apps],
  )
  const issuedIn = (range: DateRange) => loans.filter((loan) => inRange(loan.issuedAt, range))
  const paidIn = (range: DateRange) => payments.filter((payment) => inRange(payment.at, range))
  const createdIn = (range: DateRange) => apps.filter((app) => inRange(app.createdAt, range))
  const joinedIn = (range: DateRange) =>
    clients.filter((client) => inRange(client.registeredAt, range))
  const lent = (list: typeof loans) => list.reduce((sum, loan) => sum + loan.amount, 0)
  const collected = (list: typeof payments) => list.reduce((sum, item) => sum + item.amount, 0)

  const issued = issuedIn(bounds)
  const paid = paidIn(bounds)
  const created = createdIn(bounds)
  const joined = joinedIn(bounds)
  const compare = (value: number, of: (range: DateRange) => number) =>
    before ? changeOf(value, of(before)) : null
  const changeLabel = t(
    previous?.partial ? `dashboard.vsSoFar.${period.unit}` : `dashboard.vs.${period.unit}`,
  )
  const noCompare = t(period.unit === 'all' ? 'mlDash.noCompare.all' : 'dashboard.noCompare')

  const buckets = bucketsOf(period, firstDay, now)
  const series = (of: (range: DateRange) => number) =>
    buckets.map((bucket) =>
      bucket.start > now || bucket.end <= firstDay
        ? null
        : of({ from: bucket.start, to: new Date(bucket.end.getTime() - 1) }),
    )

  // How the period's arizalar went
  const funnel = [
    { key: 'sent' as const, value: created.length },
    { key: 'approved' as const, value: created.filter((a) => SAID_YES.includes(a.status)).length },
    { key: 'paidOut' as const, value: created.filter((a) => a.status === 'paidOut').length },
  ]
  const sideCounts = [
    {
      key: 'waiting' as const,
      value: created.filter((a) => a.status === 'review' || a.status === 'manual').length,
    },
    { key: 'declined' as const, value: created.filter((a) => a.status === 'declined').length },
    { key: 'expired' as const, value: created.filter((a) => a.status === 'expired').length },
  ]
  const byRules = created.filter((a) => decidedBy(a) === 'rules').length
  const byAdmin = created.filter((a) => decidedBy(a) === 'admin').length
  const autoShare = byRules + byAdmin ? Math.round((byRules / (byRules + byAdmin)) * 100) : null

  const byProduct = products
    .filter((product) => product.brand === brand)
    .map((product) => {
      const own = issued.filter((loan) => loan.productId === product.id)
      return { product, sum: lent(own), count: own.length }
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.sum - a.sum)
  const reasons = new Map<string, number>()
  for (const app of created)
    if (app.decline) reasons.set(app.decline.reason, (reasons.get(app.decline.reason) ?? 0) + 1)
  const terms = [...new Set(issued.map((loan) => loan.term))].sort((a, b) => a - b)

  // The loan book today, whatever the period
  const open = loans.filter((loan) => !loan.closedAt)
  const leftOf = (list: typeof loans) =>
    list.reduce((sum, loan) => sum + progressOf(loan).principalLeft, 0)
  const outstanding = leftOf(open)
  const lateLoans = open.filter((loan) => loan.overdueSince)
  const lateLeft = leftOf(lateLoans)
  const overdue = lateLoans.reduce((sum, loan) => sum + lateOf(loan, now).amount, 0)
  const par = outstanding ? (lateLeft / outstanding) * 100 : 0

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.dashboard')} />
      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={t('mlDash.kpi.lent')}
          value={compactSum(lent(issued), unit)}
          change={compare(lent(issued), (r) => lent(issuedIn(r)))}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('collections.chart.collected')}
          value={compactSum(collected(paid), unit)}
          change={compare(collected(paid), (r) => collected(paidIn(r)))}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('nav.applications')}
          value={groupDigits(created.length)}
          change={compare(created.length, (r) => createdIn(r).length)}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
        <KpiTile
          label={t('mlDash.kpi.signedUp')}
          value={groupDigits(joined.length)}
          change={compare(joined.length, (r) => joinedIn(r).length)}
          changeLabel={changeLabel}
          noCompare={noCompare}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title={t('mlDash.chart.title')}>
          <LineChart
            label={t('mlDash.chart.title')}
            buckets={buckets}
            now={now}
            series={[
              {
                key: 'lent',
                label: t('mlDash.kpi.lent'),
                color: 'var(--color-brand)',
                values: series((range) => lent(issuedIn(range))),
                area: true,
              },
              {
                key: 'paid',
                label: t('collections.chart.collected'),
                color: 'var(--color-green-600)',
                values: series((range) => collected(paidIn(range))),
              },
            ]}
          />
        </Card>

        <Card title={t('dashboard.funnel.title')}>
          <ol className="flex flex-col gap-3">
            {funnel.map((step, i) => {
              const share = funnel[0].value ? (step.value / funnel[0].value) * 100 : 0
              return (
                <li key={step.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{t(`mlDash.funnel.${step.key}`)}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold">{groupDigits(step.value)}</span>
                      {i > 0 && (
                        <span className="ml-1.5 text-ink-subtle">{Math.round(share)}%</span>
                      )}
                    </span>
                  </div>
                  <div className="h-8 rounded-control bg-surface">
                    <div
                      className="h-full rounded-control bg-brand transition-[width]"
                      style={{
                        width: `${Math.max(step.value ? 2 : 0, share)}%`,
                        opacity: 1 - i * 0.22,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
          <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4">
            {sideCounts.map((item) => (
              <div key={item.key} className="flex flex-col gap-0.5">
                <dt className="text-xs text-ink-muted">{t(`mlDash.funnel.${item.key}`)}</dt>
                <dd className="text-lg font-bold tabular-nums">{groupDigits(item.value)}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{t('mlDash.auto')}</span>
              <span className="font-semibold tabular-nums">
                {autoShare === null ? '—' : `${autoShare}%`}
              </span>
            </div>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
              <span className="bg-brand" style={{ flexGrow: byRules }} />
              <span className="bg-warning" style={{ flexGrow: byAdmin }} />
            </div>
            <p className="text-xs text-ink-muted">
              {t('mlDash.auto.hint', {
                rules: groupDigits(byRules),
                admin: groupDigits(byAdmin),
              })}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title={t('nav.products')}>
          <BarList
            empty={t('mlDash.empty')}
            items={byProduct.map(({ product, sum, count }) => ({
              key: product.id,
              label: product.name,
              value: sum,
              valueLabel: compactSum(sum, unit),
              sub: t('mlDash.loansCount', { count: groupDigits(count) }),
            }))}
          />
        </Card>
        <Card title={t('mlDash.reasons')}>
          <BarList
            empty={t('mlDash.reasons.empty')}
            items={[...reasons.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => ({
                key: reason,
                label: t(`loanDecline.${reason as 'income'}`),
                value: count,
                valueLabel: groupDigits(count),
              }))}
          />
        </Card>
        <Card title={t('dashboard.terms.title')} note={t('mlDash.terms.note')}>
          <ColumnChart
            columns={terms.map((term) => {
              const count = issued.filter((loan) => loan.term === term).length
              return {
                key: String(term),
                label: t('term.months', { count: String(term) }),
                value: count,
                tip: `${t('term.months', { count: String(term) })}: ${t('mlDash.loansCount', { count: String(count) })}`,
              }
            })}
          />
        </Card>
      </div>

      <Card title={t('mlDash.book')} note={t('dashboard.portfolio.note')}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-ink-muted">{t('mlDash.book.outstanding')}</span>
            <span className="text-4xl font-bold [font-variant-numeric:normal]">
              {formatSum(outstanding)}
            </span>
            <span className="text-sm text-ink-muted">
              {t('mlDash.book.outstanding.hint', { count: groupDigits(open.length) })}
            </span>
          </div>
          <Link
            to={brandPath(brand, 'overdue')}
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            {t('nav.overdue')}
            <ChevronRight size={16} />
          </Link>
        </div>
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          <span className="bg-green-500" style={{ flexGrow: outstanding - lateLeft }} />
          <span className="bg-danger" style={{ flexGrow: lateLeft }} />
        </div>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                swatch: 'bg-green-500',
                label: t('dashboard.portfolio.onTime'),
                value: formatSum(outstanding - lateLeft),
                hint: t('mlDash.book.onTime.hint', {
                  count: groupDigits(open.length - lateLoans.length),
                }),
              },
              {
                swatch: 'bg-danger',
                label: t('mlDash.book.late'),
                value: formatSum(lateLeft),
                hint: t('mlDash.book.late.hint', { count: groupDigits(lateLoans.length) }),
              },
              {
                swatch: null,
                label: t('dashboard.portfolio.overdue'),
                value: formatSum(overdue),
                hint: t('dashboard.portfolio.overdue.hint'),
              },
              {
                swatch: null,
                label: t('dashboard.portfolio.par'),
                value: `${par.toFixed(1).replace('.', ',')}%`,
                hint: t('mlDash.book.par.hint'),
              },
            ] as const
          ).map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="flex items-center gap-2 text-sm text-ink-muted">
                {item.swatch && <span className={`size-2.5 shrink-0 rounded-sm ${item.swatch}`} />}
                {item.label}
              </dt>
              <dd className="text-lg font-bold tabular-nums">{item.value}</dd>
              <dd className="text-sm text-ink-subtle">{item.hint}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
