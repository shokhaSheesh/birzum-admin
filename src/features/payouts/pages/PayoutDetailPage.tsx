import { ArrowLeft, CheckCheck, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { filialsStore } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { payoutStateTone } from '@/entities/payouts/payoutState'
import { payoutsStore, salesStore } from '@/entities/payouts/payouts'
import { merchantPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { MarkPaidDialog } from '../components/MarkPaidDialog'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * One payout: how much, to whom and which sales it pays for. While it is "Jarayonda" the admin
 * can mark it sent, or cancel it, which puts its sales back among what is owed.
 */
export function PayoutDetailPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const payout = payoutsStore.useAll().find((item) => item.id === id)
  const sales = salesStore.useAll()
  const filials = filialsStore.useAll()
  const merchant = merchantsStore.useAll().find((item) => item.id === payout?.merchantId)
  const [marking, setMarking] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.payouts)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.payouts')}
    </button>
  )

  if (!payout) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('payout.notFound')} />
      </div>
    )
  }

  const covered = sales.filter((sale) => payout.saleIds.includes(sale.id))
  const cancel = () => {
    covered.forEach((sale) => salesStore.update(sale.id, { payoutId: undefined }))
    payoutsStore.remove(payout.id)
    toast(t('payout.cancelled'))
    navigate(ROUTES.payouts, { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tabular-nums">{payout.reference}</h1>
            <StatusBadge tone={payoutStateTone[payout.state]}>
              {t(`payout.state.${payout.state}`)}
            </StatusBadge>
          </div>
          <p className="text-ink-muted">
            {merchant?.name} · {formatDate(payout.date)}
          </p>
        </div>
        {payout.state === 'processing' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-danger!"
              onClick={() => setCancelling(true)}
            >
              <X size={18} />
              {t('payout.cancel')}
            </Button>
            <Button size="sm" onClick={() => setMarking(true)}>
              <CheckCheck size={18} />
              {t('payout.markPaid')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col rounded-card border border-line bg-canvas">
          <div className="flex flex-col gap-1 p-5">
            <h2 className="text-lg font-bold">{t('payout.sales')}</h2>
            <p className="text-sm text-ink-muted">
              {t('payout.summary.count', { count: String(covered.length) })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('payout.col.ariza')}</th>
                  <th className={th}>{t('payout.col.client')}</th>
                  <th className={th}>{t('payout.col.filial')}</th>
                  <th className={th}>{t('payout.col.handed')}</th>
                  <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {covered.map((sale) => {
                  const filial = filials.find((item) => item.id === sale.filialId)
                  return (
                    <tr key={sale.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        № {groupDigits(sale.number)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{sale.client}</span>
                          <span className="truncate text-sm text-ink-muted">{sale.product}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{filial ? tl(filial.name) : '—'}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">
                        {formatDate(sale.handedAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                        {formatSum(sale.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm text-ink-muted">
                    {t('payout.total')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">
                    {formatSum(payout.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {merchant && (
            <Link
              to={merchantPath(merchant.id)}
              className="flex items-center gap-3 rounded-card border border-line bg-canvas p-4 hover:bg-surface/60"
            >
              <MerchantLogo merchant={merchant} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate font-semibold">{merchant.name}</p>
                <p className="truncate text-sm text-ink-muted">{merchant.legal.company}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
            </Link>
          )}
          <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5">
            <div className="flex flex-col">
              <p className="text-sm text-ink-muted">{t('payouts.col.amount')}</p>
              <p className="text-2xl font-bold tabular-nums">{formatSum(payout.amount)}</p>
            </div>
            <dl className="flex flex-col gap-2.5 text-sm">
              {(
                [
                  [t('merchant.bank'), merchant?.bank.name ?? '—'],
                  [t('merchant.mfo'), merchant?.bank.mfo ?? '—'],
                  [t('merchant.account'), merchant?.bank.account ?? '—'],
                  [t('payout.createdBy'), payout.createdBy],
                  [t('payout.paidAt'), payout.paidAt ? formatDateTime(payout.paidAt) : '—'],
                  ...(payout.note ? [[t('payout.note'), payout.note] as const] : []),
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium break-all tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="px-1 text-sm text-ink-subtle">
            {t(payout.state === 'paid' ? 'payout.paidNote' : 'payout.processingNote')}
          </p>
        </aside>
      </div>

      {marking && <MarkPaidDialog payoutId={payout.id} onClose={() => setMarking(false)} />}
      <ConfirmDialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        title={t('payout.cancel.title')}
        confirmLabel={t('payout.cancel')}
        cancelLabel={t('payout.cancel.keep')}
        onConfirm={cancel}
      >
        <p>
          {t('payout.cancel.message', {
            reference: payout.reference,
            count: String(covered.length),
          })}
        </p>
      </ConfirmDialog>
    </div>
  )
}
