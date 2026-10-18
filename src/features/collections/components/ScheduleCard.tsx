import type { Installment } from '@/entities/collections/payments'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatSum } from '@/shared/lib/format'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const tones: Record<Installment['state'], StatusTone> = {
  paid: 'success',
  due: 'neutral',
  overdue: 'danger',
}

/** A running or closed nasiya's monthly payments: progress on top, then every month. */
export function ScheduleCard({ items, remaining }: { items: Installment[]; remaining: number }) {
  const { t } = useI18n()
  const paid = items.filter((item) => item.state === 'paid').length
  return (
    <section className="flex flex-col rounded-card border border-line bg-canvas">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{t('schedule.title')}</h2>
          <p className="text-sm text-ink-muted tabular-nums">
            {t('schedule.progress', { paid: String(paid), term: String(items.length) })} ·{' '}
            {t('schedule.remaining', { sum: formatSum(remaining) })}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${(paid / Math.max(1, items.length)) * 100}%` }}
          />
        </div>
      </div>
      <table className="w-full border-t border-line">
        <thead>
          <tr className="border-b border-line">
            <th className={th}>№</th>
            <th className={th}>{t('collections.col.date')}</th>
            <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
            <th className={th}>{t('merchants.status')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.number} className="border-b border-line last:border-b-0">
              <td className="px-4 py-2.5 text-sm text-ink-muted tabular-nums">{item.number}</td>
              <td className="px-4 py-2.5 text-sm tabular-nums">{formatDate(item.dueDate)}</td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums">
                {formatSum(item.amount)}
                {item.state !== 'paid' && item.paid > 0 && (
                  <span className="block text-xs text-ink-muted">
                    {t('schedule.partial', { sum: formatSum(item.paid) })}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={tones[item.state]}>
                    {t(`schedule.state.${item.state}`)}
                  </StatusBadge>
                  {item.paidAt && (
                    <span className="text-xs text-ink-muted tabular-nums">
                      {formatDate(item.paidAt)}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
