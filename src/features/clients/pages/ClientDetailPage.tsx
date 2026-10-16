import { ArrowLeft, Ban, ShieldCheck, ShieldX } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { applicationStatusTone } from '@/entities/applications/applicationStatus'
import { applicationsStore } from '@/entities/applications/applications'
import { clientStatusTone } from '@/entities/clients/clientStatus'
import { CARD_LOGOS, clientsStore, fullName, initialsOf } from '@/entities/clients/clients'
import { clientStatusOf, debtOf, progressOf } from '@/entities/clients/debt'
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
import { BlockModal, UnblockDialog } from '../components/BlockDialogs'

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
  const [tab, setTab] = useState<'purchases' | 'cards'>('purchases')
  const [blocking, setBlocking] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('client.notFound')} />
      </div>
    )
  }

  const own = applications.filter((application) => application.clientId === client.id)
  const debt = debtOf(client, applications, today)
  const status = clientStatusOf(client, debt.running)
  const expired = !!client.limit && client.limit.validUntil < today

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
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
              ? t('client.overdueDays', { days: String(client.overdueDays) })
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
                { value: 'cards', label: t('client.cards'), count: client.cards.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          {tab === 'cards' ? (
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
                    const progress = progressOf(application, client, today)
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
                [t('client.address'), client.address],
              ]}
            />
          </section>
          <p className="px-1 text-sm text-ink-subtle">{t('client.readOnly')}</p>
        </aside>
      </div>

      {blocking && <BlockModal client={client} onClose={() => setBlocking(false)} />}
      {unblocking && <UnblockDialog client={client} onClose={() => setUnblocking(false)} />}
    </div>
  )
}
