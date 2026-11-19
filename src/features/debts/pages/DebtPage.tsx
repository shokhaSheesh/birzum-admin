import { ArrowLeft, ArrowRight, CalendarClock, PhoneCall, Shuffle, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fullName, initialsOf } from '@/entities/clients/clients'
import { CRITICAL_DAYS, DEBT_TONES } from '@/entities/collections/debtCases'
import { applicationPath, clientPath, debtPath, merchantPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatDateTime, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { PersonContacts } from '@/features/clients/components/PersonContacts'
import { ContactLog } from '@/features/collections/components/ContactLog'
import { ScheduleCard } from '@/features/collections/components/ScheduleCard'
import {
  DebtCallModal,
  DebtStatusModal,
  NextCallModal,
  OperatorModal,
} from '../components/DebtDialogs'
import { birzumTarget, saveBirzumCall, useDebtRows } from '../lib/rows'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="font-medium break-words tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function CardHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {action}
    </div>
  )
}

const link = 'text-brand underline-offset-2 hover:underline'

/**
 * One late nasiya's file: what is owed and since when, every call and status change, the next
 * call and who is in charge. Everything that changes it opens a small modal.
 */
export function DebtPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const [today] = useState(() => new Date())
  const rows = useDebtRows(today)
  const row = rows.find((item) => item.file.id === id)
  const [modal, setModal] = useState<null | 'call' | 'status' | 'next' | 'operator'>(null)

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.debts)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.debts')}
    </button>
  )

  if (!row) {
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('debts.notFound')} />
      </div>
    )
  }

  const { file, client, application, late } = row
  const closed = file.status === 'closed'
  const others = rows.filter(
    (item) =>
      item.client.id === client.id && item.file.id !== file.id && item.file.status !== 'closed',
  )
  const history = [...file.history].reverse()
  const target = birzumTarget(fullName(client), file.id)

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-wrap items-center gap-5">
        <Avatar initials={initialsOf(client)} photoUrl={client.photoUrl} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{fullName(client)}</h1>
            <StatusBadge tone={DEBT_TONES[file.status]}>
              {t(`debts.status.${file.status}`)}
            </StatusBadge>
            {!closed && late.days >= CRITICAL_DAYS && (
              <StatusBadge tone="danger">{t('debts.critical')}</StatusBadge>
            )}
          </div>
          <p className="text-ink-muted tabular-nums">
            {t('debts.nasiyaNo', { number: String(application.number) })} · {row.merchantName} ·{' '}
            {formatPhone(client.phone)}
          </p>
        </div>
        {!closed && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setModal('status')}>
              <Shuffle size={18} />
              {t('debts.status.change')}
            </Button>
            <Button size="sm" onClick={() => setModal('call')}>
              <PhoneCall size={18} />
              {t('contact.call')}
            </Button>
          </div>
        )}
      </div>

      {closed && (
        <div className="rounded-card bg-success-soft p-4 text-sm font-medium text-success">
          {t('debts.closedBanner', {
            date: formatDate(file.history[file.history.length - 1].at),
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('client.overdue')}
          value={formatSum(late.overdue)}
          hint={t('collections.paymentsCount', { count: String(late.overdueCount) })}
        />
        <StatCard
          label={t('collections.col.late')}
          value={late.days ? t('collections.days', { days: String(late.days) }) : '—'}
          hint={late.since ? t('debts.since', { date: formatDate(late.since) }) : undefined}
        />
        <StatCard
          label={t('clients.col.debt')}
          value={formatSum(late.remaining)}
          hint={t('schedule.progress', {
            paid: String(late.progress.paid),
            term: String(late.progress.items.length),
          })}
        />
        <StatCard
          label={t('debts.nextCall')}
          value={file.nextCall && !closed ? formatDateTime(file.nextCall.at) : '—'}
          hint={
            row.nextCallState === 'missed'
              ? t('debts.next.missedShort')
              : (file.nextCall?.note ?? undefined)
          }
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <h2 className="text-lg font-bold">{t('debts.calls')}</h2>
              <span className="text-sm text-ink-muted">{row.contacts.length}</span>
            </div>
            <ContactLog contacts={row.contacts} today={today} owing={!closed} />
          </section>

          <section className={card}>
            <CardHead title={t('debts.history')} />
            <ol className="flex flex-col">
              {history.map((entry, i) => (
                <li key={i} className="flex gap-3 pb-4 last:pb-0">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ink-subtle" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                      {entry.from && (
                        <>
                          <span className="text-ink-muted">{t(`debts.status.${entry.from}`)}</span>
                          <ArrowRight size={14} className="text-ink-subtle" />
                        </>
                      )}
                      <span>{t(`debts.status.${entry.to}`)}</span>
                    </p>
                    {entry.comment && <p className="text-sm">{entry.comment}</p>}
                    <p className="text-sm text-ink-muted">
                      {formatDateTime(entry.at)} · {entry.by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <ScheduleCard items={late.progress.items} remaining={late.remaining} />
        </div>

        <aside className="flex flex-col gap-6">
          <section className={card}>
            <CardHead
              title={t('debts.operator')}
              action={
                !closed && (
                  <Button size="sm" variant="ghost" onClick={() => setModal('operator')}>
                    {t('common.change')}
                  </Button>
                )
              }
            />
            <p className="flex items-center gap-2 text-sm font-medium">
              <UserRound size={18} className="text-ink-subtle" />
              {row.operatorName ?? <span className="text-warning">{t('debts.operator.none')}</span>}
            </p>
          </section>

          {!closed && (
            <section className={card}>
              <CardHead
                title={t('debts.nextCall')}
                action={
                  <Button size="sm" variant="ghost" onClick={() => setModal('next')}>
                    {file.nextCall ? t('common.change') : t('debts.next.set')}
                  </Button>
                }
              />
              {file.nextCall ? (
                <div className="flex flex-col gap-1">
                  <p
                    className={cn(
                      'flex items-center gap-2 text-sm font-semibold tabular-nums',
                      row.nextCallState === 'missed' && 'text-danger',
                    )}
                  >
                    <CalendarClock size={18} className="shrink-0" />
                    {formatDateTime(file.nextCall.at)}
                    {row.nextCallState === 'missed' && ` · ${t('debts.next.missedShort')}`}
                  </p>
                  {file.nextCall.note && (
                    <p className="text-sm text-ink-muted">{file.nextCall.note}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">{t('debts.next.none')}</p>
              )}
            </section>
          )}

          <section className={card}>
            <CardHead title={t('applications.col.client')} />
            <Rows
              rows={[
                [
                  t('debts.client.name'),
                  <Link key="c" to={clientPath(client.id)} className={link}>
                    {fullName(client)}
                  </Link>,
                ],
                [t('debts.client.phone'), formatPhone(client.phone)],
                [t('debts.client.address'), client.address],
              ]}
            />
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="text-sm font-semibold">{t('people.title')}</p>
              <PersonContacts contacts={client.contacts} />
            </div>
          </section>

          <section className={card}>
            <CardHead title={t('debts.nasiya')} />
            <Rows
              rows={[
                [
                  t('debts.nasiya.number'),
                  <Link key="a" to={applicationPath(application.id)} className={link}>
                    №{application.number}
                  </Link>,
                ],
                [t('debts.nasiya.goods'), application.lines.map((line) => line.name).join(', ')],
                [
                  t('products.col.merchant'),
                  <Link key="m" to={merchantPath(application.merchantId)} className={link}>
                    {row.merchantName}
                  </Link>,
                ],
                [t('debts.nasiya.total'), formatSum(application.installmentTotal)],
                [t('debts.nasiya.monthly'), formatSum(application.monthlyPayment)],
                [t('debts.nasiya.term'), t('debts.months', { count: String(application.term) })],
                [t('debts.openedAt'), formatDate(row.openedAt)],
              ]}
            />
          </section>

          {others.length > 0 && (
            <section className={card}>
              <CardHead title={t('debts.others')} />
              <ul className="flex flex-col gap-2">
                {others.map((item) => (
                  <li key={item.file.id}>
                    <Link
                      to={debtPath(item.file.id)}
                      className="flex items-center justify-between gap-3 rounded-control bg-surface px-3 py-2 text-sm hover:bg-navy-100"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="font-semibold tabular-nums">
                          №{item.application.number}
                        </span>
                        <span className="truncate text-xs text-ink-muted">
                          {t(`debts.status.${item.file.status}`)}
                        </span>
                      </span>
                      <span className="font-semibold whitespace-nowrap text-danger tabular-nums">
                        {formatSum(item.late.overdue)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {modal === 'call' && (
        <DebtCallModal
          file={file}
          target={target}
          others={others.map((item) => ({ file: item.file, href: debtPath(item.file.id) }))}
          onSave={saveBirzumCall(client.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'status' && (
        <DebtStatusModal file={file} target={target} onClose={() => setModal(null)} />
      )}
      {modal === 'next' && (
        <NextCallModal file={file} target={target} onClose={() => setModal(null)} />
      )}
      {modal === 'operator' && (
        <OperatorModal file={file} target={target} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
