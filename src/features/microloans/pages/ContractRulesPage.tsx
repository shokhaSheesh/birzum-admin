import { CreditCard, FileText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { logAction } from '@/entities/audit/audit'
import {
  contractRulesStore,
  ruleRevisionsStore,
  type ContractRules,
  type RuleChange,
} from '@/entities/microloans/rules'
import { useAdmin } from '@/entities/session/session'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { NumberField } from '@/shared/ui/NumberField'
import { SelectField } from '@/shared/ui/SelectField'
import { Switch } from '@/shared/ui/Switch'
import { RuleHistory } from '../components/RuleHistory'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'
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

/** A setting that is on or off, in a grey box with a line on what it means. */
function SwitchBox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4">
      <div className="flex flex-col">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-ink-muted">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

/**
 * Shartnoma va toʻlov of a microloan brand: when the card is charged
 * and how often again, early repayment, and which cards the app takes. What
 * a borrower would see is worked out on the right. The offer itself lives in Hujjatlar.
 */
export function ContractRulesPage({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const saved = contractRulesStore.useAll().find((rules) => rules.id === brand)!
  const [draft, setDraft] = useState<ContractRules>(saved)
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<ContractRules>) => setDraft({ ...draft, ...patch })
  const num = (value: number | null) => value ?? 0

  const errors = {
    cards: !draft.uzcard && !draft.humo ? t('mlRules.error.cards') : undefined,
  }

  const pct = (n: number) => `${String(n).replace('.', ',')}%`
  const days = (n: number) => t('mlRules.days', { n: String(n) })
  const yesNo = (b: boolean) => t(b ? 'rules.yes' : 'rules.no')
  const changes: RuleChange[] = []
  const track = <K extends keyof ContractRules>(
    key: K,
    label: string,
    show: (value: ContractRules[K]) => string,
  ) => {
    if (draft[key] !== saved[key])
      changes.push({ label, from: show(saved[key]), to: show(draft[key]) })
  }
  track('chargeHour', t('mlRules.chargeHour'), (v) => `${String(v).padStart(2, '0')}:00`)
  track('retries', t('mlRules.retries'), String)
  track('earlyAfterDays', t('mlRules.earlyAfterDays'), days)
  track('earlyPartialMin', t('mlRules.earlyPartialMin'), (v) => formatSum(v))
  track('earlyFee', t('mlRules.earlyFee'), pct)
  track('uzcard', 'Uzcard', yesNo)
  track('humo', 'Humo', yesNo)

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) {
      toast(t('pricing.error.form'), 'error')
      return
    }
    contractRulesStore.update(brand, draft)
    ruleRevisionsStore.save({
      id: newId(),
      brand,
      page: 'contract',
      at: now(),
      by: admin?.name ?? '—',
      changes,
    })
    logAction({
      section: 'mlContract',
      kind: 'update',
      action: 'audit.a.loanRulesSaved',
      params: { brand: WORKSPACE_INFO[brand].name },
      target: t('nav.contractRules'),
      href: brandPath(brand, 'contract'),
      changes: changes.map((change) => ({
        field: 'nav.contractRules',
        from: `${change.label}: ${change.from}`,
        to: change.to,
      })),
    })
    toast(t('rules.saved'))
  }

  const hours = Array.from({ length: 14 }, (_, i) => i + 7).map((h) => ({
    value: String(h),
    label: `${String(h).padStart(2, '0')}:00`,
  }))

  return (
    <>
      <ActionBar eyebrow={WORKSPACE_INFO[brand].name} title={t('nav.contractRules')}>
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
          <Group title={t('mlRules.payment')} hint={t('mlRules.payment.hint')}>
            <p className="text-sm text-ink-muted">{t('mlRules.payDayClient')}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField
                label={t('mlRules.chargeHour')}
                options={hours}
                value={String(draft.chargeHour)}
                onChange={(v) => set({ chargeHour: Number(v) })}
              />
              <NumberField
                label={t('mlRules.retries')}
                value={draft.retries}
                onChange={(v) => set({ retries: num(v) })}
                suffix={t('mlRules.times')}
                maxDigits={1}
                hint={t('mlRules.retries.hint')}
              />
            </div>
          </Group>

          <Group title={t('mlRules.early')} hint={t('mlRules.early.hint')}>
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                label={t('mlRules.earlyAfterDays')}
                value={draft.earlyAfterDays}
                onChange={(v) => set({ earlyAfterDays: num(v) })}
                suffix={t('mlRules.daysUnit')}
                maxDigits={3}
                hint={t('mlRules.earlyAfterDays.hint')}
              />
              <NumberField
                label={t('mlRules.earlyPartialMin')}
                value={draft.earlyPartialMin}
                onChange={(v) => set({ earlyPartialMin: num(v) })}
                suffix="UZS"
              />
              <NumberField
                label={t('mlRules.earlyFee')}
                value={draft.earlyFee}
                onChange={(v) => set({ earlyFee: num(v) })}
                suffix="%"
                maxDigits={2}
                hint={t('mlRules.earlyFee.hint')}
              />
            </div>
            <p className="rounded-control bg-surface p-3 text-sm text-ink-muted">
              {t('mlRules.early.partial')}
            </p>
          </Group>

          <Group title={t('mlRules.cards')} hint={t('mlRules.cards.hint')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchBox
                label="Uzcard"
                hint={t('mlRules.card.hint')}
                checked={draft.uzcard}
                onChange={(on) => set({ uzcard: on })}
              />
              <SwitchBox
                label="Humo"
                hint={t('mlRules.card.hint')}
                checked={draft.humo}
                onChange={(on) => set({ humo: on })}
              />
            </div>
            {submitted && errors.cards && <p className="text-sm text-danger">{errors.cards}</p>}
          </Group>

          <RuleHistory brand={brand} page="contract" />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className={card}>
            <h2 className="font-bold">{t('mlRules.sees')}</h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>{t('mlRules.sees.payClient')}</li>
              <li>
                {t('mlRules.sees.charge', {
                  hour: `${String(draft.chargeHour).padStart(2, '0')}:00`,
                  retries: String(draft.retries),
                })}
              </li>
              <li>
                {t(draft.earlyFee ? 'mlRules.sees.earlyFee' : 'mlRules.sees.early', {
                  min: formatSum(draft.earlyPartialMin),
                  fee: String(draft.earlyFee),
                })}
              </li>
            </ul>
          </section>
          <Link
            to={brandPath(brand, 'documents')}
            className="flex items-center gap-3 rounded-card border border-line bg-canvas p-4 hover:bg-surface/60"
          >
            <FileText size={20} className="shrink-0 text-brand" />
            <div className="flex flex-col">
              <span className="font-semibold">{t('mlRules.offerDoc')}</span>
              <span className="text-sm text-ink-muted">{t('mlRules.offerDoc.hint')}</span>
            </div>
          </Link>
          <p className="flex items-start gap-2 px-1 text-xs text-ink-subtle">
            <CreditCard size={14} className="mt-0.5 shrink-0" />
            {t('mlRules.appliesNew')}
          </p>
        </aside>
      </div>
    </>
  )
}
