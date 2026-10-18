import { ArrowLeft, Pencil, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  currentOf,
  documentsStore,
  draftOf,
  type DocSection,
  type DocVersion,
  type LegalDoc,
} from '@/entities/documents/documents'
import { useAdmin } from '@/entities/session/session'
import { ROUTES } from '@/shared/config/routes'
import { LANGS } from '@/shared/i18n/dictionaries'
import { isComplete } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { ActionBar } from '@/shared/ui/ActionBar'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'
import { TextField } from '@/shared/ui/TextField'
import { SectionsEditor } from '../components/SectionsEditor'

const now = () => new Date()
const tones: Record<DocVersion['status'], StatusTone> = {
  draft: 'warning',
  published: 'success',
  archived: 'neutral',
}

/**
 * One legal document. Reading: the version the app shows (or an older one picked in the
 * history), both languages side by side. "Tahrirlash" starts a draft from it; the draft is
 * edited section by section, saved, and published as the next version, optionally asking
 * every shopper to agree again.
 */
export function DocumentPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const doc = documentsStore.useAll().find((item) => item.id === id)
  const navigate = useNavigate()

  if (!doc)
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(ROUTES.documents)}
          className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={18} />
          {t('nav.documents')}
        </button>
        <EmptyState title={t('document.notFound')} />
      </div>
    )
  const draft = draftOf(doc)
  // The draft is edited in its own component, keyed so a new draft starts fresh
  return draft ? (
    <DraftEditor key={`${doc.id}-${draft.number}`} doc={doc} draft={draft} />
  ) : (
    <Reader doc={doc} />
  )
}

/** The published text and the history; no editing here. */
function Reader({ doc }: { doc: LegalDoc }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const admin = useAdmin()
  const [params, setParams] = useSearchParams()
  const current = currentOf(doc)
  const picked = doc.versions.find((v) => String(v.number) === params.get('v')) ?? current

  const startDraft = () => {
    // After publishing, the page should open on the new current version
    setParams({}, { replace: true })
    const base = current ?? doc.versions[0]
    documentsStore.update(doc.id, {
      versions: [
        {
          number: Math.max(...doc.versions.map((v) => v.number)) + 1,
          status: 'draft',
          sections: base.sections.map((s) => ({ ...s })),
          editedAt: now(),
          editedBy: admin?.name ?? '—',
        },
        ...doc.versions,
      ],
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(ROUTES.documents)}
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={18} />
        {t('nav.documents')}
      </button>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-2xl font-bold">{t(`document.${doc.id}`)}</h1>
          <p className="text-ink-muted">
            {t('document.usedIn')}:{' '}
            {doc.usedIn.map((place) => t(`document.place.${place}`)).join(', ')}
          </p>
        </div>
        <Button onClick={startDraft}>
          <Pencil size={18} />
          {t('common.edit')}
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-5 rounded-card border border-line bg-canvas p-6">
          {picked && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold">
                  {t('document.version', { number: String(picked.number) })}
                </h2>
                <StatusBadge tone={tones[picked.status]}>
                  {t(`document.status.${picked.status}`)}
                </StatusBadge>
                {picked.publishedAt && (
                  <span className="text-sm text-ink-muted tabular-nums">
                    {formatDate(picked.publishedAt)}
                  </span>
                )}
              </div>
              <SectionsView sections={picked.sections} />
            </>
          )}
        </section>
        <History
          doc={doc}
          picked={picked?.number}
          onPick={(v) =>
            setParams(v === current?.number ? {} : { v: String(v) }, { replace: true })
          }
        />
      </div>
    </div>
  )
}

/** The text in Uzbek and Russian side by side, section by section. */
function SectionsView({ sections }: { sections: DocSection[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="hidden grid-cols-2 gap-6 text-xs font-bold text-ink-muted uppercase md:grid">
        {LANGS.map((lang) => (
          <span key={lang}>{lang}</span>
        ))}
      </div>
      {sections.map((section) => (
        <div
          key={section.id}
          className="grid gap-x-6 gap-y-3 border-t border-line pt-4 md:grid-cols-2"
        >
          {LANGS.map((lang) => (
            <div key={lang} className="flex flex-col gap-1">
              <p className="font-semibold">{section.heading[lang]}</p>
              <p className="text-sm whitespace-pre-line text-ink-muted">{section.body[lang]}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Every version, newest first, with who and when; a published or older one opens to read. */
function History({
  doc,
  picked,
  onPick,
}: {
  doc: LegalDoc
  picked?: number
  onPick?: (number: number) => void
}) {
  const { t } = useI18n()
  return (
    <aside className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5 lg:sticky lg:top-24">
      <h2 className="font-bold">{t('document.history')}</h2>
      <ol className="flex flex-col">
        {doc.versions.map((version) => {
          const clickable = !!onPick && version.status !== 'draft'
          return (
            <li key={version.number}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onPick?.(version.number)}
                className={cn(
                  '-mx-2 flex w-[calc(100%+1rem)] flex-col gap-1 rounded-control p-2 text-left',
                  clickable && 'hover:bg-surface',
                  picked === version.number && 'bg-surface',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold">
                    {t('document.version', { number: String(version.number) })}
                  </span>
                  <StatusBadge tone={tones[version.status]}>
                    {t(`document.status.${version.status}`)}
                  </StatusBadge>
                </span>
                <span className="text-xs text-ink-muted tabular-nums">
                  {version.publishedAt
                    ? `${formatDateTime(version.publishedAt)} · ${version.publishedBy}`
                    : `${t('document.edited')} ${formatDateTime(version.editedAt)} · ${version.editedBy}`}
                </span>
                {version.note && <span className="text-sm">{version.note}</span>}
                {version.reconsent && (
                  <span className="text-xs font-medium text-warning">
                    {t('document.reconsented')}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

/** The draft being written: sections, save, publish or throw away. */
function DraftEditor({ doc, draft }: { doc: LegalDoc; draft: DocVersion }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const admin = useAdmin()
  const [sections, setSections] = useState(draft.sections)
  const [submitted, setSubmitted] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [note, setNote] = useState('')
  const [reconsent, setReconsent] = useState(true)
  const [noteError, setNoteError] = useState(false)
  const complete = sections.every((s) => isComplete(s.heading) && isComplete(s.body))
  const dirty = JSON.stringify(sections) !== JSON.stringify(draft.sections)

  const withDraft = (patch: Partial<DocVersion>) =>
    doc.versions.map((v) => (v.number === draft.number ? { ...v, ...patch } : v))
  const save = () => {
    documentsStore.update(doc.id, {
      versions: withDraft({ sections, editedAt: now(), editedBy: admin?.name ?? '—' }),
    })
    toast(t('document.saved'))
  }
  const askPublish = () => {
    setSubmitted(true)
    if (complete) setPublishing(true)
  }
  const publish = () => {
    if (!note.trim()) {
      setNoteError(true)
      return
    }
    const at = now()
    documentsStore.update(doc.id, {
      versions: doc.versions.map((v) =>
        v.number === draft.number
          ? {
              ...v,
              sections,
              status: 'published',
              editedAt: at,
              editedBy: admin?.name ?? '—',
              publishedAt: at,
              publishedBy: admin?.name ?? '—',
              note: note.trim(),
              reconsent,
            }
          : v.status === 'published'
            ? { ...v, status: 'archived' }
            : v,
      ),
    })
    setPublishing(false)
    toast(t('document.published', { number: String(draft.number) }))
  }
  const discard = () => {
    documentsStore.update(doc.id, {
      versions: doc.versions.filter((v) => v.number !== draft.number),
    })
    toast(t('document.discarded'))
  }

  return (
    <>
      <ActionBar
        eyebrow={`${t('nav.documents')} · ${t('document.draftOf', { number: String(draft.number) })}`}
        title={t(`document.${doc.id}`)}
        onBack={() => navigate(ROUTES.documents)}
      >
        <Button
          size="sm"
          variant="ghost"
          className="text-danger!"
          onClick={() => setDiscarding(true)}
        >
          <Trash2 size={18} />
          {t('document.discard')}
        </Button>
        <Button size="sm" variant="secondary" className="px-4!" disabled={!dirty} onClick={save}>
          {t('common.save')}
        </Button>
        <Button size="sm" className="px-4!" onClick={askPublish}>
          <Send size={18} />
          {t('document.publish')}
        </Button>
      </ActionBar>

      <div className="mx-auto grid w-full max-w-page items-start gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            {t('document.draftHint', { number: String(currentOf(doc)?.number ?? 0) })}
          </p>
          <SectionsEditor sections={sections} onChange={setSections} submitted={submitted} />
        </div>
        <History doc={doc} />
      </div>

      <ConfirmDialog
        open={publishing}
        onClose={() => setPublishing(false)}
        tone="primary"
        title={t('document.publish.title', { number: String(draft.number) })}
        confirmLabel={t('document.publish')}
        onConfirm={publish}
      >
        <p>{t('document.publish.message')}</p>
        <div className="mt-2 flex flex-col gap-4 text-ink">
          <TextField
            label={t('document.note')}
            placeholder={t('document.note.placeholder')}
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setNoteError(false)
            }}
            error={noteError ? t('error.required') : undefined}
          />
          <Checkbox
            label={t('document.reconsent')}
            description={t('document.reconsent.hint')}
            checked={reconsent}
            onChange={setReconsent}
          />
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={discarding}
        onClose={() => setDiscarding(false)}
        title={t('document.discard.title')}
        confirmLabel={t('document.discard')}
        onConfirm={discard}
      >
        <p>{t('document.discard.message')}</p>
      </ConfirmDialog>
    </>
  )
}
