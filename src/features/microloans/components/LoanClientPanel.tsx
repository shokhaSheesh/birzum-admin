import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loanApplicationsStore, loanAppStatusTone, sumOf } from '@/entities/microloans/applications'
import { segmentOf, segmentTone, type LoanClient } from '@/entities/microloans/loanClients'
import { lateOf, loansStore, loanStateTone, progressOf, stateOf } from '@/entities/microloans/loans'
import { brandClientPath, brandLoanPath, loanAppPath, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui/Avatar'
import { StatusBadge } from '@/shared/ui/StatusBadge'

/**
 * Who a microloan client is and where their loans stand, beside their chat: what is left, what
 * is late, the next payment, their loans and arizalar, so the answer needs no other page.
 */
export function LoanClientPanel({ brand, client }: { brand: Brand; client: LoanClient }) {
  const { t } = useI18n()
  const [today] = useState(() => new Date())
  const apps = loanApplicationsStore
    .useAll()
    .filter((app) => app.brand === brand && app.borrower.passport === client.passport)
  const loans = loansStore
    .useAll()
    .filter((loan) => loan.brand === brand && loan.borrower.passport === client.passport)
  const segment = segmentOf(client, apps, loans)
  const open = loans.filter((loan) => !loan.closedAt)
  const late = open.reduce((sum, loan) => sum + lateOf(loan, today).amount, 0)
  const next = open
    .map((loan) => progressOf(loan).next?.due)
    .filter((due): due is Date => !!due)
    .sort((a, b) => a.getTime() - b.getTime())[0]
  const rows: [string, string, boolean?][] = [
    [t('mlSupport.openLoans'), String(open.length)],
    [
      t('mlSupport.left'),
      open.length
        ? formatSum(open.reduce((sum, loan) => sum + progressOf(loan).principalLeft, 0))
        : '—',
    ],
    [t('client.overdue'), late ? formatSum(late) : '—', late > 0],
    [t('support.nextPayment'), next ? formatDate(next) : '—'],
  ]
  const initials = client.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-line bg-canvas p-5 xl:flex">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar initials={initials} size="lg" />
        <p className="font-bold">{client.name}</p>
        <p className="text-sm text-ink-muted tabular-nums">{formatPhone(client.phone)}</p>
        <StatusBadge tone={client.block ? 'danger' : segmentTone[segment]}>
          {client.block ? t('mlClients.access.blocked') : t(`mlClients.segment.${segment}`)}
        </StatusBadge>
      </div>
      <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-sm">
        {rows.map(([label, value, red]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-ink-muted">{label}</dt>
            <dd className={cn('text-right font-semibold tabular-nums', red && 'text-danger')}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <p className="text-sm font-semibold">{t('nav.loans')}</p>
        {loans.length === 0 ? (
          <p className="text-sm text-ink-subtle">{t('mlClients.noLoans')}</p>
        ) : (
          loans.slice(0, 3).map((loan) => (
            <Link
              key={loan.id}
              to={brandLoanPath(brand, loan.id)}
              className="-mx-2 flex items-center gap-2 rounded-control p-2 hover:bg-surface"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium tabular-nums">{loan.number}</span>
                <span className="text-xs text-ink-muted tabular-nums">
                  {formatSum(loan.amount)} · {formatDate(loan.issuedAt)}
                </span>
              </span>
              <StatusBadge tone={loanStateTone[stateOf(loan)]}>
                {t(`loan.state.${stateOf(loan)}`)}
              </StatusBadge>
            </Link>
          ))
        )}
      </div>
      {apps.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <p className="text-sm font-semibold">{t('nav.applications')}</p>
          {apps.slice(0, 3).map((app) => (
            <Link
              key={app.id}
              to={loanAppPath(brand, app.id)}
              className="-mx-2 flex items-center gap-2 rounded-control p-2 hover:bg-surface"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium tabular-nums">
                  {formatSum(sumOf(app))}
                </span>
                <span className="text-xs text-ink-muted tabular-nums">
                  {formatDate(app.createdAt)}
                </span>
              </span>
              <StatusBadge tone={loanAppStatusTone[app.status]}>
                {t(`loanApp.status.${app.status}`)}
              </StatusBadge>
            </Link>
          ))}
        </div>
      )}
      <Link
        to={brandClientPath(brand, client.id)}
        className="mt-auto flex items-center justify-between rounded-control bg-surface px-4 py-3 text-sm font-semibold hover:bg-navy-100"
      >
        {t('support.openClient')}
        <ChevronRight size={18} />
      </Link>
    </aside>
  )
}
