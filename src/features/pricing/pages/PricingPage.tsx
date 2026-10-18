import { History, Info, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  quote,
  ratesStore,
  revisionsStore,
  TERM_RANGE,
  type RateChange,
  type TermRate,
} from '@/entities/pricing/pricing'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'
import { Switch } from '@/shared/ui/Switch'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/** A row as it is being edited: numbers stay text until saved. A new row's term is editable. */
type Draft = { id: string; term: string; markup: string; enabled: boolean; isNew?: boolean }

const toDraft = (rates: TermRate[]): Draft[] =>
  [...rates]
    .sort((a, b) => a.term - b.term)
    .map((rate) => ({ ...rate, term: String(rate.term), markup: String(rate.markup) }))
const percentOf = (draft: Draft) => Number(draft.markup.replace(',', '.'))
const monthsOf = (draft: Draft) => Number(draft.term)

/**
 * Ustama: the markup for every installment term, and whether shoppers can pick the term.
 * Beside it, what a shopper would pay at these rates; below, who changed them and when.
 */
export function PricingPage() {
  const { t } = useI18n()
  const admin = useAdmin()
  const saved = ratesStore.useAll()
  const revisions = revisionsStore.useAll()
  const [drafts, setDrafts] = useState(() => toDraft(saved))
  const [amount, setAmount] = useState<number | null>(10_000_000)

  const edit = (id: string, patch: Partial<Draft>) =>
    setDrafts(drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)))

  const add = () =>
    setDrafts([...drafts, { id: newId(), term: '', markup: '', enabled: true, isNew: true }])
  const drop = (id: string) => setDrafts(drafts.filter((draft) => draft.id !== id))

  const changes: RateChange[] = [
    ...saved
      .filter((rate) => !drafts.some((draft) => draft.id === rate.id))
      .map((rate): RateChange => ({ term: rate.term, field: 'removed' })),
    ...drafts.flatMap((draft): RateChange[] => {
      const before = saved.find((rate) => rate.id === draft.id)
      if (!before) return [{ term: monthsOf(draft), field: 'added', to: percentOf(draft) }]
      const list: RateChange[] = []
      if (draft.enabled !== before.enabled)
        list.push({ term: before.term, field: 'enabled', to: draft.enabled })
      if (percentOf(draft) !== before.markup)
        list.push({ term: before.term, field: 'markup', from: before.markup, to: percentOf(draft) })
      return list
    }),
  ]
  const dirty = changes.length > 0

  const termErrors = new Map<string, string>()
  for (const draft of drafts.filter((item) => item.isNew)) {
    const months = monthsOf(draft)
    if (!(Number.isInteger(months) && months >= TERM_RANGE.min && months <= TERM_RANGE.max))
      termErrors.set(draft.id, t('pricing.error.term', { max: String(TERM_RANGE.max) }))
    else if (drafts.some((other) => other.id !== draft.id && monthsOf(other) === months))
      termErrors.set(draft.id, t('pricing.error.duplicate'))
  }
  // A longer term must not cost less than a shorter one
  const errors = new Map<string, string>()
  let floor = 0
  const ordered = [...drafts]
    .filter((draft) => !termErrors.has(draft.id))
    .sort((a, b) => monthsOf(a) - monthsOf(b))
  for (const draft of ordered) {
    const percent = percentOf(draft)
    if (draft.markup.trim() === '' || !(percent >= 0 && percent <= 300))
      errors.set(draft.id, t('pricing.error.range'))
    else if (draft.enabled && percent < floor) errors.set(draft.id, t('pricing.error.order'))
    if (draft.enabled && percent >= floor) floor = percent
  }
  for (const draft of drafts)
    if (!errors.has(draft.id) && (draft.markup.trim() === '' || !(percentOf(draft) >= 0)))
      errors.set(draft.id, t('pricing.error.range'))
  const noneEnabled = !drafts.some((draft) => draft.enabled)

  const save = () => {
    if (errors.size > 0 || termErrors.size > 0 || noneEnabled) {
      toast(t('pricing.error.form'), 'error')
      return
    }
    saved
      .filter((rate) => !drafts.some((draft) => draft.id === rate.id))
      .forEach((rate) => ratesStore.remove(rate.id))
    drafts.forEach((draft) =>
      ratesStore.save({
        id: draft.id,
        term: monthsOf(draft),
        markup: percentOf(draft),
        enabled: draft.enabled,
      }),
    )
    setDrafts(toDraft(ratesStore.getAll()))
    revisionsStore.save({
      id: newId(),
      date: new Date(),
      admin: admin?.name ?? '—',
      changes,
    })
    toast(t('pricing.saved'))
  }

  const describe = (change: RateChange) => {
    const term = t('term.months', { count: String(change.term) })
    switch (change.field) {
      case 'markup':
        return `${term}: ${change.from}% → ${change.to}%`
      case 'enabled':
        return `${term}: ${t(change.to ? 'pricing.turnedOn' : 'pricing.turnedOff')}`
      case 'added':
        return `${term}: ${t('pricing.added', { percent: String(change.to) })}`
      case 'removed':
        return `${term}: ${t('pricing.removed')}`
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <ActionBar eyebrow={t('navGroup.rules')} title={t('nav.pricing')}>
        {dirty && (
          <span className="hidden pr-2 text-sm text-ink-muted sm:block">
            {t('pricing.unsaved', { count: String(changes.length) })}
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="px-4!"
          disabled={!dirty}
          onClick={() => setDrafts(toDraft(saved))}
        >
          {t('common.cancel')}
        </Button>
        <Button size="sm" className="px-4!" disabled={!dirty} onClick={save}>
          {t('common.save')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <div className="flex flex-col gap-1 p-5">
              <h2 className="text-lg font-bold">{t('pricing.rates')}</h2>
              <p className="text-sm text-ink-muted">{t('pricing.rates.hint')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('pricing.col.term')}</th>
                    <th className={th}>{t('nav.pricing')}</th>
                    <th className={th}>{t('pricing.col.perMonth')}</th>
                    <th className={`${th} text-right`}>{t('pricing.col.offered')}</th>
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => {
                    const error = errors.get(draft.id)
                    const termError = termErrors.get(draft.id)
                    const percent = percentOf(draft)
                    const months = monthsOf(draft)
                    return (
                      <tr
                        key={draft.id}
                        className={cn(
                          'border-b border-line align-top last:border-b-0',
                          !draft.enabled && 'bg-surface/60',
                        )}
                      >
                        <td className="px-4 py-4">
                          {draft.isNew ? (
                            <>
                              <label
                                className={cn(
                                  'flex h-11 items-center gap-1 rounded-control border-[1.5px] bg-canvas px-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-green-200 w-28',
                                  termError ? 'border-danger' : 'border-line',
                                )}
                              >
                                <span className="sr-only">{t('pricing.col.term')}</span>
                                <input
                                  inputMode="numeric"
                                  autoFocus
                                  placeholder="15"
                                  value={draft.term}
                                  aria-invalid={!!termError || undefined}
                                  onChange={(e) =>
                                    edit(draft.id, {
                                      term: e.target.value.replace(/\D/g, '').slice(0, 2),
                                    })
                                  }
                                  className="min-w-0 flex-1 bg-transparent font-semibold tabular-nums outline-none"
                                />
                                <span className="text-ink-muted">{t('pricing.monthsUnit')}</span>
                              </label>
                              {termError && (
                                <p className="max-w-40 pt-1.5 text-sm text-danger">{termError}</p>
                              )}
                            </>
                          ) : (
                            <p
                              className={cn(
                                'pt-2.5 font-semibold',
                                !draft.enabled && 'text-ink-muted',
                              )}
                            >
                              {t('term.months', { count: draft.term })}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <label
                            className={cn(
                              'flex h-11 items-center gap-1 rounded-control border-[1.5px] bg-canvas px-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-green-200 w-28',
                              error ? 'border-danger' : 'border-line',
                            )}
                          >
                            <span className="sr-only">
                              {t('nav.pricing')}, {t('term.months', { count: draft.term })}
                            </span>
                            <input
                              inputMode="decimal"
                              value={draft.markup}
                              aria-invalid={!!error || undefined}
                              onChange={(e) =>
                                edit(draft.id, {
                                  markup: e.target.value.replace(/[^\d.,]/g, '').slice(0, 6),
                                })
                              }
                              className="min-w-0 flex-1 bg-transparent font-semibold tabular-nums outline-none"
                            />
                            <span className="text-ink-muted">%</span>
                          </label>
                          {error && <p className="pt-1.5 text-sm text-danger">{error}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="pt-2.5 text-ink-muted tabular-nums">
                            {Number.isFinite(percent) && months > 0
                              ? `≈ ${(percent / months).toFixed(1).replace('.0', '')}%`
                              : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end pt-2">
                            <Switch
                              checked={draft.enabled}
                              onChange={(enabled) => edit(draft.id, { enabled })}
                              label={t('pricing.col.offered')}
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          <button
                            type="button"
                            onClick={() => drop(draft.id)}
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
                            className="mt-0.5 grid size-10 place-items-center rounded-full text-ink-subtle hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-3 py-2">
              <Button size="sm" variant="ghost" onClick={add}>
                <Plus size={18} />
                {t('pricing.add')}
              </Button>
            </div>
            {noneEnabled && (
              <p className="border-t border-line px-5 py-3 text-sm text-danger">
                {t('pricing.error.none')}
              </p>
            )}
          </section>

          <p className="flex gap-3 rounded-card bg-navy-100 p-4 text-sm text-ink">
            <Info size={20} className="shrink-0 text-brand" />
            {t('pricing.note')}
          </p>

          <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <History size={20} className="text-brand" />
              {t('pricing.history')}
            </h2>
            <ol className="flex flex-col">
              {revisions.map((revision) => (
                <li
                  key={revision.id}
                  className="relative flex flex-col gap-1 border-l-2 border-line pb-5 pl-5 last:pb-0"
                >
                  <span className="absolute top-1.5 -left-[7px] size-3 rounded-full border-2 border-canvas bg-primary" />
                  <p className="text-sm text-ink-muted">
                    {formatDateTime(revision.date)} · {revision.admin}
                  </p>
                  {revision.changes.map((change) => (
                    <p key={`${change.term}-${change.field}`} className="font-medium tabular-nums">
                      {describe(change)}
                    </p>
                  ))}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5 lg:sticky lg:top-24">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold">{t('pricing.preview')}</h2>
            <p className="text-sm text-ink-muted">{t('pricing.preview.hint')}</p>
          </div>
          <NumberField
            label={t('pricing.preview.amount')}
            value={amount}
            onChange={setAmount}
            suffix="UZS"
          />
          <ul className="flex flex-col rounded-control bg-surface px-4">
            {ordered
              .filter((draft) => draft.enabled && !errors.has(draft.id))
              .map((draft) => {
                const { total, monthly } = quote(amount ?? 0, monthsOf(draft), percentOf(draft))
                return (
                  <li
                    key={draft.id}
                    className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
                  >
                    <span className="font-semibold">{t('term.months', { count: draft.term })}</span>
                    <span className="flex flex-col items-end">
                      <span className="font-bold tabular-nums">
                        {t('pricing.perMonth', { sum: formatSum(monthly) })}
                      </span>
                      <span className="text-sm text-ink-muted tabular-nums">
                        {t('pricing.total', { sum: formatSum(total) })}
                      </span>
                    </span>
                  </li>
                )
              })}
          </ul>
        </aside>
      </div>
    </div>
  )
}
