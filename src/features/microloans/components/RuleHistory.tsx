import { payDayHistoryStoreOf, type PayDayRevision } from '@/entities/microloans/payDayApi'
import type { Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime } from '@/shared/lib/format'

type Change = PayDayRevision['changes'][number]

/** Who changed a brand's Toʻlov kuni, when, and every changed value before and after. */
export function RuleHistory({ brand }: { brand: Brand }) {
  const { t } = useI18n()
  const history = payDayHistoryStoreOf(brand).useAll()

  const label = (field: Change['field']) =>
    t(
      field === 'mode'
        ? 'payDay.mode'
        : field === 'fixed_days'
          ? 'payDay.fixed'
          : field === 'rules'
            ? 'payDay.lines'
            : 'payDay.after',
    )
  // The backend sends the raw JSON before and after; the words are drawn here
  const show = (field: Change['field'], value: unknown): string => {
    if (field === 'mode') return t(`payDay.mode.${String(value) as 'fixed' | 'byDay'}`)
    if (field === 'fixed_days') return (value as number[]).join(', ') || '—'
    if (field === 'rules') {
      const rules = value as { from: number; to: number; up_to: number | 'appDay' }[]
      return (
        rules
          .map((rule) =>
            t('payDay.line', {
              from: String(rule.from),
              to: String(rule.to),
              upTo: rule.up_to === 'appDay' ? t('payDay.upTo.appDay') : String(rule.up_to),
            }),
          )
          .join('; ') || '—'
      )
    }
    return String(value)
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5">
      <h2 className="text-lg font-bold">{t('pricing.history')}</h2>
      {history.length === 0 ? (
        <p className="text-sm text-ink-muted">{t('mlRules.history.none')}</p>
      ) : (
        <ul className="flex flex-col">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0"
            >
              <p className="text-sm text-ink-muted">
                {formatDateTime(entry.at)} · {entry.by}
              </p>
              {entry.changes.map((change, i) => (
                <p key={i} className="text-sm">
                  <span className="font-semibold">{label(change.field)}:</span>{' '}
                  {show(change.field, change.from)} → {show(change.field, change.to)}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
