import { CalendarClock, MessageSquareText } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { initialsOfName } from '@/entities/admins/admins'
import {
  AUTO_STATUSES,
  CRITICAL_DAYS,
  DEBT_STATUSES,
  DEBT_TONES,
  type DebtStatus,
} from '@/entities/collections/debtCases'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { BoardRow } from '../lib/board'

const DOTS: Record<'success' | 'warning' | 'danger' | 'info' | 'neutral', string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-brand',
  neutral: 'bg-ink-subtle',
}

/**
 * The debts as columns, one per status. A card is dragged to another column to move it; the
 * status modal then asks why. Yangi qarz and Yopildi are the system's, so nothing lands there.
 */
export function DebtBoard({
  rows,
  onMove,
}: {
  rows: BoardRow[]
  onMove: (row: BoardRow, to: DebtStatus) => void
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [dragging, setDragging] = useState<BoardRow | null>(null)
  const [over, setOver] = useState<DebtStatus | null>(null)

  const canDrop = (status: DebtStatus) =>
    !!dragging && status !== dragging.file.status && !AUTO_STATUSES.includes(status)

  const drop = (status: DebtStatus) => (e: DragEvent) => {
    e.preventDefault()
    if (dragging && canDrop(status)) onMove(dragging, status)
    setDragging(null)
    setOver(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-4">
      {DEBT_STATUSES.map((status) => {
        const cards = rows.filter((row) => row.file.status === status)
        const sum = cards.reduce((total, row) => total + row.overdue, 0)
        const auto = AUTO_STATUSES.includes(status)
        const target = canDrop(status)
        return (
          <section
            key={status}
            aria-label={t(`debts.status.${status}`)}
            onDragOver={(e) => {
              if (!target) return
              e.preventDefault()
              setOver(status)
            }}
            onDragLeave={() => setOver((current) => (current === status ? null : current))}
            onDrop={drop(status)}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-card bg-surface transition-colors',
              dragging && !target && status !== dragging.file.status && 'opacity-50',
              over === status && 'bg-navy-200 ring-2 ring-brand',
            )}
          >
            <header className="flex flex-col gap-0.5 px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <span className={cn('size-2 shrink-0 rounded-full', DOTS[DEBT_TONES[status]])} />
                <h3 className="min-w-0 flex-1 truncate text-sm font-bold">
                  {t(`debts.status.${status}`)}
                </h3>
                <span className="text-sm font-semibold text-ink-muted tabular-nums">
                  {cards.length}
                </span>
              </div>
              <p className="pl-4 text-xs text-ink-muted tabular-nums">
                {sum ? formatSum(sum) : '—'}
                {auto && <> · {t('debts.board.auto')}</>}
              </p>
            </header>
            <ol className="flex max-h-[calc(100vh-280px)] min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {cards.length === 0 && (
                <li className="rounded-control border border-dashed border-line px-3 py-6 text-center text-xs text-ink-subtle">
                  {t('debts.board.empty')}
                </li>
              )}
              {cards.map((row) => {
                const closed = status === 'closed'
                return (
                  <li key={row.file.id}>
                    <article
                      draggable={!closed}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', row.file.id)
                        setDragging(row)
                      }}
                      onDragEnd={() => {
                        setDragging(null)
                        setOver(null)
                      }}
                      onClick={() => navigate(row.href)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(row.href)
                      }}
                      tabIndex={0}
                      className={cn(
                        'flex cursor-pointer flex-col gap-2 rounded-control border border-line bg-canvas p-3 text-sm shadow-xs outline-none hover:border-navy-400 focus-visible:ring-3 focus-visible:ring-green-200',
                        !closed && 'active:cursor-grabbing',
                        dragging?.file.id === row.file.id && 'opacity-40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">{row.name}</span>
                          <span className="text-xs text-ink-muted tabular-nums">
                            {formatPhone(row.phone)}
                          </span>
                        </div>
                        {!closed && row.days > 0 && (
                          <StatusBadge tone={row.days >= CRITICAL_DAYS ? 'danger' : 'warning'}>
                            {t('collections.days', { days: String(row.days) })}
                          </StatusBadge>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            'text-lg font-bold tabular-nums',
                            !closed && row.overdue > 0 && 'text-danger',
                          )}
                        >
                          {formatSum(closed ? row.remaining : row.overdue)}
                        </span>
                        <span className="truncate text-xs text-ink-muted">{row.ref}</span>
                      </div>
                      <p className="truncate text-xs text-ink-muted">{row.sub}</p>
                      {row.file.nextCall && row.nextCallState !== 'none' && (
                        <p
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium tabular-nums',
                            row.nextCallState === 'missed'
                              ? 'text-danger'
                              : row.nextCallState === 'today'
                                ? 'text-brand'
                                : 'text-ink-muted',
                          )}
                        >
                          <CalendarClock size={14} className="shrink-0" />
                          {row.nextCallState === 'missed'
                            ? t('debts.next.missed', { at: formatDateTime(row.file.nextCall.at) })
                            : formatDateTime(row.file.nextCall.at)}
                        </p>
                      )}
                      {row.lastNote && (
                        <p className="flex gap-1.5 rounded-lg bg-warning-soft px-2 py-1.5 text-xs text-ink">
                          <MessageSquareText size={14} className="mt-px shrink-0 text-warning" />
                          <span className="line-clamp-2">{row.lastNote.text}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                        {row.operatorName ? (
                          <>
                            <span className="grid size-5 place-items-center rounded-full bg-navy-200 text-[10px] font-bold text-brand">
                              {initialsOfName(row.operatorName)}
                            </span>
                            <span className="truncate">{row.operatorName}</span>
                          </>
                        ) : (
                          <span className="text-warning">{t('debts.operator.none')}</span>
                        )}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
