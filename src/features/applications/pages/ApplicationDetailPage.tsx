import { ArrowLeft, Ban, ChevronRight, CircleX } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { applicationStatusTone } from '@/entities/applications/applicationStatus'
import { applicationsStore, financedOf } from '@/entities/applications/applications'
import { paymentsStore, progressOf } from '@/entities/collections/payments'
import { filialsStore } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { payoutStateTone } from '@/entities/payouts/payoutState'
import { payoutsStore, salesStore } from '@/entities/payouts/payouts'
import { merchantPath, payoutPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { ScheduleCard } from '@/features/collections/components/ScheduleCard'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

/** Label and value rows inside a card. */
function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium break-words tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * One ariza, read-only: what was bought and on what terms, its full history, the shopper, the
 * merchant and filial, and whether Birzum has paid the merchant for it yet.
 */
export function ApplicationDetailPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const application = applicationsStore.useAll().find((item) => item.id === id)
  const merchant = merchantsStore.useAll().find((item) => item.id === application?.merchantId)
  const filial = filialsStore.useAll().find((item) => item.id === application?.filialId)
  const sale = salesStore.useAll().find((item) => item.id === id)
  const payout = payoutsStore.useAll().find((item) => item.id === sale?.payoutId)
  const payments = paymentsStore.useAll()
  const [today] = useState(() => new Date())

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.applications)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.applications')}
    </button>
  )

  if (!application) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('application.notFound')} />
      </div>
    )
  }

  const progress =
    application.status === 'handed' || application.status === 'closed'
      ? progressOf(application, payments, today)
      : null
  const months = (count: number) => t('term.months', { count: String(count) })
  const actorOf = (kind: 'staff' | 'customer' | 'system', name: string) =>
    kind === 'system' ? name : `${t(`application.actor.${kind}`)}: ${name}`

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tabular-nums">
            {t('application.title', { number: groupDigits(application.number) })}
          </h1>
          <StatusBadge tone={applicationStatusTone[application.status]}>
            {t(`application.status.${application.status}`)}
          </StatusBadge>
        </div>
        <p className="text-ink-muted">
          {formatDateTime(application.createdAt)} · {t(`application.source.${application.source}`)}
        </p>
      </div>

      {application.rejection && (
        <div className="flex gap-3 rounded-card bg-danger-soft p-4 text-danger">
          <CircleX size={22} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">
              {t('application.rejectedBecause', {
                reason: t(`reject.reason.${application.rejection.reason}`),
              })}
            </p>
            <p className="text-sm">{application.rejection.comment}</p>
          </div>
        </div>
      )}
      {application.cancelComment && (
        <div className="flex gap-3 rounded-card bg-navy-100 p-4">
          <Ban size={22} className="shrink-0 text-ink-muted" />
          <div className="flex flex-col gap-0.5">
            <p className="font-bold">{t('application.cancelled')}</p>
            <p className="text-sm text-ink-muted">{application.cancelComment}</p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <h2 className="p-5 text-lg font-bold">{t('application.products')}</h2>
            <table className="w-full border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('products.col.product')}</th>
                  <th className={`${th} text-right`}>{t('application.qty')}</th>
                  <th className={`${th} text-right`}>{t('products.col.price')}</th>
                </tr>
              </thead>
              <tbody>
                {application.lines.map((line, index) => (
                  <tr key={index} className="border-b border-line">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{line.name}</span>
                        {line.variant && (
                          <span className="text-sm text-ink-muted">{line.variant}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                      {formatSum(line.price * line.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-sm text-ink-muted">
                    {t('payout.total')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">
                    {formatSum(application.goodsTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('application.terms')}</h2>
            <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              <Rows
                rows={[
                  [t('application.goods'), formatSum(application.goodsTotal)],
                  [t('application.down'), formatSum(application.downPayment)],
                  [t('application.financed'), formatSum(financedOf(application))],
                  [t('pricing.col.term'), months(application.term)],
                ]}
              />
              <Rows
                rows={[
                  [t('nav.pricing'), `${application.markupPercent}%`],
                  [t('application.installment'), formatSum(application.installmentTotal)],
                  [t('application.monthly'), formatSum(application.monthlyPayment)],
                  [
                    t('application.payDay'),
                    t('application.payDay.value', { day: String(application.paymentDay) }),
                  ],
                ]}
              />
            </div>
            {application.contractNumber && (
              <p className="border-t border-line pt-3 text-sm text-ink-muted">
                {t('application.contract', { number: application.contractNumber })}
              </p>
            )}
          </section>

          {progress && <ScheduleCard items={progress.items} remaining={progress.remaining} />}

          <section className={card}>
            <h2 className="text-lg font-bold">{t('pricing.history')}</h2>
            <ol className="flex flex-col">
              {[...application.history].reverse().map((entry, index) => (
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
                  <p className="font-semibold">{t(`application.status.${entry.status}`)}</p>
                  <p className="text-sm text-ink-muted">
                    {formatDateTime(entry.at)} · {actorOf(entry.by.kind, entry.by.name)}
                  </p>
                  {entry.comment && <p className="text-sm">{entry.comment}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className={card}>
            <h2 className="font-bold">{t('applications.col.client')}</h2>
            <Rows
              rows={[
                [t('merchant.owner'), application.client.name],
                [t('merchant.phone'), formatPhone(application.client.phone)],
                [t('application.pinfl'), application.client.pinfl],
              ]}
            />
          </section>

          {merchant && (
            <Link
              to={merchantPath(merchant.id)}
              className="flex items-center gap-3 rounded-card border border-line bg-canvas p-4 hover:bg-surface/60"
            >
              <MerchantLogo merchant={merchant} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-semibold">{merchant.name}</p>
                <p className="truncate text-sm text-ink-muted">{filial ? tl(filial.name) : ''}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
            </Link>
          )}

          <section className={card}>
            <h2 className="font-bold">{t('application.fulfilment')}</h2>
            <Rows
              rows={[
                [t('application.method'), t(`application.method.${application.fulfilment.method}`)],
                [
                  t('application.address'),
                  application.fulfilment.address ?? (filial ? tl(filial.address) : '—'),
                ],
              ]}
            />
          </section>

          {sale && (
            <section className={card}>
              <h2 className="font-bold">{t('application.payout')}</h2>
              {payout ? (
                <Link
                  to={payoutPath(payout.id)}
                  className="flex items-center justify-between gap-3 rounded-control bg-surface p-3 hover:bg-navy-100"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold tabular-nums">{payout.reference}</span>
                    <span className="text-sm text-ink-muted">{formatSum(sale.amount)}</span>
                  </div>
                  <StatusBadge tone={payoutStateTone[payout.state]}>
                    {t(`payout.state.${payout.state}`)}
                  </StatusBadge>
                </Link>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-control bg-warning-soft p-3">
                  <span className="text-sm font-semibold">{t('payouts.stat.owed')}</span>
                  <span className="font-bold tabular-nums">{formatSum(sale.amount)}</span>
                </div>
              )}
            </section>
          )}
          <p className="px-1 text-sm text-ink-subtle">{t('application.readOnly')}</p>
        </aside>
      </div>
    </div>
  )
}
