import { ruleRevisionsStore, type RuleRevision } from '@/entities/microloans/rules'
import type { Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime } from '@/shared/lib/format'

/** Who changed a brand's rules page, when, and every value before and after. */
export function RuleHistory({ brand, page }: { brand: Brand; page: RuleRevision['page'] }) {
  const { t } = useI18n()
  const history = ruleRevisionsStore
    .useAll()
    .filter((entry) => entry.brand === brand && entry.page === page)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
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
                  <span className="font-semibold">{change.label}:</span> {change.from} → {change.to}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
