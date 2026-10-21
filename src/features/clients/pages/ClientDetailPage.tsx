import {
  ArrowLeft,
  Ban,
  BellRing,
  CircleAlert,
  CreditCard,
  PhoneCall,
  Plus,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { applicationStatusTone } from '@/entities/applications/applicationStatus'
import { applicationsStore } from '@/entities/applications/applications'
import { clientStatusTone } from '@/entities/clients/clientStatus'
import { CARD_LOGOS, clientsStore, fullName, initialsOf } from '@/entities/clients/clients'
import { clientStatusOf, debtOf } from '@/entities/clients/debt'
import { limitHistoryOf, limitsStore } from '@/entities/clients/limits'
import { contactsOf, contactsStore } from '@/entities/collections/contacts'
import { paymentsStore, progressOf } from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { applicationPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { PersonContacts } from '../components/PersonContacts'
import { CallResultModal, ReminderDialog } from '@/features/collections/components/ContactDialogs'
import { ContactLog } from '@/features/collections/components/ContactLog'
import { ChargeModal, ManualPaymentModal } from '@/features/collections/components/PaymentDialogs'
import { PaymentsTable } from '@/features/collections/components/PaymentsTable'
import { BlockModal, UnblockDialog } from '../components/BlockDialogs'
import { LimitModal, RecalculateDialog } from '../components/LimitDialogs'

const TABS = ['purchases', 'payments', 'contacts', 'cards', 'limit'] as const
type Tab = (typeof TABS)[number]

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium break-words tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * One shopper: their MyID details and limit, their money with Birzum, every purchase and card.
 * The only thing the admin changes here is the block.
 */
export function ClientDetailPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const client = clientsStore.useAll().find((item) => item.id === id)
  const applications = applicationsStore.useAll()
  const merchants = merchantsStore.useAll()
  const payments = paymentsStore.useAll()
  const contacts = contactsStore.useAll()
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.find((item) => item === params.get('tab')) ?? 'purchases'
  const setTab = (next: Tab) =>
    setParams(next === 'purchases' ? {} : { tab: next }, { replace: true })
  const [calling, setCalling] = useState(false)
  const [reminding, setReminding] = useState(false)
  const [charging, setCharging] = useState(false)
  const [entering, setEntering] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [editingLimit, setEditingLimit] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const limits = limitsStore.useAll()
  const [today] = useState(() => new Date())

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.customers)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.customers')}
    </button>
  )

  if (!client) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('client.notFound')} />
      </div>
    )
  }

  const own = applications.filter((application) => application.clientId === client.id)
  const debt = debtOf(client, applications, payments, today)
  const status = clientStatusOf(client, debt)
  const ownPayments = payments.filter((payment) => payment.clientId === client.id)
  const ownContacts = contactsOf(contacts, client.id)
  const expired = !!client.limit && client.limit.validUntil < today
  const limitHistory = limitHistoryOf(limits, client.id)
  // What the running nasiyalar take out of the limit, and what is left for new ones
  const used = Math.min(debt.remaining, client.limit?.amount ?? 0)
  const free = Math.max(0, (client.limit?.amount ?? 0) - debt.remaining)

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-wrap items-center gap-5">
        <Avatar initials={initialsOf(client)} photoUrl={client.photoUrl} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">
              {client.lastName} {client.firstName} {client.middleName}
            </h1>
            <StatusBadge tone={clientStatusTone[status]}>
              {t(`client.status.${status}`)}
            </StatusBadge>
          </div>
          <p className="text-ink-muted tabular-nums">
            {formatPhone(client.phone)} ·{' '}
            {t('client.since', { date: formatDate(client.registeredAt) })}
          </p>
        </div>
        {debt.running > 0 && (
          <Button size="sm" variant="secondary" onClick={() => setEntering(true)}>
            <Plus size={18} />
            {t('manual.title')}
          </Button>
        )}
        {client.block ? (
          <Button size="sm" variant="secondary" onClick={() => setUnblocking(true)}>
            <ShieldCheck size={18} />
            {t('client.unblock')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger!"
            onClick={() => setBlocking(true)}
          >
            <Ban size={18} />
            {t('client.block')}
          </Button>
        )}
      </div>

      {client.block && (
        <div className="flex gap-3 rounded-card bg-danger-soft p-4 text-danger">
          <ShieldX size={22} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">
              {t('client.blockedBecause', {
                reason: t(`client.block.reason.${client.block.reason}`),
              })}
            </p>
            <p className="text-sm">{client.block.comment}</p>
            <p className="text-sm opacity-80">
              {formatDateTime(client.block.at)} · {client.block.by}
            </p>
          </div>
        </div>
      )}

      {debt.overdue > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-danger-soft p-4">
          <CircleAlert size={22} className="shrink-0 text-danger" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-danger">
            <p className="font-bold tabular-nums">
              {t('client.overdueBanner', { sum: formatSum(debt.overdue) })}
            </p>
            <p className="text-sm">
              {t('collections.paymentsCount', { count: String(debt.overdueCount) })} ·{' '}
              {t('client.overdueDays', { days: String(debt.overdueDays) })}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-canvas!"
            onClick={() => setCalling(true)}
          >
            <PhoneCall size={18} />
            {t('contact.call')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-canvas!"
            onClick={() => setReminding(true)}
          >
            <BellRing size={18} />
            {t('contact.remind')}
          </Button>
          <Button size="sm" onClick={() => setCharging(true)}>
            <CreditCard size={18} />
            {t('charge.title')}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('client.limit')}
          value={client.limit ? formatSum(client.limit.amount) : '—'}
          hint={
            client.limit
              ? expired
                ? t('clients.limit.expired')
                : t('client.limit.until', { date: formatDate(client.limit.validUntil) })
              : t('clients.limit.none')
          }
        />
        <StatCard
          label={t('clients.col.nasiya')}
          value={String(debt.running)}
          hint={t('client.purchases.count', { count: String(own.length) })}
        />
        <StatCard
          label={t('clients.col.debt')}
          value={formatSum(debt.remaining)}
          hint={debt.next ? t('client.next', { date: formatDate(debt.next) }) : undefined}
        />
        <StatCard
          label={t('client.overdue')}
          value={formatSum(debt.overdue)}
          hint={
            debt.overdue > 0
              ? t('client.overdueDays', { days: String(debt.overdueDays) })
              : t('client.onTime')
          }
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col rounded-card border border-line bg-canvas">
          <div className="px-5 pt-2">
            <UnderlineTabs
              label={fullName(client)}
              options={[
                { value: 'purchases', label: t('client.purchases'), count: own.length },
                {
                  value: 'payments',
                  label: t('collections.tab.payments'),
                  count: ownPayments.length,
                },
                { value: 'contacts', label: t('client.contacts'), count: ownContacts.length },
                { value: 'cards', label: t('client.cards'), count: client.cards.length },
                { value: 'limit', label: t('limit.history'), count: limitHistory.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          {tab === 'payments' ? (
            ownPayments.length === 0 ? (
              <EmptyState title={t('collections.payments.empty')} />
            ) : (
              <PaymentsTable payments={ownPayments} showClient={false} />
            )
          ) : tab === 'contacts' ? (
            <ContactLog contacts={ownContacts} today={today} owing={debt.overdue > 0} />
          ) : tab === 'limit' ? (
            limitHistory.length === 0 ? (
              <EmptyState title={t('limit.history.empty')} />
            ) : (
              <ul className="flex flex-col border-t border-line">
                {limitHistory.map((change) => (
                  <li
                    key={change.id}
                    className="flex flex-wrap items-start gap-x-6 gap-y-1 border-b border-line px-5 py-4 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="font-semibold tabular-nums">
                        {change.from === null
                          ? formatSum(change.to)
                          : `${formatSum(change.from)} → ${formatSum(change.to)}`}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {change.source === 'scoring'
                          ? t('limit.source.scoring')
                          : `${change.by} · ${t(`limit.reason.${change.reason!}`)}`}
                        {' · '}
                        {t('client.limit.until', { date: formatDate(change.validUntil) })}
                      </p>
                      {change.comment && <p className="text-sm">{change.comment}</p>}
                    </div>
                    <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                      {formatDateTime(change.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : tab === 'cards' ? (
            <ul className="flex flex-col gap-3 p-5">
              {client.cards.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 rounded-control border border-line p-4"
                >
                  <img
                    src={CARD_LOGOS[item.brand]}
                    alt={item.brand}
                    className="h-8 w-12 rounded-md object-contain"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-semibold tabular-nums">•••• {item.last4}</p>
                    <p className="text-sm text-ink-muted">
                      {t('client.card.expiry', { date: item.expiry })}
                    </p>
                  </div>
                  <span className="text-sm text-ink-muted uppercase">{item.brand}</span>
                </li>
              ))}
            </ul>
          ) : own.length === 0 ? (
            <EmptyState title={t('client.purchases.empty')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('payout.col.ariza')}</th>
                    <th className={th}>{t('products.col.product')}</th>
                    <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                    <th className={`${th} text-right`}>{t('client.col.paid')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {own.map((application) => {
                    const progress = progressOf(application, payments, today)
                    const merchant = merchants.find((item) => item.id === application.merchantId)
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
                            <span className="text-sm text-ink-muted tabular-nums">
                              {formatDate(application.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-56 px-4 py-3">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm">{application.lines[0].name}</span>
                            <span className="truncate text-sm text-ink-muted">
                              {merchant?.name}
                            </span>
                          </div>
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
                        <td className="px-4 py-3 text-right text-sm tabular-nums">
                          {application.status === 'handed' || application.status === 'closed'
                            ? `${progress.paid} / ${application.term}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={applicationStatusTone[application.status]}>
                            {t(`application.status.${application.status}`)}
                          </StatusBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className={card}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-bold">{t('client.limit')}</h2>
              {client.limit && (
                <span className={expired ? 'text-sm text-danger' : 'text-sm text-ink-muted'}>
                  {expired
                    ? t('clients.limit.expired')
                    : t('client.limit.until', { date: formatDate(client.limit.validUntil) })}
                </span>
              )}
            </div>
            {client.limit ? (
              <>
                <p className="text-2xl font-bold tabular-nums">{formatSum(client.limit.amount)}</p>
                <div className="flex flex-col gap-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(used / client.limit.amount) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-ink-muted tabular-nums">
                    <span>{t('limit.used', { sum: formatSum(used) })}</span>
                    <span>{t('limit.free', { sum: formatSum(free) })}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted">{t('clients.limit.none')}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => setEditingLimit(true)}
              >
                {t('limit.edit')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1"
                onClick={() => setRecalculating(true)}
              >
                {t('limit.recalc')}
              </Button>
            </div>
          </section>
          <section className={card}>
            <h2 className="font-bold">{t('people.title')}</h2>
            <PersonContacts contacts={client.contacts} />
          </section>
          <section className={card}>
            <h2 className="font-bold">{t('client.myid')}</h2>
            <Rows
              rows={[
                [t('client.lastName'), client.lastName],
                [t('client.firstName'), client.firstName],
                [t('client.middleName'), client.middleName],
                [t('client.birthDate'), formatDate(client.birthDate)],
                [t('application.pinfl'), client.pinfl],
                [t('client.passport'), client.passport],
                [t('client.passportUntil'), formatDate(client.passportExpiresOn)],
                [t('client.propiska'), client.address],
              ]}
            />
          </section>
          <p className="px-1 text-sm text-ink-subtle">{t('client.readOnly')}</p>
        </aside>
      </div>

      {editingLimit && <LimitModal client={client} onClose={() => setEditingLimit(false)} />}
      {recalculating && (
        <RecalculateDialog client={client} onClose={() => setRecalculating(false)} />
      )}
      {blocking && <BlockModal client={client} onClose={() => setBlocking(false)} />}
      {unblocking && <UnblockDialog client={client} onClose={() => setUnblocking(false)} />}
      {charging && <ChargeModal client={client} onClose={() => setCharging(false)} />}
      {entering && <ManualPaymentModal client={client} onClose={() => setEntering(false)} />}
      {calling && <CallResultModal client={client} onClose={() => setCalling(false)} />}
      {reminding && (
        <ReminderDialog
          client={client}
          overdue={debt.overdue}
          days={debt.overdueDays}
          onClose={() => setReminding(false)}
        />
      )}
    </div>
  )
}
