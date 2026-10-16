import { Banknote } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Merchant } from '@/entities/merchants/merchants'
import { payoutStateTone } from '@/entities/payouts/payoutState'
import { nextDueDate, owedSales, payoutsStore, salesStore, sumOf } from '@/entities/payouts/payouts'
import { newPayoutPath, payoutPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatSum } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/** A merchant's side of the payouts: what Birzum owes it now, then every payout to it. */
export function MerchantPayouts({ merchant }: { merchant: Merchant }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const owed = owedSales(salesStore.useAll(), merchant.id)
  const payouts = payoutsStore.useAll().filter((payout) => payout.merchantId === merchant.id)
  const [today] = useState(() => new Date())

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-4 border-t border-line bg-surface/50 px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-sm text-ink-muted">{t('payouts.stat.owed')}</p>
          <p className="text-xl font-bold tabular-nums">{formatSum(sumOf(owed))}</p>
          <p className="text-sm text-ink-muted">
            {owed.length > 0
              ? t('merchant.payouts.owedHint', {
                  count: String(owed.length),
                  date: formatDate(nextDueDate(merchant, today)),
                })
              : t(`payouts.schedule.${merchant.payoutSchedule}`)}
          </p>
        </div>
        {owed.length > 0 && (
          <Button size="sm" onClick={() => navigate(newPayoutPath(merchant.id))}>
            <Banknote size={18} />
            {t('payouts.create')}
          </Button>
        )}
      </div>
      {payouts.length === 0 ? (
        <EmptyState title={t('merchant.payouts.empty')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>{t('payouts.col.reference')}</th>
                <th className={th}>{t('payouts.col.date')}</th>
                <th className={`${th} text-right`}>{t('payouts.col.sales')}</th>
                <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                <th className={th}>{t('merchants.status')}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr
                  key={payout.id}
                  onClick={() => navigate(payoutPath(payout.id))}
                  className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                >
                  <td className="px-4 py-3 font-semibold tabular-nums">{payout.reference}</td>
                  <td className="px-4 py-3 text-sm tabular-nums">{formatDate(payout.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{payout.saleIds.length}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatSum(payout.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={payoutStateTone[payout.state]}>
                      {t(`payout.state.${payout.state}`)}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
