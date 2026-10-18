import { CircleAlert, CircleCheck, CircleX, Scale } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  decisionRulesStore,
  ruleRevisionsStore,
  verdictOf,
  type DecisionRules,
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
import { Switch } from '@/shared/ui/Switch'
import { RuleHistory } from '../components/RuleHistory'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'
const now = () => new Date()

/** A card of one group of rules: a title, a line on what it does, and its fields. */
function Group({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
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
 * Qaror qoidalari of a microloan brand: how its app decides an ariza by itself — age, credit
 * history, and the share of income the payment takes — when it hands one to an admin, when it
 * offers a smaller sum, and how long an offer stands. A tester on the right runs the rules on
 * made-up numbers before saving.
 */
export function DecisionRulesPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const saved = decisionRulesStore.useAll().find((rules) => rules.id === brand)!
  const [draft, setDraft] = useState<DecisionRules>(saved)
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<DecisionRules>) => setDraft({ ...draft, ...patch })
  const num = (value: number | null) => value ?? 0

  const errors = {
    approveUpTo:
      draft.approveUpTo <= 0 || draft.approveUpTo > 100 ? t('mlRules.error.percent') : undefined,
    manualUpTo:
      draft.manualUpTo < draft.approveUpTo || draft.manualUpTo > 100
        ? t('mlRules.error.manual')
        : undefined,
    counterTarget:
      draft.counterOffer && (draft.counterTarget <= 0 || draft.counterTarget > draft.manualUpTo)
        ? t('mlRules.error.target')
        : undefined,
    age: draft.ageMin < 18 || draft.ageMax <= draft.ageMin ? t('mlRules.error.age') : undefined,
    offerDays: draft.offerDays < 1 ? t('mlRules.error.days') : undefined,
  }

  const pct = (n: number) => `${n}%`
  const days = (n: number) => t('mlRules.days', { n: String(n) })
  const yesNo = (b: boolean) => t(b ? 'rules.yes' : 'rules.no')
  // Every value the draft changes, as the history and the log show it
  const changes: RuleChange[] = []
  const track = <K extends keyof DecisionRules>(
    key: K,
    label: string,
    show: (value: DecisionRules[K]) => string,
  ) => {
    if (draft[key] !== saved[key])
      changes.push({ label, from: show(saved[key]), to: show(draft[key]) })
  }
  track('approveUpTo', t('mlRules.approveUpTo'), pct)
  track('manualUpTo', t('mlRules.manualUpTo'), pct)
  track('counterOffer', t('mlRules.counterOffer'), yesNo)
  track('counterTarget', t('mlRules.counterTarget'), pct)
  track('lateManualUpTo', t('mlRules.lateManualUpTo'), String)
  track('noHistory', t('mlRules.noHistory'), (value) => t(`mlRules.noHistory.${value}`))
  track('ageMin', t('mlRules.ageMin'), String)
  track('ageMax', t('mlRules.ageMax'), String)
  track('offerDays', t('mlRules.offerDays'), days)
  track('reapplyDays', t('mlRules.reapplyDays'), days)

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) {
      toast(t('pricing.error.form'), 'error')
      return
    }
    decisionRulesStore.update(brand, draft)
    ruleRevisionsStore.save({
      id: newId(),
      brand,
      page: 'decision',
      at: now(),
      by: admin?.name ?? '—',
      changes,
    })
    logAction({
      section: 'mlDecision',
      kind: 'update',
      action: 'audit.a.loanRulesSaved',
      params: { brand: WORKSPACE_INFO[brand].name },
      target: t('nav.decision'),
      href: brandPath(brand, 'decision'),
      changes: changes.map((change) => ({
        field: 'nav.decision',
        from: `${change.label}: ${change.from}`,
        to: change.to,
      })),
    })
    toast(t('rules.saved'))
  }

  // The tester: an ariza's numbers, and what the rules on screen make of it
  const [test, setTest] = useState({
    income: 6_000_000,
    monthly: 3_000_000,
    late: 0,
    age: 30,
    noHistory: false,
  })
  const load = test.income ? Math.round((test.monthly / test.income) * 100) : 0
  const result = verdictOf(draft, {
    load,
    late: test.late,
    noHistory: test.noHistory,
    age: test.age,
    counterFits: true,
  })
  const tone = {
    approve: 'bg-success-soft text-success',
    manual: 'bg-warning-soft text-warning',
    counter: 'bg-navy-100 text-brand',
    decline: 'bg-danger-soft text-danger',
  }[result.verdict]
  const Icon = { approve: CircleCheck, manual: CircleAlert, counter: Scale, decline: CircleX }[
    result.verdict
  ]

  return (
    <>
      <ActionBar eyebrow={WORKSPACE_INFO[brand].name} title={t('nav.decision')}>
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
          <Group title={t('mlRules.load')} hint={t('mlRules.load.hint')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label={t('mlRules.approveUpTo')}
                value={draft.approveUpTo}
                onChange={(v) => set({ approveUpTo: num(v) })}
                suffix="%"
                maxDigits={3}
                hint={t('mlRules.approveUpTo.hint')}
                error={submitted ? errors.approveUpTo : undefined}
              />
              <NumberField
                label={t('mlRules.manualUpTo')}
                value={draft.manualUpTo}
                onChange={(v) => set({ manualUpTo: num(v) })}
                suffix="%"
                maxDigits={3}
                hint={t('mlRules.manualUpTo.hint')}
                error={submitted ? errors.manualUpTo : undefined}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
              <div className="flex flex-col">
                <p className="font-semibold">{t('mlRules.counterOffer')}</p>
                <p className="text-sm text-ink-muted">
                  {t('mlRules.counterOffer.hint', { limit: String(draft.manualUpTo) })}
                </p>
              </div>
              <Switch
                checked={draft.counterOffer}
                onChange={(on) => set({ counterOffer: on })}
                label={t('mlRules.counterOffer')}
              />
            </div>
            {draft.counterOffer && (
              <NumberField
                label={t('mlRules.counterTarget')}
                value={draft.counterTarget}
                onChange={(v) => set({ counterTarget: num(v) })}
                suffix="%"
                maxDigits={3}
                hint={t('mlRules.counterTarget.hint')}
                error={submitted ? errors.counterTarget : undefined}
              />
            )}
          </Group>

          <Group title={t('mlRules.credit')} hint={t('mlRules.credit.hint')}>
            <NumberField
              label={t('mlRules.lateManualUpTo')}
              value={draft.lateManualUpTo}
              onChange={(v) => set({ lateManualUpTo: num(v) })}
              suffix={t('mlRules.times')}
              maxDigits={2}
              hint={t('mlRules.lateManualUpTo.hint', { n: String(draft.lateManualUpTo) })}
            />
            <ChoiceGrid
              label={t('mlRules.noHistory')}
              columns={2}
              options={(['auto', 'manual'] as const).map((value) => ({
                value,
                label: t(`mlRules.noHistory.${value}`),
                description: t(`mlRules.noHistory.${value}.hint`),
              }))}
              value={draft.noHistory}
              onChange={(value) => set({ noHistory: value })}
            />
            <p className="flex items-start gap-2 rounded-control bg-surface p-3 text-sm text-ink-muted">
              <CircleX size={18} className="mt-0.5 shrink-0 text-danger" />
              {t('mlRules.myid')}
            </p>
          </Group>

          <Group title={t('mlRules.who')} hint={t('mlRules.who.hint')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label={t('mlRules.ageMin')}
                value={draft.ageMin}
                onChange={(v) => set({ ageMin: num(v) })}
                suffix={t('mlRules.years')}
                maxDigits={2}
                error={submitted ? errors.age : undefined}
              />
              <NumberField
                label={t('mlRules.ageMax')}
                value={draft.ageMax}
                onChange={(v) => set({ ageMax: num(v) })}
                suffix={t('mlRules.years')}
                maxDigits={2}
              />
            </div>
          </Group>

          <Group title={t('mlRules.offer')} hint={t('mlRules.offer.hint')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label={t('mlRules.offerDays')}
                value={draft.offerDays}
                onChange={(v) => set({ offerDays: num(v) })}
                suffix={t('mlRules.daysUnit')}
                maxDigits={2}
                hint={t('mlRules.offerDays.hint')}
                error={submitted ? errors.offerDays : undefined}
              />
              <NumberField
                label={t('mlRules.reapplyDays')}
                value={draft.reapplyDays}
                onChange={(v) => set({ reapplyDays: num(v) })}
                suffix={t('mlRules.daysUnit')}
                maxDigits={3}
                hint={t('mlRules.reapplyDays.hint')}
              />
            </div>
          </Group>

          <RuleHistory brand={brand} page="decision" />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className={card}>
            <h2 className="font-bold">{t('mlRules.order')}</h2>
            <ol className="flex flex-col gap-2 text-sm">
              {(
                [
                  t('mlRules.order.myid'),
                  t('mlRules.order.age', { min: String(draft.ageMin), max: String(draft.ageMax) }),
                  t('mlRules.order.credit', { n: String(draft.lateManualUpTo) }),
                  t('mlRules.order.load', {
                    approve: String(draft.approveUpTo),
                    manual: String(draft.manualUpTo),
                  }),
                  draft.counterOffer
                    ? t('mlRules.order.counter', { target: String(draft.counterTarget) })
                    : t('mlRules.order.noCounter'),
                ] as string[]
              ).map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface text-xs font-bold text-ink-muted">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className={card}>
            <h2 className="font-bold">{t('mlRules.test')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label={t('loanApp.income')}
                value={test.income}
                onChange={(v) => setTest({ ...test, income: num(v) })}
                suffix="UZS"
              />
              <NumberField
                label={t('application.monthly')}
                value={test.monthly}
                onChange={(v) => setTest({ ...test, monthly: num(v) })}
                suffix="UZS"
              />
              <NumberField
                label={t('mlRules.test.late')}
                value={test.late}
                onChange={(v) => setTest({ ...test, late: num(v) })}
                maxDigits={2}
              />
              <NumberField
                label={t('mlRules.test.age')}
                value={test.age}
                onChange={(v) => setTest({ ...test, age: num(v) })}
                maxDigits={2}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-muted">{t('mlRules.test.noHistory')}</span>
              <Switch
                checked={test.noHistory}
                onChange={(on) => setTest({ ...test, noHistory: on })}
                label={t('mlRules.test.noHistory')}
              />
            </div>
            <div className={cn('flex gap-3 rounded-control p-3', tone)}>
              <Icon size={20} className="mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="font-bold">{t(`mlRules.verdict.${result.verdict}`)}</p>
                <p className="text-sm">
                  {t(`mlRules.why.${result.why}`, {
                    load: String(load),
                    approve: String(draft.approveUpTo),
                    manual: String(draft.manualUpTo),
                    target: String(draft.counterTarget),
                    late: String(test.late),
                  })}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
