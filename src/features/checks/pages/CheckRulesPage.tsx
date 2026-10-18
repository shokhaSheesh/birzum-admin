import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CHECK_FLAGS,
  finalScore,
  rulesHistoryStore,
  rulesStore,
  useRules,
  verdictOf,
  type CheckFlag,
  type CheckRules,
  type FlagRule,
} from '@/entities/applications/checkRules'
import { logAction } from '@/entities/audit/audit'
import { useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { formatDateTime, formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Checkbox } from '@/shared/ui/Checkbox'
import { NumberField } from '@/shared/ui/NumberField'
import { Switch } from '@/shared/ui/Switch'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'
/** What each sign's own number means, as the field's suffix. */
const UNITS: Record<CheckFlag, string | null> = {
  overdue: null,
  nearLimit: '%',
  newClient: 'kun',
  manyRunning: 'ta',
  bigAmount: 'UZS',
}
const now = () => new Date()

/** The example on the right: a shopper with these signs and this FlexSoft score. */
const EXAMPLE = { base: 82, flags: ['nearLimit', 'newClient'] as CheckFlag[] }

/**
 * The rules of Birzum's check: the two score lines that decide on their own, and each warning
 * sign with its number, its penalty and whether it always needs an admin. The formula and a
 * worked example sit beside, so the effect of a change is clear before saving.
 */
export function CheckRulesPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const admin = useAdmin()
  const saved = useRules()
  const history = rulesHistoryStore.useAll()
  const [draft, setDraft] = useState<CheckRules>(saved)
  const [submitted, setSubmitted] = useState(false)

  const setFlag = (flag: CheckFlag, patch: Partial<FlagRule>) =>
    setDraft({ ...draft, flags: { ...draft.flags, [flag]: { ...draft.flags[flag], ...patch } } })
  const inRange = (n: number) => n >= 0 && n <= 100
  const errors = {
    approveFrom: !inRange(draft.approveFrom) ? t('rules.error.range') : undefined,
    rejectBelow: !inRange(draft.rejectBelow)
      ? t('rules.error.range')
      : draft.rejectBelow >= draft.approveFrom
        ? t('rules.error.order')
        : undefined,
  }
  const flagError = (flag: CheckFlag) =>
    !inRange(draft.flags[flag].penalty) ? t('rules.error.range') : undefined

  const label = (flag: CheckFlag) => t(`check.flag.${flag}`)
  const numberText = (flag: CheckFlag, value: number) =>
    flag === 'bigAmount' ? formatSum(value) : `${value} ${UNITS[flag] ?? ''}`.trim()

  // What changed, in words, for the history and the log
  const diff = () => {
    const out: { label: string; from: string; to: string }[] = []
    if (saved.approveFrom !== draft.approveFrom)
      out.push({
        label: t('rules.approveFrom'),
        from: String(saved.approveFrom),
        to: String(draft.approveFrom),
      })
    if (saved.rejectBelow !== draft.rejectBelow)
      out.push({
        label: t('rules.rejectBelow'),
        from: String(saved.rejectBelow),
        to: String(draft.rejectBelow),
      })
    for (const flag of CHECK_FLAGS) {
      const a = saved.flags[flag]
      const b = draft.flags[flag]
      if (a.on !== b.on)
        out.push({
          label: label(flag),
          from: t(a.on ? 'rules.on' : 'rules.off'),
          to: t(b.on ? 'rules.on' : 'rules.off'),
        })
      if (a.threshold !== b.threshold)
        out.push({
          label: label(flag),
          from: numberText(flag, a.threshold),
          to: numberText(flag, b.threshold),
        })
      if (a.penalty !== b.penalty)
        out.push({
          label: `${label(flag)}: ${t('rules.penalty')}`,
          from: `−${a.penalty}`,
          to: `−${b.penalty}`,
        })
      if (a.alwaysManual !== b.alwaysManual)
        out.push({
          label: `${label(flag)}: ${t('rules.alwaysManual')}`,
          from: t(a.alwaysManual ? 'rules.yes' : 'rules.no'),
          to: t(b.alwaysManual ? 'rules.yes' : 'rules.no'),
        })
    }
    return out
  }
  const changes = diff()

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || CHECK_FLAGS.some(flagError)) return
    if (changes.length === 0) return navigate(ROUTES.checks)
    rulesStore.replaceAll([draft])
    rulesHistoryStore.save({ id: newId(), at: now(), by: admin?.name ?? '—', changes })
    logAction({
      section: 'checks',
      kind: 'update',
      action: 'audit.a.rulesSaved',
      changes: changes.map((change) => ({
        field: 'rules.title',
        ...change,
        from: `${change.label}: ${change.from}`,
        to: change.to,
      })),
    })
    toast(t('rules.saved'))
    navigate(ROUTES.checks)
  }

  const exampleScore = finalScore(EXAMPLE.base, EXAMPLE.flags, draft)
  const verdict = verdictOf(exampleScore, EXAMPLE.flags, draft)

  return (
    <>
      <ActionBar
        eyebrow={t('nav.checks')}
        title={t('rules.title')}
        onBack={() => navigate(ROUTES.checks)}
      >
        {changes.length > 0 && (
          <span className="hidden text-sm text-ink-muted sm:inline">
            {t('pricing.unsaved', { count: String(changes.length) })}
          </span>
        )}
        <button
          type="button"
          onClick={() => navigate(ROUTES.checks)}
          className="h-10 rounded-full px-4 text-sm font-semibold text-brand hover:bg-surface"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={save}
          className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-pressed"
        >
          {t('common.save')}
        </button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="flex flex-col gap-6">
          <section className={card}>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold">{t('rules.lines')}</h2>
              <p className="text-sm text-ink-muted">{t('rules.lines.hint')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label={t('rules.approveFrom')}
                value={draft.approveFrom}
                onChange={(value) => setDraft({ ...draft, approveFrom: value ?? 0 })}
                suffix={t('rules.points')}
                maxDigits={3}
                error={submitted ? errors.approveFrom : undefined}
              />
              <NumberField
                label={t('rules.rejectBelow')}
                value={draft.rejectBelow}
                onChange={(value) => setDraft({ ...draft, rejectBelow: value ?? 0 })}
                suffix={t('rules.points')}
                maxDigits={3}
                error={submitted ? errors.rejectBelow : undefined}
              />
            </div>
            {/* The three zones the two lines make */}
            <div className="flex flex-col gap-2">
              <div className="flex h-3 overflow-hidden rounded-full">
                <span className="bg-danger" style={{ width: `${draft.rejectBelow}%` }} />
                <span
                  className="bg-warning"
                  style={{ width: `${Math.max(0, draft.approveFrom - draft.rejectBelow)}%` }}
                />
                <span className="flex-1 bg-success" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span className="text-danger">
                  0–{Math.max(0, draft.rejectBelow - 1)}: {t('rules.zone.reject')}
                </span>
                <span className="text-center text-warning">
                  {draft.rejectBelow}–{Math.max(draft.rejectBelow, draft.approveFrom - 1)}:{' '}
                  {t('rules.zone.manual')}
                </span>
                <span className="text-right text-success">
                  {draft.approveFrom}–100: {t('rules.zone.approve')}
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col rounded-card border border-line bg-canvas">
            <div className="flex flex-col gap-1 p-5">
              <h2 className="text-lg font-bold">{t('rules.signs')}</h2>
              <p className="text-sm text-ink-muted">{t('rules.signs.hint')}</p>
            </div>
            <ul className="flex flex-col border-t border-line">
              {CHECK_FLAGS.map((flag) => {
                const rule = draft.flags[flag]
                const unit = UNITS[flag]
                return (
                  <li
                    key={flag}
                    className="flex flex-col gap-4 border-b border-line p-5 last:border-b-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className={cn('font-semibold', !rule.on && 'text-ink-muted')}>
                          {label(flag)}
                        </p>
                        <p className="text-sm text-ink-muted">{t(`rules.sign.${flag}`)}</p>
                      </div>
                      <Switch
                        checked={rule.on}
                        onChange={(on) => setFlag(flag, { on })}
                        label={label(flag)}
                      />
                    </div>
                    {rule.on && (
                      <div className="grid items-start gap-4 sm:grid-cols-[1fr_1fr_auto]">
                        {unit ? (
                          <NumberField
                            label={t(`rules.threshold.${flag}`)}
                            value={rule.threshold}
                            onChange={(value) => setFlag(flag, { threshold: value ?? 0 })}
                            suffix={unit}
                          />
                        ) : (
                          <span />
                        )}
                        <NumberField
                          label={t('rules.penalty')}
                          value={rule.penalty}
                          onChange={(value) => setFlag(flag, { penalty: value ?? 0 })}
                          suffix={t('rules.points')}
                          maxDigits={3}
                          error={submitted ? flagError(flag) : undefined}
                        />
                        <div className="sm:pt-8">
                          <Checkbox
                            label={t('rules.alwaysManual')}
                            checked={rule.alwaysManual}
                            onChange={(alwaysManual) => setFlag(flag, { alwaysManual })}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('pricing.history')}</h2>
            <ul className="flex flex-col">
              {history
                .slice()
                .sort((a, b) => b.at.getTime() - a.at.getTime())
                .map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0"
                  >
                    <p className="text-sm text-ink-muted">
                      {formatDateTime(entry.at)} · {entry.by}
                    </p>
                    {entry.changes.map((change, i) => (
                      <p key={i} className="text-sm">
                        <span className="font-semibold">{change.label}:</span> {change.from} →{' '}
                        {change.to}
                      </p>
                    ))}
                  </li>
                ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className={card}>
            <h2 className="font-bold">{t('rules.formula')}</h2>
            <p className="rounded-control bg-surface p-3 text-sm font-semibold">
              {t('rules.formula.line')}
            </p>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-muted">
              <li>{t('rules.formula.base')}</li>
              <li>{t('rules.formula.signs')}</li>
              <li>{t('rules.formula.lines')}</li>
              <li>{t('rules.formula.when')}</li>
            </ul>
          </section>
          <section className={card}>
            <h2 className="font-bold">{t('rules.example')}</h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">{t('check.score.base')}</dt>
                <dd className="font-semibold tabular-nums">{EXAMPLE.base}</dd>
              </div>
              {EXAMPLE.flags.map((flag) => (
                <div key={flag} className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{label(flag)}</dt>
                  <dd className="font-semibold text-warning tabular-nums">
                    {draft.flags[flag].on ? `−${draft.flags[flag].penalty}` : t('rules.off')}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                <dt className="font-semibold">{t('check.score.final')}</dt>
                <dd className="font-bold tabular-nums">{exampleScore}</dd>
              </div>
            </dl>
            <p
              className={cn(
                'rounded-control px-3 py-2 text-sm font-semibold',
                verdict === 'approve'
                  ? 'bg-success-soft text-success'
                  : verdict === 'reject'
                    ? 'bg-danger-soft text-danger'
                    : 'bg-warning-soft text-warning',
              )}
            >
              {t(`rules.verdict.${verdict}`)}
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
