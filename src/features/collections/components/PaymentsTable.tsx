import { Eye, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { applicationsStore } from '@/entities/applications/applications'
import { CARD_LOGOS, clientsStore, fullName } from '@/entities/clients/clients'
import type { Payment } from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { applicationPath, clientPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { RowActions } from '@/shared/ui/RowActions'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Money in from shoppers and failed card charges, newest first. A row opens its ariza. On a
 * shopper's own page the client column is left out.
 */
export function PaymentsTable({
  payments,
  showClient = true,
}: {
  payments: Payment[]
  showClient?: boolean
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const clients = clientsStore.useAll()
  const applications = applicationsStore.useAll()
  const merchants = merchantsStore.useAll()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-t border-line">
        <thead>
          <tr className="border-b border-line">
            <th className={th}>{t('collections.col.date')}</th>
            {showClient && <th className={th}>{t('applications.col.client')}</th>}
            <th className={th}>{t('payout.col.ariza')}</th>
            <th className={th}>{t('collections.col.kind')}</th>
            <th className={th}>{t('collections.col.card')}</th>
            <th className={`${th} text-right`}>{t('payouts.col.amount')}</th>
            <th className={th}>{t('merchants.status')}</th>
            <th className={showClient ? 'w-24' : 'w-14'} />
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const client = clients.find((item) => item.id === payment.clientId)
            const application = applications.find((item) => item.id === payment.applicationId)
            const merchant = merchants.find((item) => item.id === payment.merchantId)
            const card = client?.cards.find((item) => item.id === payment.cardId)
            return (
              <tr
                key={payment.id}
                onClick={() => navigate(applicationPath(payment.applicationId))}
                className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
              >
                <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                  {formatDateTime(payment.at)}
                </td>
                {showClient && (
                  <td className="px-4 py-3">
                    {client && (
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{fullName(client)}</span>
                        <span className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
                          {formatPhone(client.phone)}
                        </span>
                      </div>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {merchant && <MerchantLogo merchant={merchant} size="xs" />}
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold tabular-nums">
                        № {groupDigits(application?.number ?? payment.applicationId)}
                      </span>
                      <span className="truncate text-xs text-ink-muted">{merchant?.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  {t(`payment.kind.${payment.kind}`)}
                </td>
                <td className="px-4 py-3">
                  {card && (
                    <div className="flex items-center gap-2">
                      <img
                        src={CARD_LOGOS[card.brand]}
                        alt={card.brand}
                        className="h-6 w-9 shrink-0 rounded object-contain"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm tabular-nums">•••• {card.last4}</span>
                        <span className="text-xs whitespace-nowrap text-ink-muted">
                          {t(`payment.method.${payment.method}`)}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums',
                    payment.failed && 'text-ink-subtle line-through',
                  )}
                >
                  {formatSum(payment.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-0.5">
                    <StatusBadge tone={payment.failed ? 'danger' : 'success'}>
                      {t(payment.failed ? 'payment.state.failed' : 'payment.state.ok')}
                    </StatusBadge>
                    {payment.failed && (
                      <span className="text-xs whitespace-nowrap text-ink-muted">
                        {t(`payment.fail.${payment.failed}`)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="pr-3">
                  <RowActions
                    actions={[
                      {
                        icon: Eye,
                        label: t('collections.openApplication'),
                        onClick: () => navigate(applicationPath(payment.applicationId)),
                      },
                      ...(showClient
                        ? [
                            {
                              icon: UserRound,
                              label: t('collections.openClient'),
                              onClick: () => navigate(clientPath(payment.clientId)),
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
