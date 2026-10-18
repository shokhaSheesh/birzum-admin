import { Download, FileText, Upload } from 'lucide-react'
import { useRef } from 'react'
import { documentsStore, type DocFile, type LegalDoc } from '@/entities/documents/documents'
import { useAdmin } from '@/entities/session/session'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { logAction } from '@/entities/audit/audit'

const MAX_MB = 10
const sizeOf = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1).replace('.', ',')} MB`
    : `${Math.round(bytes / 1024)} KB`

/**
 * The client app's legal documents, each as one PDF per language. The app links to these
 * three, so there is nothing to add or delete: only upload or replace a file.
 */
export function DocumentsPage() {
  const { t } = useI18n()
  const docs = documentsStore.useAll()

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.documents')} description={t('documents.description')} />
      <div className="flex flex-col gap-4">
        {docs.map((doc) => (
          <section
            key={doc.id}
            className="flex flex-col gap-4 rounded-card border border-line bg-canvas p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface text-brand">
                <FileText size={22} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-lg font-bold">{t(`document.${doc.id}`)}</h2>
                <p className="text-sm text-ink-muted">
                  {t('document.usedIn')}:{' '}
                  {doc.usedIn.map((place) => t(`document.place.${place}`)).join(', ')}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {LANGS.map((lang) => (
                <FileSlot key={lang} doc={doc} lang={lang} file={doc.files[lang]} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** One language's file: its name, size and who uploaded it when, with open and replace. */
function FileSlot({ doc, lang, file }: { doc: LegalDoc; lang: Lang; file: DocFile | null }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const picker = useRef<HTMLInputElement>(null)

  const upload = (picked: File) => {
    if (picked.type !== 'application/pdf') return toast(t('document.error.pdf'), 'error')
    if (picked.size > MAX_MB * 1_048_576)
      return toast(t('document.error.size', { max: String(MAX_MB) }), 'error')
    documentsStore.update(doc.id, {
      files: {
        ...doc.files,
        [lang]: {
          name: picked.name,
          size: picked.size,
          url: URL.createObjectURL(picked),
          uploadedAt: new Date(),
          uploadedBy: admin?.name ?? '—',
        },
      },
    })
    toast(t(file ? 'document.replaced' : 'document.uploaded'))
    logAction({
      section: 'documents',
      kind: 'update',
      action: 'audit.a.documentUploaded',
      target: `${picked.name} (${lang.toUpperCase()})`,
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-control border border-line p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-xs font-bold text-ink-muted uppercase">
        {lang}
      </span>
      {file ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{file.name}</span>
          <span className="truncate text-xs text-ink-muted tabular-nums">
            PDF · {sizeOf(file.size)} · {formatDate(file.uploadedAt)} · {file.uploadedBy}
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <StatusBadge tone="warning">{t('document.missing')}</StatusBadge>
          <span className="text-xs text-ink-muted">{t('document.missing.hint')}</span>
        </div>
      )}
      {file && (
        <a
          href={file.url ?? '#'}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            // Sample files have no real file behind them
            if (!file.url) {
              e.preventDefault()
              toast(t('document.sample'))
            }
          }}
          aria-label={t('document.open')}
          title={t('document.open')}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
        >
          <Download size={18} />
        </a>
      )}
      <Button size="sm" variant="secondary" onClick={() => picker.current?.click()}>
        <Upload size={16} />
        {t(file ? 'document.replace' : 'document.upload')}
      </Button>
      {/* Hidden: the button above is what people see */}
      <input
        ref={picker}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) upload(picked)
          e.target.value = ''
        }}
      />
    </div>
  )
}
