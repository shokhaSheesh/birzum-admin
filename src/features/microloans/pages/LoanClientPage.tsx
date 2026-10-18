import { ArrowLeft, Ban, ChevronRight, LockOpen, ShieldCheck, Smartphone } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { loanApplicationsStore, loanAppStatusTone, sumOf } from '@/entities/microloans/applications'
import { loanClientsStore, segmentOf, segmentTone } from '@/entities/microloans/loanClients'
import {
  cardText,
  lateOf,
  loansStore,
  loanStateTone,
  progressOf,
  stateOf,
} from '@/entities/microloans/loans'
import { loanProductsStore } from '@/entities/microloans/products'
import { brandLoanPath, brandPath, loanAppPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { LoanClientBlockModal, LoanClientUnblockDialog } from '../components/LoanClientBlockDialogs'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

/** Label and value rows inside a card. */
function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium break-words tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * One client of a microloan brand: who they are (from MyID), how they use the app, their cards,
 * every ariza and loan with what is left and what is late. The only thing the admin changes here
 * is the block.
 */
export function LoanClientPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const client = loanClientsStore.useAll().find((item) => item.id === id && item.brand === brand)
  const allApps = loanApplicationsStore.useAll().filter((app) => app.brand === brand)
  const allLoans = loansStore.useAll().filter((loan) => loan.brand === brand)
  const products = loanProductsStore.useAll()
  const [today] = useState(() => new Date())
  const [blocking, setBlocking] = useState(false)
  const [unblocking, setUnblocking] = useState(false)

  const back = (
    <button
      type="button"
      onClick={() => navigate(brandPath(brand, 'customers'))}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.borrowers')}
    </button>
  )
  if (!client) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('mlClients.notFound')} />
      </div>
    )
  }

  const apps = allApps.filter((app) => app.borrower.passport === client.passport)
  const loans = allLoans.filter((loan) => loan.borrower.passport === client.passport)
  const segment = segmentOf(client, allApps, allLoans)
  const open = loans.filter((loan) => !loan.closedAt)
  const productName = (pid: string) => products.find((p) => p.id === pid)?.name ?? '—'
  // Cards the client's loans were paid to or taken from
  const cards = [...new Map(loans.map((loan) => [loan.card.last4, loan.card])).values()]

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <StatusBadge tone={client.block ? 'danger' : segmentTone[segment]}>
              {client.block ? t('mlClients.access.blocked') : t(`mlClients.segment.${segment}`)}
            </StatusBadge>
          </div>
          <p className="text-ink-muted tabular-nums">
            {formatPhone(client.phone)} ·{' '}
            {t('mlClients.since', { date: formatDate(client.registeredAt) })}
          </p>
        </div>
        {client.block ? (
          <Button size="sm" variant="secondary" onClick={() => setUnblocking(true)}>
            <LockOpen size={18} />
            {t('client.unblock')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
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
          <Ban size={22} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">
              {t('client.blockedBecause', {
                reason: t(`client.block.reason.${client.block.reason}`),
              })}
            </p>
            <p className="text-sm">{client.block.comment}</p>
            <p className="text-xs opacity-80">
              {formatDateTime(client.block.at)} · {client.block.by}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('mlClients.stat.taken')}
          value={formatSum(loans.reduce((sum, loan) => sum + loan.amount, 0))}
          hint={t('mlClients.loansCount', {
            open: String(open.length),
            total: String(loans.length),
          })}
        />
        <StatCard
          label={t('loan.principalLeft')}
          value={formatSum(open.reduce((sum, loan) => sum + progressOf(loan).principalLeft, 0))}
          hint={t('mlClients.stat.now')}
        />
        <StatCard
          label={t('overdue.col.amount')}
          value={formatSum(open.reduce((sum, loan) => sum + lateOf(loan, today).amount, 0))}
          hint={t('mlClients.stat.now')}
        />
        <StatCard
          label={t('nav.applications')}
          value={String(apps.length)}
          hint={t('loanApps.stat.countHint', {
            count: String(apps.filter((app) => app.status === 'declined').length),
          })}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <h2 className="p-5 pb-3 text-lg font-bold">{t('nav.loans')}</h2>
            {loans.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink-muted">{t('mlClients.noLoans')}</p>
            ) : (
              <ul className="flex flex-col border-t border-line">
                {loans.map((loan) => {
                  const state = stateOf(loan)
                  const { principalLeft, paid, total } = progressOf(loan)
                  return (
                    <li key={loan.id} className="border-b border-line last:border-b-0">
                      <Link
                        to={brandLoanPath(brand, loan.id)}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/60"
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="font-semibold tabular-nums">{loan.number}</span>
                          <span className="text-sm text-ink-muted">
                            {productName(loan.productId)} · {formatSum(loan.amount)} ·{' '}
                            {formatDate(loan.issuedAt)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end text-sm tabular-nums">
                          <span className="font-semibold">
                            {state === 'closed' ? '—' : formatSum(principalLeft)}
                          </span>
                          <span className="text-ink-muted">
                            {t('loans.paidOf', { paid: String(paid), total: String(total) })}
                          </span>
                        </div>
                        <StatusBadge tone={loanStateTone[state]}>
                          {t(`loan.state.${state}`)}
                        </StatusBadge>
                        <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <h2 className="p-5 pb-3 text-lg font-bold">{t('nav.applications')}</h2>
            {apps.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink-muted">{t('mlClients.noApps')}</p>
            ) : (
              <ul className="flex flex-col border-t border-line">
                {apps.map((app) => (
                  <li key={app.id} className="border-b border-line last:border-b-0">
                    <Link
                      to={loanAppPath(brand, app.id)}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/60"
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold tabular-nums">
                          {t('application.title', { number: groupDigits(app.number) })}
                        </span>
                        <span className="text-sm text-ink-muted">
                          {productName(app.productId)} · {formatSum(sumOf(app))} ·{' '}
                          {formatDateTime(app.createdAt)}
                        </span>
                      </div>
                      <StatusBadge tone={loanAppStatusTone[app.status]}>
                        {t(`loanApp.status.${app.status}`)}
                      </StatusBadge>
                      <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className={card}>
            <h2 className="flex items-center gap-2 font-bold">
              <ShieldCheck size={18} className="text-success" />
              {t('mlClients.myid')}
            </h2>
            <Rows
              rows={[
                [t('merchant.owner'), client.name],
                [
                  t('loanApp.passport'),
                  `${client.passport.slice(0, 2)} ${client.passport.slice(2)}`,
                ],
                [t('loanApp.birthDate'), client.birthDate],
                [t('mlClients.address'), client.address],
              ]}
            />
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 font-bold">
              <Smartphone size={18} className="text-brand" />
              {t('mlClients.app')}
            </h2>
            <Rows
              rows={[
                [t('merchant.phone'), formatPhone(client.phone)],
                ...client.phoneHistory.map((old): [string, ReactNode] => [
                  t('mlClients.oldPhone'),
                  t('mlClients.oldPhone.until', {
                    phone: formatPhone(old.phone),
                    date: formatDate(old.until),
                  }),
                ]),
                [
                  t('mlClients.device'),
                  `${client.device.os === 'ios' ? 'iOS' : 'Android'} · ${client.device.app}`,
                ],
                [t('mlClients.lastSeen'), formatDateTime(client.lastSeenAt)],
                [t('mlClients.cards'), cards.length ? cards.map(cardText).join(', ') : '—'],
              ]}
            />
          </section>
        </aside>
      </div>

      {blocking && <LoanClientBlockModal client={client} onClose={() => setBlocking(false)} />}
      {unblocking && (
        <LoanClientUnblockDialog client={client} onClose={() => setUnblocking(false)} />
      )}
    </div>
  )
}
