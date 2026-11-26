import { CircleCheck, CircleX, Search } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EVENT_ACTORS,
  EVENT_GROUPS,
  eventsStore,
  groupOf,
  SERVICES,
  type EventEntry,
} from '@/entities/audit/events'
import type { Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { addDays, inRange, sameDay } from '@/shared/lib/dates'
import { formatDate, groupDigits } from '@/shared/lib/format'
import { boundsOf, type Period } from '@/shared/lib/period'
import { usePagination } from '@/shared/lib/usePagination'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { Pagination } from '@/shared/ui/Pagination'
import { EventModal } from './EventModal'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const time = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`

/**
 * Every step in this workspace's apps and integrations for the period, newest first and split by
 * day: who did it, what, for which client, which service answered, and whether it worked. A row
 * opens the details with the error, the request and the response.
 */
export function EventsLog({ workspace, period }: { workspace: Workspace; period: Period }) {
  const { t } = useI18n()
  const all = eventsStore.useAll().filter((entry) => entry.workspace === workspace)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [actor, setActor] = useState('')
  const [service, setService] = useState('')
  const [result, setResult] = useState('')
  const [open, setOpen] = useState<EventEntry | null>(null)
  const [today] = useState(() => new Date())

  const needle = query.trim().toLowerCase()
  const rows = all.filter(
    (entry) =>
      inRange(entry.at, boundsOf(period)) &&
      (!group || groupOf(entry.step) === group) &&
      (!actor || entry.actor.kind === actor) &&
      (!service || entry.service === service) &&
      (!result || (result === 'ok') === entry.ok) &&
      (needle === '' ||
        [
          entry.actor.name,
          entry.client?.name ?? '',
          entry.object?.label ?? '',
          entry.error?.code ?? '',
          t(`events.step.${entry.step}`, entry.params),
        ].some((text) => text.toLowerCase().includes(needle))),
  )
  const failed = rows.filter((entry) => !entry.ok).length
  const pager = usePagination(
    rows,
    JSON.stringify([period, query, group, actor, service, result, workspace]),
  )
  const dayLabel = (date: Date) =>
    sameDay(date, today)
      ? t('audit.today')
      : sameDay(date, addDays(today, -1))
        ? t('audit.yesterday')
        : formatDate(date)
  // Microloan apps have no shop steps or scoring
  const groups = EVENT_GROUPS.filter((g) => all.some((entry) => groupOf(entry.step) === g))
  const actors = EVENT_ACTORS.filter((a) => all.some((entry) => entry.actor.kind === a))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 p-4">
        <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
          <Search size={18} className="shrink-0" />
          <span className="sr-only">{t('events.search')}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('events.search')}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
        </label>
        <FilterSelect
          label={t('events.col.group')}
          options={[
            { value: '', label: t('events.allGroups') },
            ...groups.map((value) => ({ value, label: t(`events.group.${value}`) })),
          ]}
          value={group}
          onChange={setGroup}
        />
        <FilterSelect
          label={t('events.col.who')}
          options={[
            { value: '', label: t('events.allActors') },
            ...actors.map((value) => ({ value, label: t(`events.actor.${value}`) })),
          ]}
          value={actor}
          onChange={setActor}
        />
        <FilterSelect
          label={t('events.col.service')}
          options={[
            { value: '', label: t('events.allServices') },
            ...SERVICES.map((value) => ({ value, label: value })),
          ]}
          value={service}
          onChange={setService}
        />
        <FilterSelect
          label={t('events.col.result')}
          options={[
            { value: '', label: t('events.allResults') },
            { value: 'ok', label: t('events.ok') },
            { value: 'failed', label: t('events.failed') },
          ]}
          value={result}
          onChange={setResult}
        />
      </div>
      <p className="px-4 pb-3 text-sm text-ink-muted">
        {t('audit.count', { count: groupDigits(rows.length) })}
        {failed > 0 && (
          <>
            {' · '}
            <button
              type="button"
              onClick={() => setResult(result === 'failed' ? '' : 'failed')}
              className="font-semibold text-danger hover:underline"
            >
              {t('events.failedCount', { count: groupDigits(failed) })}
            </button>
          </>
        )}
      </p>

      {rows.length === 0 ? (
        <EmptyState title={t('audit.empty')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={`${th} w-24`}>{t('audit.col.time')}</th>
                <th className={th}>{t('events.col.step')}</th>
                <th className={th}>{t('events.col.who')}</th>
                <th className={th}>{t('events.col.client')}</th>
                <th className={th}>{t('events.col.service')}</th>
                <th className={th}>{t('events.col.result')}</th>
              </tr>
            </thead>
            <tbody>
              {pager.rows.map((entry, i) => {
                const previous = pager.rows[i - 1]
                const newDay = !previous || !sameDay(previous.at, entry.at)
                return (
                  <Fragment key={entry.id}>
                    {newDay && (
                      <tr className="border-b border-line bg-surface/60">
                        <td
                          colSpan={6}
                          className="px-4 py-2 text-xs font-bold tracking-wide text-ink-muted uppercase"
                        >
                          {dayLabel(entry.at)}
                        </td>
                      </tr>
                    )}
                    <tr
                      onClick={() => setOpen(entry)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3 text-sm text-ink-muted tabular-nums">
                        {time(entry.at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex flex-col">
                          <span className="font-semibold">
                            {t(`events.step.${entry.step}`, entry.params)}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {t(`events.group.${groupOf(entry.step)}`)}
                            {entry.object && ` · ${entry.object.label}`}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex flex-col">
                          <span className="truncate">{entry.actor.name}</span>
                          <span className="text-xs text-ink-muted">
                            {t(`events.actor.${entry.actor.kind}`)}
                          </span>
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        onClick={(e) => entry.client && e.stopPropagation()}
                      >
                        {entry.client ? (
                          <Link to={entry.client.href} className="text-brand hover:underline">
                            {entry.client.name}
                          </Link>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-muted">{entry.service ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {entry.ok ? (
                          <span className="flex items-center gap-1.5 font-medium text-success">
                            <CircleCheck size={16} />
                            {t('events.ok')}
                          </span>
                        ) : (
                          <span className="flex flex-col text-danger">
                            <span className="flex items-center gap-1.5 font-medium">
                              <CircleX size={16} />
                              {t('events.failed')}
                            </span>
                            <span className="text-xs break-all">{entry.error?.code}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pager={pager} />
      {open && <EventModal entry={open} onClose={() => setOpen(null)} />}
    </>
  )
}
