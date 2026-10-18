import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { DocSection } from '@/entities/documents/documents'
import { emptyText } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'

/**
 * A document's sections as editable cards: heading and text in both languages, moved up or
 * down, removed, and a new one added at the end.
 */
export function SectionsEditor({
  sections,
  onChange,
  submitted,
}: {
  sections: DocSection[]
  onChange: (sections: DocSection[]) => void
  submitted: boolean
}) {
  const { t } = useI18n()
  const patch = (id: string, change: Partial<DocSection>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...change } : s)))
  const move = (i: number, by: number) => {
    const next = [...sections]
    ;[next[i], next[i + by]] = [next[i + by], next[i]]
    onChange(next)
  }
  const icon =
    'grid size-9 place-items-center rounded-full text-ink-subtle hover:bg-surface hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, i) => (
        <section
          key={section.id}
          className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5"
        >
          <div className="flex items-center gap-1">
            <span className="flex-1 text-sm font-semibold text-ink-muted">
              {t('document.section', { number: String(i + 1) })}
            </span>
            <button
              type="button"
              className={icon}
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={t('document.section.up')}
              title={t('document.section.up')}
            >
              <ArrowUp size={18} />
            </button>
            <button
              type="button"
              className={icon}
              disabled={i === sections.length - 1}
              onClick={() => move(i, 1)}
              aria-label={t('document.section.down')}
              title={t('document.section.down')}
            >
              <ArrowDown size={18} />
            </button>
            <button
              type="button"
              className={`${icon} hover:bg-danger-soft! hover:text-danger!`}
              disabled={sections.length === 1}
              onClick={() => onChange(sections.filter((s) => s.id !== section.id))}
              aria-label={t('document.section.remove')}
              title={t('document.section.remove')}
            >
              <Trash2 size={18} />
            </button>
          </div>
          <LocalizedTextField
            label={t('document.heading')}
            value={section.heading}
            onChange={(heading) => patch(section.id, { heading })}
            requireBoth={submitted}
          />
          <LocalizedTextField
            label={t('document.body')}
            value={section.body}
            onChange={(body) => patch(section.id, { body })}
            multiline
            requireBoth={submitted}
          />
        </section>
      ))}
      <Button
        variant="secondary"
        className="self-start"
        onClick={() =>
          onChange([...sections, { id: newId(), heading: emptyText(), body: emptyText() }])
        }
      >
        <Plus size={18} />
        {t('document.section.add')}
      </Button>
    </div>
  )
}
