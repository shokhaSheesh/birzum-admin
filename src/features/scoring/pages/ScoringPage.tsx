import { CircleX, History } from 'lucide-react'
import { useState } from 'react'
import { ratesStore } from '@/entities/pricing/pricing'
import {
  decide,
  INCOME_SOURCES,
  scoringRevisionsStore,
  scoringStore,
  shareOf,
  type IncomeSource,
  type ScoringChange,
  type ScoringRules,
} from '@/entities/scoring/scoring'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { formatDate, formatDateTime, formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { FormSection } from '@/shared/ui/FormSection'
import { NumberField } from '@/shared/ui/NumberField'
import { Switch } from '@/shared/ui/Switch'
import { TextField } from '@/shared/ui/TextField'

const VALID_MONTHS = [1, 3, 6, 12] as const

/** The rules as they are being edited: decimals stay text, whole numbers may be empty. */
type Draft = {
  multipliers: Record<IncomeSource, string>
  shares: Record<number, string>
  minLimit: number | null
  maxLimit: number | null
  validMonths: number
  minAge: number | null
  maxAge: number | null
  maxLateDays: number | null
  rejectOpenOverdue: boolean
}

const toDraft = (rules: ScoringRules, terms: number[]): Draft => ({
  ...rules,
  multipliers: Object.fromEntries(
    INCOME_SOURCES.map((source) => [source, String(rules.multipliers[source])]),
  ) as Record<IncomeSource, string>,
  shares: Object.fromEntries(terms.map((term) => [term, String(shareOf(rules, term))])),
})
const now = () => new Date()
const decimal = (text: string) => Number(text.replace(',', '.'))
const toRules = (draft: Draft, saved: ScoringRules): ScoringRules => ({
  id: 'rules',
  multipliers: Object.fromEntries(
    INCOME_SOURCES.map((source) => [source, decimal(draft.multipliers[source])]),
  ) as Record<IncomeSource, number>,
  shares: {
    ...saved.shares,
    ...Object.fromEntries(Object.entries(draft.shares).map(([term, v]) => [term, decimal(v)])),
  },
  minLimit: draft.minLimit ?? 0,
  maxLimit: draft.maxLimit ?? 0,
  validMonths: draft.validMonths,
  minAge: draft.minAge ?? 0,
  maxAge: draft.maxAge ?? 0,
  maxLateDays: draft.maxLateDays ?? 0,
  rejectOpenOverdue: draft.rejectOpenOverdue,
})

/**
 * Limit va skoring: how a shopper's limit is worked out and when they are turned down. One set
 * of rules for the platform. Beside it, a test shopper; below, who changed the rules and when.
 */
export function ScoringPage() {
  const { t } = useI18n()
  const admin = useAdmin()
  const saved = scoringStore.useAll()[0]
  const rates = [...ratesStore.useAll()].sort((a, b) => a.term - b.term)
  const terms = rates.map((rate) => rate.term)
  const revisions = scoringRevisionsStore.useAll()
  const [draft, setDraft] = useState(() => toDraft(saved, terms))
  const [income, setIncome] = useState<number | null>(5_000_000)
  const [source, setSource] = useState<IncomeSource>('salary')
  const [age, setAge] = useState<number | null>(30)
  const [today] = useState(() => new Date())

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const next = toRules(draft, saved)
  const months = (count: number) => t('term.months', { count: String(count) })
  const yesNo = (value: boolean) => t(value ? 'scoring.yes' : 'scoring.no')

  const changes: ScoringChange[] = []
  const compare = (
    label: ScoringChange['label'],
    from: string,
    to: string,
    params?: Record<string, string>,
  ) => {
    if (from !== to) changes.push({ label, params, from, to })
  }
  for (const source of INCOME_SOURCES)
    compare('scoring.multiplier', `${saved.multipliers[source]}×`, `${next.multipliers[source]}×`, {
      source,
    })
  for (const term of terms)
    compare('scoring.share', `${shareOf(saved, term)}%`, `${shareOf(next, term)}%`, {
      term: String(term),
    })
  compare('scoring.minLimit', formatSum(saved.minLimit), formatSum(next.minLimit))
  compare('scoring.maxLimit', formatSum(saved.maxLimit), formatSum(next.maxLimit))
  compare('scoring.validMonths', months(saved.validMonths), months(next.validMonths))
  compare('scoring.minAge', String(saved.minAge), String(next.minAge))
  compare('scoring.maxAge', String(saved.maxAge), String(next.maxAge))
  compare('scoring.maxLateDays', String(saved.maxLateDays), String(next.maxLateDays))
  compare(
    'scoring.rejectOpenOverdue',
    yesNo(saved.rejectOpenOverdue),
    yesNo(next.rejectOpenOverdue),
  )
  const dirty = changes.length > 0

  const inRange = (value: number, min: number, max: number) => value >= min && value <= max
  const errors = {
    multipliers: Object.fromEntries(
      INCOME_SOURCES.map((source) => [
        source,
        draft.multipliers[source].trim() === '' || !inRange(next.multipliers[source], 0.5, 20),
      ]),
    ) as Record<IncomeSource, boolean>,
    shares: Object.fromEntries(
      terms.map((term) => [
        term,
        (draft.shares[term] ?? '').trim() === '' || !inRange(shareOf(next, term), 1, 100),
      ]),
    ) as Record<number, boolean>,
    minLimit: draft.minLimit === null,
    maxLimit: draft.maxLimit === null || next.maxLimit <= next.minLimit,
    minAge: draft.minAge === null || !inRange(next.minAge, 18, 100),
    maxAge: draft.maxAge === null || !inRange(next.maxAge, next.minAge + 1, 100),
    maxLateDays: draft.maxLateDays === null || next.maxLateDays > 365,
  }
  const invalid =
    Object.values(errors.multipliers).some(Boolean) ||
    Object.values(errors.shares).some(Boolean) ||
    errors.minLimit ||
    errors.maxLimit ||
    errors.minAge ||
    errors.maxAge ||
    errors.maxLateDays

  const save = () => {
    if (invalid) {
      toast(t('pricing.error.form'), 'error')
      return
    }
    scoringStore.save(next)
    scoringRevisionsStore.save({
      id: newId(),
      date: now(),
      admin: admin?.name ?? '—',
      changes,
    })
    toast(t('scoring.saved'))
  }

  const describe = (change: ScoringChange) => {
    const params = change.params?.source
      ? { source: t(`income.${change.params.source as IncomeSource}`) }
      : change.params
    return `${t(change.label, params)}: ${change.from} → ${change.to}`
  }

  const offered = rates.filter((rate) => rate.enabled).map((rate) => rate.term)
  const decision = decide(next, { income: income ?? 0, source, age: age ?? 0 }, offered)
  const validUntil = new Date(
    today.getFullYear(),
    today.getMonth() + next.validMonths,
    today.getDate(),
  )

  return (
    <div className="flex min-h-full flex-col">
      <ActionBar eyebrow={t('navGroup.rules')} title={t('nav.scoring')}>
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
          onClick={() => setDraft(toDraft(saved, terms))}
        >
          {t('common.cancel')}
        </Button>
        <Button size="sm" className="px-4!" disabled={!dirty} onClick={save}>
          {t('common.save')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="flex flex-col gap-6">
          <FormSection title={t('scoring.base')} hint={t('scoring.base.hint')}>
            <div className="grid gap-4 sm:grid-cols-2">
              {INCOME_SOURCES.map((source) => (
                <TextField
                  key={source}
                  label={t(`income.${source}`)}
                  inputMode="decimal"
                  value={draft.multipliers[source]}
                  onChange={(e) =>
                    set({
                      multipliers: {
                        ...draft.multipliers,
                        [source]: e.target.value.replace(/[^\d.,]/g, '').slice(0, 4),
                      },
                    })
                  }
                  trailing={<span className="text-ink-muted">{t('scoring.timesIncome')}</span>}
                  error={errors.multipliers[source] ? t('scoring.error.multiplier') : undefined}
                />
              ))}
            </div>
            <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <NumberField
                label={t('scoring.minLimit')}
                value={draft.minLimit}
                onChange={(minLimit) => set({ minLimit })}
                suffix="UZS"
                hint={t('scoring.minLimit.hint')}
                error={errors.minLimit ? t('error.required') : undefined}
              />
              <NumberField
                label={t('scoring.maxLimit')}
                value={draft.maxLimit}
                onChange={(maxLimit) => set({ maxLimit })}
                suffix="UZS"
                hint={t('scoring.maxLimit.hint')}
                error={errors.maxLimit ? t('scoring.error.maxLimit') : undefined}
              />
            </div>
            <div className="border-t border-line pt-5">
              <ChoiceGrid
                label={t('scoring.validMonths')}
                hint={t('scoring.validMonths.hint')}
                columns={4}
                options={VALID_MONTHS.map((value) => ({ value, label: months(value) }))}
                value={draft.validMonths}
                onChange={(validMonths) => set({ validMonths })}
              />
            </div>
          </FormSection>

          <FormSection title={t('scoring.shares')} hint={t('scoring.shares.hint')}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rates.map((rate) => {
                const error = errors.shares[rate.term]
                return (
                  <label
                    key={rate.id}
                    className={cn(
                      'flex flex-col gap-2 rounded-control border-[1.5px] p-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-green-200',
                      error ? 'border-danger' : 'border-line',
                      !rate.enabled && 'bg-surface/60',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm">
                      <span className={cn('font-semibold', !rate.enabled && 'text-ink-muted')}>
                        {months(rate.term)}
                      </span>
                      {!rate.enabled && (
                        <span className="text-xs text-ink-subtle">{t('scoring.closed')}</span>
                      )}
                    </span>
                    <span className="flex items-baseline gap-1">
                      <input
                        inputMode="numeric"
                        value={draft.shares[rate.term] ?? ''}
                        aria-invalid={error || undefined}
                        onChange={(e) =>
                          set({
                            shares: {
                              ...draft.shares,
                              [rate.term]: e.target.value.replace(/\D/g, '').slice(0, 3),
                            },
                          })
                        }
                        className="w-full min-w-0 bg-transparent text-2xl font-bold tabular-nums outline-none"
                      />
                      <span className="text-ink-muted">%</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {Object.values(errors.shares).some(Boolean) && (
              <p className="text-sm text-danger">{t('scoring.error.share')}</p>
            )}
          </FormSection>

          <FormSection title={t('scoring.reject')} hint={t('scoring.reject.hint')}>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                label={t('scoring.minAge')}
                value={draft.minAge}
                onChange={(minAge) => set({ minAge })}
                suffix={t('scoring.years')}
                maxDigits={3}
                error={errors.minAge ? t('scoring.error.minAge') : undefined}
              />
              <NumberField
                label={t('scoring.maxAge')}
                value={draft.maxAge}
                onChange={(maxAge) => set({ maxAge })}
                suffix={t('scoring.years')}
                maxDigits={3}
                error={errors.maxAge ? t('scoring.error.maxAge') : undefined}
              />
              <NumberField
                label={t('scoring.maxLateDays')}
                value={draft.maxLateDays}
                onChange={(maxLateDays) => set({ maxLateDays })}
                suffix={t('scoring.days')}
                maxDigits={3}
                error={errors.maxLateDays ? t('scoring.error.days') : undefined}
              />
            </div>
            <p className="-mt-2 text-sm text-ink-muted">{t('scoring.maxLateDays.hint')}</p>
            <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
              <div className="flex flex-col">
                <p className="font-semibold">{t('scoring.rejectOpenOverdue')}</p>
                <p className="text-sm text-ink-muted">{t('scoring.rejectOpenOverdue.hint')}</p>
              </div>
              <Switch
                checked={draft.rejectOpenOverdue}
                onChange={(rejectOpenOverdue) => set({ rejectOpenOverdue })}
                label={t('scoring.rejectOpenOverdue')}
              />
            </div>
          </FormSection>

          <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-6">
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
                  {revision.changes.map((change, i) => (
                    <p key={i} className="font-medium tabular-nums">
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
            <h2 className="text-lg font-bold">{t('scoring.test')}</h2>
            <p className="text-sm text-ink-muted">{t('scoring.test.hint')}</p>
          </div>
          <NumberField
            label={t('scoring.test.income')}
            value={income}
            onChange={setIncome}
            suffix="UZS"
          />
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink-muted">{t('scoring.test.source')}</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as IncomeSource)}
                className="h-13 rounded-control border-[1.5px] border-line bg-canvas px-3 text-base outline-none focus:border-primary"
              >
                {INCOME_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {t(`income.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label={t('scoring.test.age')}
              value={age}
              onChange={setAge}
              maxDigits={3}
            />
          </div>

          {decision.approved ? (
            <div className="overflow-hidden rounded-control bg-surface">
              <div className="flex flex-col bg-green-200 p-4">
                <p className="text-sm text-navy-700">{t('scoring.test.limit')}</p>
                <p className="text-2xl font-bold tabular-nums">{formatSum(decision.base)}</p>
                <p className="text-sm text-navy-700">
                  {t('scoring.test.validUntil', { date: formatDate(validUntil) })}
                </p>
              </div>
              <ul className="px-4">
                {decision.limits.map(({ term, limit }) => (
                  <li
                    key={term}
                    className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0"
                  >
                    <span className="text-ink-muted">{months(term)}</span>
                    <span className="font-semibold tabular-nums">{formatSum(limit)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex gap-3 rounded-control bg-danger-soft p-4 text-danger">
              <CircleX size={22} className="shrink-0" />
              <div className="flex flex-col">
                <p className="font-bold">{t('scoring.test.rejected')}</p>
                <p className="text-sm">
                  {decision.reason === 'age'
                    ? t('scoring.test.reason.age', {
                        min: String(next.minAge),
                        max: String(next.maxAge),
                      })
                    : t('scoring.test.reason.low', { sum: formatSum(next.minLimit) })}
                </p>
              </div>
            </div>
          )}
          <p className="text-xs text-ink-subtle">{t('scoring.test.note')}</p>
        </aside>
      </div>
    </div>
  )
}
