import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  isOffer,
  loanApplicationsStore,
  loanAppStatusTone,
  monthlyOfApp,
  type LoanAppEvent,
} from '@/entities/microloans/applications'
import { loanProductsStore } from '@/entities/microloans/products'
import { decisionRulesStore } from '@/entities/microloans/rules'
import { brandClientPath, brandLoanPath, brandPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

/** Label and value rows inside a card. */
function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium break-words tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** One of the app's checks: what it looked at and whether it passed. */
function Check({
  ok,
  warn,
  title,
  detail,
}: {
  ok: boolean
  warn?: boolean
  title: string
  detail: string
}) {
  const Icon: LucideIcon = ok ? CircleCheck : warn ? CircleAlert : CircleX
  return (
    <li className="flex items-start gap-3">
      <Icon
        size={20}
        className={cn(
          'mt-0.5 shrink-0',
          ok ? 'text-success' : warn ? 'text-warning' : 'text-danger',
        )}
      />
      <div className="flex flex-col">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-ink-muted">{detail}</span>
      </div>
    </li>
  )
}

/**
 * One microloan ariza: the terms asked for and offered, the borrower and what they told the app,
 * the app's three checks, and every step so far. When the rules left it to a person, the card on
 * the right decides it: approve, offer a smaller sum, or decline.
 */
export function LoanApplicationPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const app = loanApplicationsStore.useAll().find((item) => item.id === id && item.brand === brand)
  const product = loanProductsStore.useAll().find((p) => p.id === app?.productId)
  // The limits come from Qaror qoidalari
  const rules = decisionRulesStore.useAll().find((item) => item.id === brand)!

  const back = (
    <button
      type="button"
      onClick={() => navigate(brandPath(brand, 'applications'))}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.applications')}
    </button>
  )

  if (!app) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('application.notFound')} />
      </div>
    )
  }

  const { checks } = app
  const months = t('mlProducts.months', { n: String(app.term) })
  const monthly = monthlyOfApp(app)
  const actor = (by: LoanAppEvent['by']) =>
    typeof by === 'object' ? t('loanApp.by.admin', { name: by.admin }) : t(`loanApp.by.${by}`)

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tabular-nums">
            {t('application.title', { number: groupDigits(app.number) })}
          </h1>
          <StatusBadge tone={loanAppStatusTone[app.status]}>
            {t(`loanApp.status.${app.status}`)}
          </StatusBadge>
        </div>
        <p className="text-ink-muted">
          {formatDateTime(app.createdAt)} · {product?.name} · {t('loanApp.fromApp')}
        </p>
      </div>

      {app.decline && (
        <div className="flex gap-3 rounded-card bg-danger-soft p-4 text-danger">
          <CircleX size={22} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">
              {t('application.rejectedBecause', { reason: t(`loanDecline.${app.decline.reason}`) })}
            </p>
            {app.decline.comment && <p className="text-sm">{app.decline.comment}</p>}
          </div>
        </div>
      )}
      {app.refusal && (
        <div className="flex gap-3 rounded-card bg-navy-100 p-4">
          <CircleX size={22} className="shrink-0 text-ink-muted" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">
              {t('loanApp.refusedBecause', { reason: t(`loanRefusal.${app.refusal.reason}`) })}
            </p>
            {app.refusal.note && <p className="text-sm text-ink-muted">{app.refusal.note}</p>}
          </div>
        </div>
      )}
      {isOffer(app.status) && app.offerUntil && (
        <div className="flex gap-3 rounded-card bg-navy-100 p-4">
          <Clock size={22} className="shrink-0 text-brand" />
          <p className="text-sm">
            {t('loanApp.offerUntil', { date: formatDateTime(app.offerUntil) })}
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="text-lg font-bold">{t('loanApp.terms')}</h2>
            <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              <Rows
                rows={[
                  [t('mlProducts.col.product'), product?.name ?? '—'],
                  [t('loanApp.asked'), formatSum(app.amount)],
                  ...(app.offered
                    ? [[t('loanApp.offered'), formatSum(app.offered)] as [string, string]]
                    : []),
                  [t('mlProducts.col.term'), months],
                ]}
              />
              <Rows
                rows={[
                  [t('mlProducts.col.rate'), `${app.rate}%`],
                  [t('application.monthly'), formatSum(monthly)],
                  [t('loanApp.total'), formatSum(monthly * app.term)],
                  [
                    t('loanApp.card'),
                    `${app.card.brand === 'humo' ? 'Humo' : 'Uzcard'} •••• ${app.card.last4}`,
                  ],
                ]}
              />
            </div>
            {app.loanNumber && (
              <Link
                to={brandLoanPath(brand, app.loanNumber)}
                className="flex items-center justify-between gap-2 border-t border-line pt-3 text-sm font-semibold text-brand hover:underline"
              >
                {t('application.contract', { number: app.loanNumber })}
                <ChevronRight size={16} />
              </Link>
            )}
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('loanApp.checks')}</h2>
            <ul className="flex flex-col gap-4">
              <Check
                ok={checks.myid === 'ok'}
                title={t('loanApp.check.myid')}
                detail={t(
                  checks.myid === 'ok' ? 'loanApp.check.myid.ok' : 'loanApp.check.myid.bad',
                )}
              />
              <Check
                ok={checks.credit !== 'late'}
                warn={checks.credit === 'late' && (checks.lateCount ?? 0) <= 2}
                title={t('loanApp.check.credit')}
                detail={
                  checks.credit === 'late'
                    ? t('loanApp.check.credit.late', { count: String(checks.lateCount ?? 1) })
                    : t(`loanApp.check.credit.${checks.credit}`)
                }
              />
              <Check
                ok={checks.load <= rules.approveUpTo}
                title={t('loanApp.check.load')}
                detail={t('loanApp.check.load.detail', {
                  monthly: formatSum(monthlyOfApp({ ...app, offered: undefined })),
                  income: formatSum(app.income),
                  load: String(checks.load),
                  limit: String(rules.approveUpTo),
                })}
              />
            </ul>
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('pricing.history')}</h2>
            <ol className="flex flex-col">
              {[...app.history].reverse().map((entry, index) => (
                <li
                  key={index}
                  className="relative flex flex-col gap-0.5 border-l-2 border-line pb-5 pl-5 last:pb-0"
                >
                  <span
                    className={cn(
                      'absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-canvas',
                      index === 0 ? 'bg-primary' : 'bg-navy-400',
                    )}
                  />
                  <p className="font-semibold">{t(`loanApp.status.${entry.status}`)}</p>
                  <p className="text-sm text-ink-muted">
                    {formatDateTime(entry.at)} · {actor(entry.by)}
                  </p>
                  {entry.note && <p className="text-sm">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className={card}>
            <h2 className="font-bold">{t('loanApps.col.borrower')}</h2>
            <Rows
              rows={[
                [
                  t('merchant.owner'),
                  <Link
                    key="client"
                    to={brandClientPath(brand, `${brand}-${app.borrower.passport}`)}
                    className="font-semibold text-brand hover:underline"
                  >
                    {app.borrower.name}
                  </Link>,
                ],
                [t('merchant.phone'), formatPhone(app.borrower.phone)],
                [
                  t('loanApp.passport'),
                  `${app.borrower.passport.slice(0, 2)} ${app.borrower.passport.slice(2)}`,
                ],
                [t('loanApp.birthDate'), app.borrower.birthDate],
              ]}
            />
          </section>
          <section className={card}>
            <h2 className="font-bold">{t('loanApp.told')}</h2>
            <Rows
              rows={[
                [t('loanApp.income'), formatSum(app.income)],
                [t('loanApp.workplace'), app.workplace],
              ]}
            />
          </section>
          <section className={card}>
            <h2 className="font-bold">{t('loanApp.contacts')}</h2>
            <ul className="flex flex-col">
              {app.contacts.map((contact) => (
                <li
                  key={contact.phone}
                  className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-sm text-ink-muted">
                      {t(`relation.${contact.relation}`)}
                    </span>
                  </span>
                  <span className="text-sm whitespace-nowrap tabular-nums">
                    {formatPhone(contact.phone)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
