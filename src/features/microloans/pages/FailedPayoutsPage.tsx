import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { logAction, sumParam } from '@/entities/audit/audit'
import { failedPayoutsStore, type FailedPayout } from '@/entities/microloans/payouts'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const cardText = (card: FailedPayout['card']) =>
  `${card.brand === 'humo' ? 'Humo' : 'Uzcard'} •••• ${card.last4}`

/**
 * Muvaffaqiyatsiz oʻtkazmalar of one microloan brand: signed contracts whose money did not reach
 * the card. The bank's reason, how many times Atmos tried and when; «Qayta yuborish» sends it
 * again now. Sent ones stay in the list, marked, until the page is left.
 */
export function FailedPayoutsPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const payouts = failedPayoutsStore
    .useAll()
    .filter((item) => item.brand === brand)
    .sort((a, b) => +b.lastTryAt - +a.lastTryAt)
  const [resending, setResending] = useState<FailedPayout | null>(null)
  const failed = payouts.filter((item) => item.status === 'failed')

  const resend = (item: FailedPayout) => {
    failedPayoutsStore.update(item.id, {
      status: 'sent',
      attempts: item.attempts + 1,
      lastTryAt: new Date(),
    })
    logAction({
      section: 'mlPayments',
      kind: 'money',
      action: 'audit.a.payoutResent',
      params: { brand: WORKSPACE_INFO[brand].name, sum: sumParam(item.amount) },
      target: item.applicationNumber,
      href: brandPath(brand, 'payouts'),
    })
    toast(t('payouts.sent', { sum: formatSum(item.amount) }))
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.failedPayouts')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('payouts.stat.count')}
          value={String(failed.length)}
          hint={t('payouts.stat.countHint')}
        />
        <StatCard
          label={t('payouts.stat.sum')}
          value={formatSum(failed.reduce((sum, item) => sum + item.amount, 0))}
          hint={t('payouts.stat.sumHint')}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        {payouts.length === 0 ? (
          <EmptyState title={t('payouts.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('loanApps.col.borrower')}</th>
                  <th className={th}>{t('payouts.col.application')}</th>
                  <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
                  <th className={th}>{t('payouts.col.card')}</th>
                  <th className={th}>{t('payouts.col.reason')}</th>
                  <th className={th}>{t('payouts.col.tries')}</th>
                  <th className="w-44" />
                </tr>
              </thead>
              <tbody>
                {payouts.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{item.borrower.name}</span>
                        <span className="text-sm text-ink-muted tabular-nums">
                          {formatPhone(item.borrower.phone)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap tabular-nums">
                      {item.applicationNumber}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                      {formatSum(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                      {cardText(item.card)}
                    </td>
                    <td className="px-4 py-3 text-sm">{t(`payouts.reason.${item.reason}`)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="block tabular-nums">
                        {t('payouts.tries', { count: String(item.attempts) })}
                      </span>
                      <span className="text-xs text-ink-muted tabular-nums">
                        {formatDateTime(item.lastTryAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'sent' ? (
                        <StatusBadge tone="success">{t('payouts.status.sent')}</StatusBadge>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setResending(item)}>
                          <RotateCcw size={16} />
                          {t('payouts.resend')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!resending}
        onClose={() => setResending(null)}
        title={t('payouts.resend.title')}
        confirmLabel={t('payouts.resend')}
        tone="primary"
        onConfirm={() => {
          if (resending) resend(resending)
          setResending(null)
        }}
      >
        {resending &&
          t('payouts.resend.text', {
            sum: formatSum(resending.amount),
            card: cardText(resending.card),
            name: resending.borrower.name,
          })}
      </ConfirmDialog>
    </div>
  )
}
