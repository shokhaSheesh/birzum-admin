import { ChevronRight, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { currentOf, documentsStore, draftOf } from '@/entities/documents/documents'
import { documentPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate } from '@/shared/lib/format'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'

/**
 * The client app's legal documents. They are fixed (the app links to each one); what changes
 * is their text, in versions. A row opens the document.
 */
export function DocumentsPage() {
  const { t } = useI18n()
  const docs = documentsStore.useAll()

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.documents')} description={t('documents.description')} />
      <ul className="flex flex-col rounded-card border border-line bg-canvas">
        {docs.map((doc) => {
          const current = currentOf(doc)
          const draft = draftOf(doc)
          return (
            <li key={doc.id} className="border-b border-line last:border-b-0">
              <Link
                to={documentPath(doc.id)}
                className="flex items-center gap-4 p-5 hover:bg-surface/60"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-control bg-surface text-brand">
                  <FileText size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{t(`document.${doc.id}`)}</span>
                    {draft && (
                      <StatusBadge tone="warning">
                        {t('document.draftOf', { number: String(draft.number) })}
                      </StatusBadge>
                    )}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {t('document.usedIn')}:{' '}
                    {doc.usedIn.map((place) => t(`document.place.${place}`)).join(', ')}
                  </span>
                </span>
                {current && (
                  <span className="hidden flex-col items-end gap-0.5 text-sm sm:flex">
                    <span className="font-semibold">
                      {t('document.version', { number: String(current.number) })}
                    </span>
                    <span className="text-ink-muted tabular-nums">
                      {t('document.since', { date: formatDate(current.publishedAt!) })}
                    </span>
                  </span>
                )}
                <ChevronRight size={20} className="shrink-0 text-ink-subtle" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
