import {
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Gauge,
  Layers,
  type LucideIcon,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { applicationsStore, financedOf } from '@/entities/applications/applications'
import { useRules } from '@/entities/applications/checkRules'
import { checksStore, type CheckFlag } from '@/entities/applications/checks'
import { clientsStore, fullName, initialsOf } from '@/entities/clients/clients'
import { debtOf } from '@/entities/clients/debt'
import { paymentsStore } from '@/entities/collections/payments'
import { filialsStore } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { applicationPath, clientPath, merchantPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { ApproveCheckModal, RejectCheckModal } from '../components/CheckDialogs'
import { ScoreMeter } from '../components/ScoreMeter'
import { waitedFor } from '../model/waiting'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'
const FLAG_ICONS: Record<CheckFlag, LucideIcon> = {
  overdue: CircleAlert,
  nearLimit: Gauge,
  newClient: UserPlus,
  manyRunning: Layers,
  bigAmount: Wallet,
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="text-right font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * One ariza waiting for Birzum's check: why it is here, each warning sign with its numbers, the
 * ariza and the shopper's money with Birzum. The admin approves it, so the shop can hand the
 * goods over, or rejects it with a reason. A decided one shows who decided and why.
 */
export function CheckPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const check = checksStore.useAll().find((item) => item.id === id)
  const application = applicationsStore.useAll().find((item) => item.id === id)
  const client = clientsStore.useAll().find((item) => item.id === application?.clientId)
  const merchant = merchantsStore.useAll().find((item) => item.id === application?.merchantId)
  const filial = filialsStore.useAll().find((item) => item.id === application?.filialId)
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const [now] = useState(() => new Date())
  const rules = useRules()
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null)
  const back = () => navigate(ROUTES.checks)

  if (!check || !application || !client)
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        <EmptyState title={t('application.notFound')} />
      </div>
    )

  const number = groupDigits(application.number)
  const financed = financedOf(application)
  const debt = debtOf(
    client,
    applications.filter((a) => a.id !== application.id),
    payments,
    now,
  )
  const waited = waitedFor(check.checkedAt, now)
  const detail = (flag: CheckFlag) => {
    switch (flag) {
      case 'overdue':
        return t('check.flag.overdue.detail', {
          sum: formatSum(debt.overdue),
          days: String(debt.overdueDays),
        })
      case 'nearLimit':
        if (client.limit && financed > client.limit.amount)
          return t('check.flag.overLimit.detail', {
            sum: formatSum(financed),
            limit: formatSum(client.limit.amount),
          })
        return t('check.flag.nearLimit.detail', {
          percent: String(Math.round((financed / (client.limit?.amount ?? financed)) * 100)),
          sum: formatSum(financed),
          limit: formatSum(client.limit?.amount ?? 0),
        })
      case 'newClient':
        return t('check.flag.newClient.detail', {
          days: String(
            Math.max(
              0,
              Math.floor(
                (application.createdAt.getTime() - client.registeredAt.getTime()) / 86_400_000,
              ),
            ),
          ),
        })
      case 'manyRunning':
        return t('check.flag.manyRunning.detail', {
          count: String(debt.running),
          sum: formatSum(debt.remaining),
        })
      case 'bigAmount':
        return t('check.flag.bigAmount.detail', { sum: formatSum(rules.flags.bigAmount.threshold) })
    }
  }

  return (
    <>
      <ActionBar eyebrow={t('nav.checks')} title={t('application.title', { number })} onBack={back}>
        {check.state === 'waiting' ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="px-4! text-danger!"
              onClick={() => setDeciding('reject')}
            >
              {t('check.reject')}
            </Button>
            <Button size="sm" className="px-4!" onClick={() => setDeciding('approve')}>
              {t('check.approve')}
            </Button>
          </>
        ) : (
          <StatusBadge tone={check.state === 'approved' ? 'success' : 'danger'}>
            {t(`check.state.${check.state}`)}
          </StatusBadge>
        )}
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="flex flex-col gap-6">
          <section className={card}>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold">{t('check.why')}</h2>
              <p className="text-sm text-ink-muted">
                {check.mode === 'auto'
                  ? t('check.why.auto', { score: String(rules.approveFrom) })
                  : t('check.why.manual', { score: String(rules.approveFrom) })}
              </p>
            </div>
            {check.flags.length === 0 ? (
              <p className="rounded-control bg-surface p-3 text-sm text-ink-muted">
                {t('check.noFlags')}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {check.flags.map((flag) => {
                  const Icon = FLAG_ICONS[flag]
                  return (
                    <li key={flag} className="flex gap-3 rounded-control bg-warning-soft p-3">
                      <Icon size={20} className="mt-0.5 shrink-0 text-warning" />
                      <div className="flex flex-col gap-0.5">
                        <p className="font-semibold">{t(`check.flag.${flag}`)}</p>
                        <p className="text-sm text-ink-muted">{detail(flag)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t('check.application')}</h2>
              <Link
                to={applicationPath(application.id)}
                className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
              >
                {t('check.openApplication')}
                <ChevronRight size={16} />
              </Link>
            </div>
            <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
              {application.lines.map((line, index) => (
                <li key={index} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-semibold">{line.name}</span>
                    {line.variant && <span className="text-sm text-ink-muted">{line.variant}</span>}
                  </div>
                  <span className="whitespace-nowrap tabular-nums">
                    {formatSum(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <Rows
              rows={[
                [t('check.goods'), formatSum(application.goodsTotal)],
                [t('check.downPayment'), formatSum(application.downPayment)],
                [t('check.financed'), <b key="f">{formatSum(financed)}</b>],
                [
                  t('check.term'),
                  `${t('term.months', { count: String(application.term) })} · ${application.markupPercent}%`,
                ],
                [t('check.monthly'), <b key="m">{formatSum(application.monthlyPayment)}</b>],
                [
                  t('products.col.merchant'),
                  merchant ? (
                    <Link
                      key="mm"
                      to={merchantPath(merchant.id)}
                      className="text-brand hover:underline"
                    >
                      {merchant.name}
                      {filial ? ` · ${tl(filial.name)}` : ''}
                    </Link>
                  ) : (
                    '—'
                  ),
                ],
              ]}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className={card}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold">{t('check.score')}</h2>
              <p>
                <span className="text-3xl font-bold tabular-nums">{check.score}</span>
                <span className="text-ink-muted"> / 100</span>
              </p>
            </div>
            <ScoreMeter score={check.score} size="lg" />
            <dl className="flex flex-col gap-1.5 rounded-control bg-surface p-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">{t('check.score.base')}</dt>
                <dd className="font-semibold tabular-nums">{check.baseScore}</dd>
              </div>
              {check.flags.map((flag) => (
                <div key={flag} className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{t(`check.flag.${flag}`)}</dt>
                  <dd className="font-semibold text-warning tabular-nums">
                    −{check.penalties[flag] ?? 0}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                <dt className="font-semibold">{t('check.score.final')}</dt>
                <dd className="font-bold tabular-nums">{check.score}</dd>
              </div>
            </dl>
            <p className="text-sm text-ink-muted">
              {check.score >= rules.approveFrom
                ? t('check.score.pass', { score: String(rules.approveFrom) })
                : t('check.score.low', { score: String(rules.approveFrom) })}
            </p>
            {check.state === 'waiting' && (
              <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                <CalendarClock size={16} />
                {t('check.waitingFor', { time: t(waited.key, { count: waited.count }) })}
              </p>
            )}
          </section>

          {check.state !== 'waiting' && (
            <section className={card}>
              <h2 className="font-bold">{t('check.decision')}</h2>
              <Rows
                rows={[
                  [
                    t('check.decidedBy'),
                    check.mode === 'auto' ? t('check.mode.auto') : (check.decidedBy ?? '—'),
                  ],
                  [t('check.decidedAt'), check.decidedAt ? formatDateTime(check.decidedAt) : '—'],
                  ...(check.reason
                    ? [
                        [t('check.reason'), t(`check.reason.${check.reason}`)] as [
                          string,
                          ReactNode,
                        ],
                      ]
                    : []),
                ]}
              />
              {check.comment && (
                <p className="rounded-control bg-surface p-3 text-sm">{check.comment}</p>
              )}
            </section>
          )}

          <section className={card}>
            <Link
              to={clientPath(client.id)}
              className="-m-2 flex items-center gap-3 rounded-control p-2 hover:bg-surface"
            >
              <Avatar initials={initialsOf(client)} photoUrl={client.photoUrl} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{fullName(client)}</span>
                <span className="text-sm text-ink-muted">{formatPhone(client.phone)}</span>
              </div>
              <ChevronRight size={18} className="text-ink-subtle" />
            </Link>
            <Rows
              rows={[
                [t('check.client.limit'), client.limit ? formatSum(client.limit.amount) : '—'],
                [t('check.client.running'), groupDigits(debt.running)],
                [t('check.client.remaining'), formatSum(debt.remaining)],
                [
                  t('check.client.overdue'),
                  debt.overdue > 0 ? (
                    <span key="o" className="text-danger">
                      {formatSum(debt.overdue)}
                    </span>
                  ) : (
                    t('check.client.noOverdue')
                  ),
                ],
                [t('check.client.since'), formatDate(client.registeredAt)],
              ]}
            />
          </section>
        </aside>
      </div>

      {deciding === 'approve' && (
        <ApproveCheckModal application={application} onClose={() => setDeciding(null)} />
      )}
      {deciding === 'reject' && (
        <RejectCheckModal application={application} onClose={() => setDeciding(null)} />
      )}
    </>
  )
}
