import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsStore, financedOf } from '@/entities/applications/applications'
import { useRules } from '@/entities/applications/checkRules'
import { checksStore, type CheckState } from '@/entities/applications/checks'
import { merchantsStore } from '@/entities/merchants/merchants'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { checkPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime, formatSum, groupDigits } from '@/shared/lib/format'
import { usePagination } from '@/shared/lib/usePagination'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FilterSelect } from '@/shared/ui/FilterSelect'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { FlagChips } from '../components/FlagChips'
import { ScoreMeter } from '../components/ScoreMeter'
import { waitedFor } from '../model/waiting'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
type Tab = CheckState | 'all'

/**
 * Birzum's check of each ariza before the goods are handed over. The scoring approves most on
 * its own; the rest wait here for an admin, oldest first. Each opens to see why it is here and
 * to approve or reject it.
 */
export function ChecksPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const checks = checksStore.useAll()
  const applications = applicationsStore.useAll()
  const merchants = merchantsStore.useAll()
  const [tab, setTab] = useState<Tab>('waiting')
  const [query, setQuery] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [mode, setMode] = useState('')
  const [now] = useState(() => new Date())
  const rules = useRules()

  const rowsOf = checks
    .map((check) => ({ check, application: applications.find((a) => a.id === check.id)! }))
    .filter(({ application }) => !!application)
  const needle = query.trim().toLowerCase()
  const filtered = rowsOf.filter(
    ({ check, application }) =>
      (!merchantId || application.merchantId === merchantId) &&
      (!mode || check.mode === mode) &&
      (needle === '' ||
        String(application.number).includes(needle.replace(/\s/g, '')) ||
        application.client.name.toLowerCase().includes(needle) ||
        application.client.phone.includes(needle.replace(/\D/g, '') || '—')),
  )
  const rows = filtered
    .filter(({ check }) => tab === 'all' || check.state === tab)
    .sort((a, b) =>
      tab === 'waiting'
        ? a.check.checkedAt.getTime() - b.check.checkedAt.getTime()
        : b.check.checkedAt.getTime() - a.check.checkedAt.getTime(),
    )
  const pager = usePagination(rows, JSON.stringify([tab, query, merchantId, mode]))

  const waiting = rowsOf.filter(({ check }) => check.state === 'waiting')
  const decided = checks.filter((check) => check.state !== 'waiting')
  const autoShare = decided.length
    ? Math.round((decided.filter((check) => check.mode === 'auto').length / decided.length) * 100)
    : 0
  const oldest = waiting.reduce<Date | null>(
    (min, { check }) => (!min || check.checkedAt < min ? check.checkedAt : min),
    null,
  )
  const manual = decided.filter((check) => check.mode === 'manual')
  const manualRejected = manual.filter((check) => check.state === 'rejected').length
  const waitedText = (since: Date) => {
    const { key, count } = waitedFor(since, now)
    return t(key, { count })
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.checks')}
        description={t('checks.description')}
        actions={
          <Button
            size="sm"
            variant="secondary"
            className="border border-line bg-canvas!"
            onClick={() => navigate(ROUTES.checkRules)}
          >
            <SlidersHorizontal size={18} />
            {t('rules.title')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('checks.stat.waiting')}
          value={groupDigits(waiting.length)}
          hint={
            oldest ? t('checks.stat.oldest', { time: waitedText(oldest) }) : t('checks.stat.none')
          }
        />
        <StatCard
          label={t('checks.stat.auto')}
          value={`${autoShare}%`}
          hint={t('checks.stat.autoHint', { score: String(rules.approveFrom) })}
        />
        <StatCard
          label={t('checks.stat.manual')}
          value={groupDigits(manual.length)}
          hint={t('checks.stat.manualHint', { count: groupDigits(manualRejected) })}
        />
        <StatCard
          label={t('checks.stat.total')}
          value={groupDigits(checks.length)}
          hint={t('checks.stat.totalHint')}
        />
      </div>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('nav.checks')}
            options={(['waiting', 'approved', 'rejected', 'all'] as const).map((value) => ({
              value,
              label: value === 'all' ? t('common.all') : t(`check.state.${value}`),
              count: filtered.filter(({ check }) => value === 'all' || check.state === value)
                .length,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('checks.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('checks.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
          <FilterSelect
            label={t('products.col.merchant')}
            options={[
              { value: '', label: t('products.allMerchants') },
              ...merchants.map((item) => ({ value: item.id, label: item.name })),
            ]}
            value={merchantId}
            onChange={setMerchantId}
          />
          {tab !== 'waiting' && (
            <FilterSelect
              label={t('check.mode')}
              options={[
                { value: '', label: t('check.mode.all') },
                { value: 'auto', label: t('check.mode.auto') },
                { value: 'manual', label: t('check.mode.manual') },
              ]}
              value={mode}
              onChange={setMode}
            />
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState title={tab === 'waiting' ? t('checks.empty.waiting') : t('checks.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('checks.col.application')}</th>
                  <th className={th}>{t('applications.col.client')}</th>
                  <th className={th}>{t('products.col.merchant')}</th>
                  <th className={`${th} text-right`}>{t('checks.col.sum')}</th>
                  <th className={th}>{t('checks.col.score')}</th>
                  <th className={th}>{t('checks.col.flags')}</th>
                  <th className={th}>
                    {tab === 'waiting' ? t('checks.col.waiting') : t('checks.col.decision')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pager.rows.map(({ check, application }) => {
                  const merchant = merchants.find((m) => m.id === application.merchantId)
                  return (
                    <tr
                      key={check.id}
                      onClick={() => navigate(checkPath(check.id))}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold tabular-nums">
                            № {groupDigits(application.number)}
                          </span>
                          <span className="text-xs text-ink-muted tabular-nums">
                            {formatDateTime(application.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{application.client.name}</td>
                      <td className="px-4 py-3">
                        {merchant && (
                          <span className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <MerchantLogo merchant={merchant} size="xs" />
                            {merchant.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                            {formatSum(financedOf(application))}
                          </span>
                          <span className="text-xs whitespace-nowrap text-ink-muted tabular-nums">
                            {t('checks.perMonth', {
                              term: String(application.term),
                              sum: groupDigits(application.monthlyPayment),
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreMeter score={check.score} />
                      </td>
                      <td className="max-w-64 px-4 py-3">
                        <FlagChips flags={check.flags} />
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {check.state === 'waiting' ? (
                          <span className="font-semibold text-warning">
                            {waitedText(check.checkedAt)}
                          </span>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge tone={check.state === 'approved' ? 'success' : 'danger'}>
                              {t(`check.state.${check.state}`)}
                            </StatusBadge>
                            <span className="text-xs text-ink-muted">
                              {check.mode === 'auto' ? t('check.mode.auto') : check.decidedBy}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pager={pager} />
      </div>
    </div>
  )
}
