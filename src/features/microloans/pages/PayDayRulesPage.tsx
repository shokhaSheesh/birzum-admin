import { Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  payDayRulesStore,
  payDaysFor,
  ruleRevisionsStore,
  type PayDayRule,
  type PayDayRules,
  type RuleChange,
} from '@/entities/microloans/rules'
import { useAdmin } from '@/entities/session/session'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { NumberField } from '@/shared/ui/NumberField'
import { SelectField } from '@/shared/ui/SelectField'
import { RuleHistory } from '../components/RuleHistory'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)
const now = () => new Date()

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className={card}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-ink-muted">{hint}</p>
      </div>
      {children}
    </section>
  )
}

/**
 * Toʻlov kuni of a microloan brand: which payment days the app's calculator offers. Either the
 * same fixed days for everyone, or by the day the client applies: lines of «applies between these
 * days → may pick 1 up to N, or up to the day they apply», and after a set day only the 1st of
 * next month. On the right, what a client who applies on a chosen day would see.
 */
export function PayDayRulesPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const saved = payDayRulesStore.useAll().find((rules) => rules.id === brand)!
  const [draft, setDraft] = useState<PayDayRules>(saved)
  const [submitted, setSubmitted] = useState(false)
  const [appDay, setAppDay] = useState(12)
  const set = (patch: Partial<PayDayRules>) => setDraft({ ...draft, ...patch })
  const setRule = (i: number, patch: Partial<PayDayRule>) =>
    set({ rules: draft.rules.map((rule, j) => (j === i ? { ...rule, ...patch } : rule)) })

  // Each line starts after the one before and stays within the month and before the cut-off
  const lineErrors = draft.rules.map((rule, i) => {
    const before = i === 0 ? 0 : draft.rules[i - 1].to
    if (rule.from <= before || rule.to < rule.from) return t('payDay.error.order')
    if (rule.to > draft.after) return t('payDay.error.after', { day: String(draft.after) })
    return undefined
  })
  const errors = {
    fixed: draft.mode === 'fixed' && draft.fixedDays.length === 0,
    lines: draft.mode === 'byDay' && (draft.rules.length === 0 || lineErrors.some(Boolean)),
    after: draft.mode === 'byDay' && (draft.after < 1 || draft.after > 28),
  }

  const modeText = (mode: PayDayRules['mode']) => t(`payDay.mode.${mode}`)
  const lineText = (rules: PayDayRule[]) =>
    rules
      .map((rule) =>
        t('payDay.line', {
          from: String(rule.from),
          to: String(rule.to),
          upTo: rule.upTo === 'appDay' ? t('payDay.upTo.appDay') : String(rule.upTo),
        }),
      )
      .join('; ')
  const changes: RuleChange[] = []
  if (draft.mode !== saved.mode)
    changes.push({ label: t('payDay.mode'), from: modeText(saved.mode), to: modeText(draft.mode) })
  if (draft.fixedDays.join() !== saved.fixedDays.join())
    changes.push({
      label: t('payDay.fixed'),
      from: saved.fixedDays.join(', '),
      to: draft.fixedDays.join(', '),
    })
  if (JSON.stringify(draft.rules) !== JSON.stringify(saved.rules))
    changes.push({
      label: t('payDay.lines'),
      from: lineText(saved.rules),
      to: lineText(draft.rules),
    })
  if (draft.after !== saved.after)
    changes.push({ label: t('payDay.after'), from: String(saved.after), to: String(draft.after) })

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) {
      toast(t('pricing.error.form'), 'error')
      return
    }
    payDayRulesStore.update(brand, draft)
    ruleRevisionsStore.save({
      id: newId(),
      brand,
      page: 'payDay',
      at: now(),
      by: admin?.name ?? '—',
      changes,
    })
    logAction({
      section: 'mlPayDay',
      kind: 'update',
      action: 'audit.a.payDaySaved',
      params: { brand: WORKSPACE_INFO[brand].name },
      target: t('nav.payDay'),
      href: brandPath(brand, 'pay-day'),
    })
    setSubmitted(false)
    toast(t('rules.saved'))
  }

  const preview = payDaysFor(draft, appDay)
  const upToOptions = [
    { value: 'appDay', label: t('payDay.upTo.appDay') },
    ...DAYS.map((day) => ({
      value: String(day),
      label: t('payDay.upTo.day', { day: String(day) }),
    })),
  ]

  return (
    <>
      <ActionBar eyebrow={WORKSPACE_INFO[brand].name} title={t('nav.payDay')}>
        {changes.length > 0 && (
          <span className="hidden pr-2 text-sm text-ink-muted sm:block">
            {t('pricing.unsaved', { count: String(changes.length) })}
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="px-4!"
          disabled={changes.length === 0}
          onClick={() => setDraft(saved)}
        >
          {t('common.cancel')}
        </Button>
        <Button size="sm" className="px-4!" disabled={changes.length === 0} onClick={save}>
          {t('common.save')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="flex flex-col gap-6">
          <Group title={t('payDay.mode')} hint={t('payDay.mode.hint')}>
            <ChoiceGrid
              label={t('payDay.mode')}
              columns={2}
              options={(['byDay', 'fixed'] as const).map((value) => ({
                value,
                label: modeText(value),
                description: t(`payDay.mode.${value}.hint`),
              }))}
              value={draft.mode}
              onChange={(mode) => set({ mode })}
            />
          </Group>

          {draft.mode === 'fixed' ? (
            <Group title={t('payDay.fixed')} hint={t('payDay.fixed.hint')}>
              <div role="group" aria-label={t('payDay.fixed')} className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const on = draft.fixedDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set({
                          fixedDays: on
                            ? draft.fixedDays.filter((item) => item !== day)
                            : [...draft.fixedDays, day].sort((a, b) => a - b),
                        })
                      }
                      className={cn(
                        'h-10 rounded-control border-[1.5px] text-sm font-semibold tabular-nums transition-colors',
                        on
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-line bg-canvas hover:bg-surface',
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              {submitted && errors.fixed && (
                <p className="text-sm text-danger">{t('payDay.error.fixed')}</p>
              )}
            </Group>
          ) : (
            <Group title={t('payDay.lines')} hint={t('payDay.lines.hint')}>
              <ol className="flex flex-col gap-3">
                {draft.rules.map((rule, i) => (
                  <li key={i} className="flex flex-col gap-1.5 rounded-control bg-surface p-3">
                    <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto]">
                      <NumberField
                        label={t('payDay.from')}
                        value={rule.from}
                        onChange={(v) => setRule(i, { from: v ?? 0 })}
                        maxDigits={2}
                      />
                      <NumberField
                        label={t('payDay.to')}
                        value={rule.to}
                        onChange={(v) => setRule(i, { to: v ?? 0 })}
                        maxDigits={2}
                      />
                      <SelectField
                        label={t('payDay.upTo')}
                        options={upToOptions}
                        value={String(rule.upTo)}
                        onChange={(v) =>
                          setRule(i, { upTo: v === 'appDay' ? 'appDay' : Number(v) })
                        }
                      />
                      <button
                        type="button"
                        aria-label={t('common.remove')}
                        onClick={() => set({ rules: draft.rules.filter((_, j) => j !== i) })}
                        className="grid size-11 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-danger"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {submitted && lineErrors[i] && (
                      <p className="text-sm text-danger">{lineErrors[i]}</p>
                    )}
                  </li>
                ))}
              </ol>
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => {
                  const last = draft.rules.at(-1)?.to ?? 0
                  set({ rules: [...draft.rules, { from: last + 1, to: last + 1, upTo: 'appDay' }] })
                }}
              >
                <Plus size={18} />
                {t('payDay.addLine')}
              </Button>
              <div className="max-w-60">
                <NumberField
                  label={t('payDay.after')}
                  value={draft.after}
                  onChange={(v) => set({ after: v ?? 0 })}
                  maxDigits={2}
                  hint={t('payDay.after.hint')}
                  error={submitted && errors.after ? t('payDay.error.afterRange') : undefined}
                />
              </div>
              {submitted && draft.rules.length === 0 && (
                <p className="text-sm text-danger">{t('payDay.error.noLines')}</p>
              )}
            </Group>
          )}

          <RuleHistory brand={brand} page="payDay" />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className={card}>
            <h2 className="font-bold">{t('mlRules.sees')}</h2>
            {draft.mode === 'byDay' && (
              <SelectField
                label={t('payDay.preview.day')}
                options={Array.from({ length: 31 }, (_, i) => ({
                  value: String(i + 1),
                  label: t('payDay.preview.dayOption', { day: String(i + 1) }),
                }))}
                value={String(appDay)}
                onChange={(v) => setAppDay(Number(v))}
              />
            )}
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-muted">{t('payDay.preview.can')}</p>
              <div className="grid grid-cols-5 gap-1.5">
                {preview.days.map((day) => (
                  <span
                    key={day}
                    className="grid h-9 place-items-center rounded-full border-[1.5px] border-line text-sm font-semibold tabular-nums"
                  >
                    {day}
                  </span>
                ))}
              </div>
              {preview.next1st && (
                <p className="rounded-control bg-surface p-3 text-sm">
                  {t('payDay.preview.next1st')}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
