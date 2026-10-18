import { BellRing, Eye, PhoneCall, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsStore } from '@/entities/applications/applications'
import { clientsStore, fullName, initialsOf, type Client } from '@/entities/clients/clients'
import { AGE_BUCKETS, ageBucketOf, debtOf, type AgeBucket } from '@/entities/clients/debt'
import { contactsOf, contactsStore } from '@/entities/collections/contacts'
import {
  PAYMENT_KINDS,
  paymentsStore,
  progressOf,
  type PaymentKind,
} from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { clientPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { addDays, ALL_TIME, inRange, startOfDay, type DateRange } from '@/shared/lib/dates'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
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
import { CallResultModal, ReminderDialog } from '../components/ContactDialogs'
import { DailyIncomeChart, type Expected } from '../components/DailyIncomeChart'
import { PaymentsTable } from '../components/PaymentsTable'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
/** Darker the later; each group also has its name, so colour is never the only cue. */
const AGE_SHADES: Record<AgeBucket, string> = {
  d7: 'bg-danger/30',
  d14: 'bg-danger/55',
  d30: 'bg-danger/80',
  d30plus: 'bg-danger',
}
type ContactFilter = '' | 'none' | 'promised' | 'broken'

/**
 * Money from shoppers: figures, the daily income chart and how late the debt is, then two
 * tabs. Qarzdorlar is where the admin works with debtors (call result, reminder); Toʻlovlar
 * lists every payment and failed card charge.
 */
export function CollectionsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const clients = clientsStore.useAll()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const contacts = contactsStore.useAll()
  const merchants = merchantsStore.useAll()
  const [today] = useState(() => new Date())
  const [tab, setTab] = useState<'debtors' | 'payments'>('debtors')
  const [calling, setCalling] = useState<Client | null>(null)
  const [reminding, setReminding] = useState<Client | null>(null)

  // Debtors' filters
  const [query, setQuery] = useState('')
  const [age, setAge] = useState<'' | AgeBucket>('')
  const [merchant, setMerchant] = useState('')
  const [contactState, setContactState] = useState<ContactFilter>('')
  // Payments' filters
  const [payQuery, setPayQuery] = useState('')
  const [kind, setKind] = useState<'' | PaymentKind>('')
  const [result, setResult] = useState<'' | 'ok' | 'failed'>('')
  const [payMerchant, setPayMerchant] = useState('')
  const [period, setPeriod] = useState<DateRange>(ALL_TIME)

  const todayStart = startOfDay(today)
  const schedules = useMemo(
    () =>
      applications
        .filter((application) => application.status === 'handed')
        .map((application) => progressOf(application, payments, today).items),
    [applications, payments, today],
  )
  const open = schedules
    .flat()
    .filter((item) => item.state !== 'paid')
    .map((item): Expected => ({ date: item.dueDate, amount: item.amount - item.paid }))

  const debtors = clients
    .map((client) => {
      const debt = debtOf(client, applications, payments, today)
      const own = contactsOf(contacts, client.id)
      const lastCall = own.find((contact) => contact.channel === 'call')
      const promise = lastCall?.result === 'promised' ? lastCall.promiseDate : undefined
      const state: ContactFilter = !lastCall
        ? 'none'
        : promise
          ? promise < todayStart
            ? 'broken'
            : 'promised'
          : ''
      return { client, debt, last: own[0], promise, state }
    })
    .filter((row) => row.debt.overdue > 0)
    .sort((a, b) => b.debt.overdueDays - a.debt.overdueDays)

  // Figures
  const inMonth = (date: Date) =>
    date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  const monthPaid = payments.filter((payment) => !payment.failed && inMonth(payment.at))
  const dueSoFar = schedules.flat().filter((item) => inMonth(item.dueDate) && item.dueDate <= today)
  const dueSum = dueSoFar.reduce((sum, item) => sum + item.amount, 0)
  const rate = dueSum
    ? Math.floor((dueSoFar.reduce((sum, item) => sum + item.paid, 0) / dueSum) * 100)
    : 100
  const overdueSum = debtors.reduce((sum, row) => sum + row.debt.overdue, 0)
  const soon = open.filter((item) => item.date > todayStart && item.date <= addDays(today, 30))
  const aging = AGE_BUCKETS.map((bucket) => {
    const rows = debtors.filter((row) => ageBucketOf(row.debt.overdueDays) === bucket)
    return { bucket, count: rows.length, sum: rows.reduce((s, row) => s + row.debt.overdue, 0) }
  })

  // Debtors table
  const needle = query.trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const debtorRows = debtors.filter(
    ({ client, debt, state }) =>
      (needle === '' ||
        fullName(client).toLowerCase().includes(needle) ||
        (digits.length >= 3 && client.phone.includes(digits))) &&
      (!age || ageBucketOf(debt.overdueDays) === age) &&
      (!merchant || debt.lateApplications.some((a) => a.merchantId === merchant)) &&
      (!contactState || state === contactState),
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
      inRange(payment.at, period)
    )
  })

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.collections')} description={t('collections.description')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('collections.stat.month')}
          value={formatSum(monthPaid.reduce((sum, payment) => sum + payment.amount, 0))}
          hint={t('collections.paymentsCount', { count: String(monthPaid.length) })}
        />
        <StatCard
          label={t('collections.stat.rate')}
          value={`${rate}%`}
          hint={t('collections.stat.rateHint')}
        />
        <StatCard
          label={t('client.overdue')}
          value={formatSum(overdueSum)}
          hint={t('collections.stat.debtors', { count: String(debtors.length) })}
        />
        <StatCard
          label={t('collections.stat.upcoming')}
          value={formatSum(soon.reduce((sum, item) => sum + item.amount, 0))}
          hint={t('collections.paymentsCount', { count: String(soon.length) })}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DailyIncomeChart payments={payments} expected={open} today={today} />

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
                      onClick={() => {
                        setTab('debtors')
                        setAge(age === item.bucket ? '' : item.bucket)
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-sm hover:bg-surface disabled:hover:bg-transparent',
                        age === item.bucket && 'bg-surface',
                      )}
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
              { value: 'debtors', label: t('collections.tab.debtors'), count: debtors.length },
              { value: 'payments', label: t('collections.tab.payments'), count: payments.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'debtors' ? (
          <>
            <div className="flex flex-wrap items-center gap-2 p-4">
              {search(query, setQuery, t('collections.search.debtors'))}
              <FilterSelect
                label={t('collections.col.late')}
                options={[
                  { value: '', label: t('collections.aging.all') },
                  ...AGE_BUCKETS.map((value) => ({
                    value,
                    label: t(`collections.aging.${value}`),
                  })),
                ]}
                value={age}
                onChange={setAge}
              />
              <FilterSelect
                label={t('products.col.merchant')}
                options={merchantOptions}
                value={merchant}
                onChange={setMerchant}
              />
              <FilterSelect
                label={t('collections.contact.filter')}
                options={[
                  { value: '', label: t('collections.contact.all') },
                  { value: 'none', label: t('collections.contact.none') },
                  { value: 'promised', label: t('collections.contact.promised') },
                  { value: 'broken', label: t('collections.contact.broken') },
                ]}
                value={contactState}
                onChange={setContactState}
              />
            </div>
            {debtorRows.length === 0 ? (
              <EmptyState title={t('collections.debtors.empty')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-t border-line">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={th}>{t('applications.col.client')}</th>
                      <th className={`${th} text-right`}>{t('client.overdue')}</th>
                      <th className={th}>{t('collections.col.late')}</th>
                      <th className={`${th} text-right`}>{t('clients.col.debt')}</th>
                      <th className={th}>{t('collections.col.lastContact')}</th>
                      <th className={th}>{t('collections.col.promise')}</th>
                      <th className="w-32" />
                    </tr>
                  </thead>
                  <tbody>
                    {debtorRows.map(({ client, debt, last, promise, state }) => (
                      <tr
                        key={client.id}
                        onClick={() => navigate(`${clientPath(client.id)}?tab=contacts`)}
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
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col">
                            <span className="font-semibold whitespace-nowrap text-danger tabular-nums">
                              {formatSum(debt.overdue)}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {t('collections.paymentsCount', {
                                count: String(debt.overdueCount),
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={debt.overdueDays > 7 ? 'danger' : 'warning'}>
                            {t('collections.days', { days: String(debt.overdueDays) })}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                          {formatSum(debt.remaining)}
                        </td>
                        <td className="px-4 py-3">
                          {last ? (
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {last.channel === 'call'
                                  ? t(`contact.result.${last.result ?? 'noAnswer'}`)
                                  : t('contact.reminded')}
                              </span>
                              <span className="text-xs text-ink-muted tabular-nums">
                                {formatDate(last.at)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-ink-subtle">
                              {t('collections.contact.none')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {promise ? (
                            <span
                              className={cn(
                                'text-sm font-medium whitespace-nowrap tabular-nums',
                                state === 'broken' ? 'text-danger' : 'text-success',
                              )}
                            >
                              {formatDate(promise)}
                              {state === 'broken' && (
                                <span className="block text-xs font-normal">
                                  {t('collections.contact.broken')}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-ink-subtle">—</span>
                          )}
                        </td>
                        <td className="pr-3">
                          <RowActions
                            actions={[
                              {
                                icon: Eye,
                                label: t('common.view'),
                                onClick: () => navigate(`${clientPath(client.id)}?tab=contacts`),
                              },
                              {
                                icon: PhoneCall,
                                label: t('contact.call'),
                                onClick: () => setCalling(client),
                              },
                              {
                                icon: BellRing,
                                label: t('contact.remind'),
                                onClick: () => setReminding(client),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
              <DateRangePicker
                label={t('applications.period')}
                value={period}
                onChange={setPeriod}
              />
            </div>
            {paymentRows.length === 0 ? (
              <EmptyState title={t('collections.payments.empty')} />
            ) : (
              <>
                <PaymentsTable payments={paymentRows} />
                <p className="border-t border-line px-4 py-3 text-right text-sm text-ink-muted">
                  {t('collections.paymentsCount', { count: groupDigits(paymentRows.length) })} ·{' '}
                  <span className="font-semibold text-ink tabular-nums">
                    {formatSum(
                      paymentRows
                        .filter((payment) => !payment.failed)
                        .reduce((sum, payment) => sum + payment.amount, 0),
                    )}
                  </span>
                </p>
              </>
            )}
          </>
        )}
      </div>

      {calling && <CallResultModal client={calling} onClose={() => setCalling(null)} />}
      {reminding && (
        <ReminderDialog
          client={reminding}
          overdue={debtors.find((row) => row.client.id === reminding.id)?.debt.overdue ?? 0}
          days={debtors.find((row) => row.client.id === reminding.id)?.debt.overdueDays ?? 0}
          onClose={() => setReminding(null)}
        />
      )}
    </div>
  )
}
