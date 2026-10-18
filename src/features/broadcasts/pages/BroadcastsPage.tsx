import { Ban, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BROADCAST_STATUSES,
  broadcastsStore,
  type Broadcast,
  type BroadcastStatus,
} from '@/entities/broadcasts/broadcasts'
import { broadcastEditPath, broadcastPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime, groupDigits } from '@/shared/lib/format'
import { usePagination } from '@/shared/lib/usePagination'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { RowActions } from '@/shared/ui/RowActions'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { useAudienceText } from '../model/useAudienceText'
import { broadcastStatusTone, openRateOf } from '../components/broadcastLabels'
import { BroadcastActions } from '../components/BroadcastActions'
import { useBroadcastActions } from '../model/useBroadcastActions'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Every message Birzum sent or will send: figures for this month, then the list by status.
 * "Xabar yuborish" opens the full form.
 */
export function BroadcastsPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const all = broadcastsStore.useAll()
  const audienceText = useAudienceText()
  const actions = useBroadcastActions()
  const [tab, setTab] = useState<'all' | BroadcastStatus>('all')
  const [query, setQuery] = useState('')
  const [today] = useState(() => new Date())

  const needle = query.trim().toLowerCase()
  const filtered = all
    .filter(
      (b) =>
        needle === '' ||
        [b.title.uz, b.title.ru, b.body.uz, b.body.ru].some((v) =>
          v.toLowerCase().includes(needle),
        ),
    )
    .sort((a, b) => (b.sendAt ?? b.createdAt).getTime() - (a.sendAt ?? a.createdAt).getTime())
  const rows = filtered.filter((b) => tab === 'all' || b.status === tab)
  const pager = usePagination(rows, JSON.stringify([tab, query]))

  const sentThisMonth = all.filter(
    (b) =>
      b.status === 'sent' &&
      b.sendAt &&
      b.sendAt.getMonth() === today.getMonth() &&
      b.sendAt.getFullYear() === today.getFullYear(),
  )
  const reached = sentThisMonth.reduce((sum, b) => sum + (b.stats?.delivered ?? 0), 0)
  const opened = sentThisMonth.reduce((sum, b) => sum + (b.stats?.opened ?? 0), 0)
  const scheduled = all.filter((b) => b.status === 'scheduled')
  const nextOut = scheduled.map((b) => b.sendAt!).sort((a, b) => a.getTime() - b.getTime())[0]

  const rowActions = (b: Broadcast) => [
    { icon: Eye, label: t('common.view'), onClick: () => navigate(broadcastPath(b.id)) },
    ...(b.status === 'draft' || b.status === 'scheduled'
      ? [
          {
            icon: Pencil,
            label: t('common.edit'),
            onClick: () => navigate(broadcastEditPath(b.id)),
          },
        ]
      : []),
    ...(b.status === 'scheduled'
      ? [
          {
            icon: Ban,
            label: t('broadcast.cancel'),
            onClick: () => actions.askCancel(b),
            danger: true,
          },
        ]
      : []),
    ...(b.status === 'draft' || b.status === 'cancelled'
      ? [
          {
            icon: Trash2,
            label: t('common.delete'),
            onClick: () => actions.askDelete(b),
            danger: true,
          },
        ]
      : []),
  ]

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.broadcasts')}
        description={t('broadcasts.description')}
        actions={
          <Button onClick={() => navigate(ROUTES.broadcastNew)}>
            <Plus size={20} />
            {t('broadcast.new')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('broadcasts.stat.sent')}
          value={groupDigits(sentThisMonth.length)}
          hint={t('broadcasts.stat.thisMonth')}
        />
        <StatCard
          label={t('broadcasts.stat.reached')}
          value={groupDigits(reached)}
          hint={t('broadcasts.stat.reachedHint')}
        />
        <StatCard
          label={t('broadcasts.stat.openRate')}
          value={reached ? `${Math.round((opened / reached) * 100)}%` : '—'}
          hint={t('broadcasts.stat.openRateHint')}
        />
        <StatCard
          label={t('broadcast.status.scheduled')}
          value={groupDigits(scheduled.length)}
          hint={nextOut ? t('broadcasts.stat.next', { date: formatDateTime(nextOut) }) : undefined}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('nav.broadcasts')}
            options={[
              { value: 'all', label: t('common.all'), count: filtered.length },
              ...BROADCAST_STATUSES.map((value) => ({
                value,
                label: t(`broadcast.status.${value}`),
                count: filtered.filter((b) => b.status === value).length,
              })),
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="flex p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('broadcasts.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('broadcasts.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
        </div>
        {rows.length === 0 ? (
          <EmptyState title={t('broadcasts.empty')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('broadcast.message')}</th>
                    <th className={th}>{t('broadcast.audience')}</th>
                    <th className={th}>{t('collections.col.date')}</th>
                    <th className={th}>{t('broadcast.opened')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                    <th className="w-32" />
                  </tr>
                </thead>
                <tbody>
                  {pager.rows.map((b) => {
                    const rate = openRateOf(b)
                    return (
                      <tr
                        key={b.id}
                        onClick={() => navigate(broadcastPath(b.id))}
                        className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                      >
                        <td className="max-w-[320px] px-4 py-3">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold">{tl(b.title)}</span>
                            <span className="truncate text-sm text-ink-muted">{tl(b.body)}</span>
                          </div>
                        </td>
                        <td className="max-w-48 px-4 py-3">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">
                              {audienceText.partsOf(b.audience)[1]}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {audienceText.partsOf(b.audience)[0]} · Push{b.sms && ' + SMS'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                          {b.sendAt ? formatDateTime(b.sendAt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {rate === null ? (
                            <span className="text-sm text-ink-subtle">—</span>
                          ) : (
                            <div className="flex w-28 flex-col gap-1">
                              <span className="text-sm font-semibold tabular-nums">
                                {rate}%{' '}
                                <span className="font-normal text-ink-muted">
                                  · {groupDigits(b.stats!.delivered)}
                                </span>
                              </span>
                              <span className="h-1.5 rounded-full bg-surface">
                                <span
                                  className="block h-full rounded-full bg-green-500"
                                  style={{ width: `${rate}%` }}
                                />
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={broadcastStatusTone[b.status]}>
                            {t(`broadcast.status.${b.status}`)}
                          </StatusBadge>
                        </td>
                        <td className="pr-3">
                          <RowActions actions={rowActions(b)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pager={pager} />
          </>
        )}
      </div>

      <BroadcastActions {...actions} />
    </div>
  )
}
