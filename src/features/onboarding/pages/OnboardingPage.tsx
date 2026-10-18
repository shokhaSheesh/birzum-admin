import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { APPS, slidesStore, type AppId, type Slide } from '@/entities/onboarding/slides'
import { dictionaries, type Lang, type TranslationKey } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LangToggle } from '@/shared/ui/LangToggle'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { Switch } from '@/shared/ui/Switch'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { SlideModal } from '../components/SlideModal'
import { SlideThumb } from '../components/SlideThumb'

/** Each app's own button colour, so the preview looks like that app. */
const APP_ACTION: Record<AppId, string> = {
  birzum: 'bg-[#0b3d57]',
  fortuna: 'bg-[#ed1b24]',
  vodiy: 'bg-neutral-700',
}

/**
 * The intro slides each app shows once after the first sign-in: picture, title and line in
 * both languages, in order. Pick the app on top; the phone on the right pages through what
 * that app will show.
 */
export function OnboardingPage() {
  const { t, tl, lang: appLang } = useI18n()
  const all = slidesStore.useAll()
  const [app, setApp] = useState<AppId>('birzum')
  const [editing, setEditing] = useState<Slide | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Slide | null>(null)
  const [previewLang, setPreviewLang] = useState<Lang>(appLang)
  const [at, setAt] = useState(0)
  // The phone speaks the language picked above it, not the panel's
  const inPreview = (key: TranslationKey) => dictionaries[previewLang][key]

  const slides = all.filter((slide) => slide.app === app)
  const shown = slides.filter((slide) => slide.visible)
  const current = shown[Math.min(at, shown.length - 1)]

  // Moves a slide one place within its app, keeping the other apps' slides where they are
  const move = (slide: Slide, by: -1 | 1) => {
    const i = slides.indexOf(slide)
    const other = slides[i + by]
    if (!other) return
    const next = all.map((item) => (item === slide ? other : item === other ? slide : item))
    slidesStore.replaceAll(next)
  }
  const toggle = (slide: Slide) => {
    slidesStore.update(slide.id, { visible: !slide.visible })
    logAction({
      section: 'onboarding',
      kind: 'update',
      action: slide.visible ? 'audit.a.slideHidden' : 'audit.a.slideShown',
      target: tl(slide.title),
    })
    toast(t(slide.visible ? 'slides.hidden' : 'slides.shown'))
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.onboarding')}
        description={t('slides.description')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('slides.add')}
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col rounded-card border border-line bg-canvas">
          <div className="px-4 pt-2">
            <UnderlineTabs
              label={t('nav.onboarding')}
              options={APPS.map((value) => ({
                value,
                label: t(`slides.app.${value}`),
                count: all.filter((slide) => slide.app === value).length,
              }))}
              value={app}
              onChange={(next) => {
                setApp(next)
                setAt(0)
              }}
            />
          </div>
          {slides.length === 0 ? (
            <EmptyState title={t('slides.empty')} hint={t('slides.empty.hint')} />
          ) : (
            <ol className="flex flex-col border-t border-line">
              {slides.map((slide, i) => (
                <li
                  key={slide.id}
                  onClick={() => setEditing(slide)}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 border-b border-line p-4 last:border-b-0 hover:bg-surface/60',
                    !slide.visible && 'bg-surface/40',
                  )}
                >
                  <span className="w-5 text-sm text-ink-subtle tabular-nums">{i + 1}</span>
                  <SlideThumb
                    slide={slide}
                    className={cn('w-32! shrink-0', !slide.visible && 'opacity-50')}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className={cn('font-semibold', !slide.visible && 'text-ink-muted')}>
                      {tl(slide.title)}
                    </p>
                    <p className="line-clamp-2 text-sm text-ink-muted">{tl(slide.text)}</p>
                    {!slide.visible && (
                      <span className="flex items-center gap-1 text-xs font-medium text-ink-subtle">
                        <EyeOff size={14} />
                        {t('slides.hiddenNote')}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {(
                      [
                        [ArrowUp, -1, 'slides.up'],
                        [ArrowDown, 1, 'slides.down'],
                      ] as const
                    ).map(([Icon, by, label]) => (
                      <button
                        key={label}
                        type="button"
                        disabled={!slides[i + by]}
                        onClick={() => move(slide, by)}
                        aria-label={t(label)}
                        title={t(label)}
                        className="grid size-8 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                    <span className="ml-2">
                      <Switch
                        checked={slide.visible}
                        onChange={() => toggle(slide)}
                        label={t('slides.visible')}
                      />
                    </span>
                  </span>
                  <RowActions
                    actions={[
                      { icon: Pencil, label: t('common.edit'), onClick: () => setEditing(slide) },
                      {
                        icon: Trash2,
                        label: t('common.delete'),
                        onClick: () => setDeleting(slide),
                        danger: true,
                      },
                    ]}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{t('slides.preview')}</p>
            <LangToggle value={previewLang} onChange={setPreviewLang} />
          </div>
          {/* The phone: the slide as the app lays it out, with its dots and button */}
          <div className="mx-auto flex aspect-[9/17] w-full max-w-[300px] flex-col rounded-[36px] border-[6px] border-neutral-950 bg-[#f2f5f6] px-5 pt-8 pb-5 text-[#072a3c] shadow-xl">
            {current ? (
              <>
                <p className="text-right text-[10px] font-semibold text-[#56707f]">
                  {inPreview('slides.skip')}
                </p>
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                  <SlideThumb slide={current} className="w-full bg-white" />
                  <p className="text-base leading-tight font-bold text-balance">
                    {current.title[previewLang]}
                  </p>
                  <p className="text-xs text-[#56707f]">{current.text[previewLang]}</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    {shown.map((slide) => (
                      <span
                        key={slide.id}
                        className={cn(
                          'h-1.5 rounded-full',
                          slide === current ? cn('w-4', APP_ACTION[app]) : 'w-1.5 bg-[#ced8dd]',
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      'grid h-9 w-full place-items-center rounded-xl text-xs font-semibold text-white',
                      APP_ACTION[app],
                    )}
                  >
                    {inPreview(current === shown.at(-1) ? 'slides.start' : 'slides.next')}
                  </span>
                </div>
              </>
            ) : (
              <p className="m-auto text-center text-sm text-[#56707f]">{t('slides.noneShown')}</p>
            )}
          </div>
          {shown.length > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAt(Math.max(0, at - 1))}
                disabled={at === 0}
                aria-label={t('slides.prev')}
                className="grid size-9 place-items-center rounded-full border border-line bg-canvas text-ink-muted hover:text-ink disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-ink-muted tabular-nums">
                {Math.min(at, shown.length - 1) + 1} / {shown.length}
              </span>
              <button
                type="button"
                onClick={() => setAt(Math.min(shown.length - 1, at + 1))}
                disabled={at >= shown.length - 1}
                aria-label={t('slides.nextSlide')}
                className="grid size-9 place-items-center rounded-full border border-line bg-canvas text-ink-muted hover:text-ink disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </aside>
      </div>

      {editing !== undefined && (
        <SlideModal
          app={app}
          slide={editing}
          onClose={() => setEditing(undefined)}
          onDelete={(slide) => {
            setEditing(undefined)
            setDeleting(slide)
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('slides.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) {
            slidesStore.remove(deleting.id)
            logAction({
              section: 'onboarding',
              kind: 'delete',
              action: 'audit.a.slideDeleted',
              target: tl(deleting.title),
            })
          }
          setDeleting(null)
          setAt(0)
          toast(t('slides.deleted'))
        }}
      >
        <p>{t('slides.delete.message')}</p>
      </ConfirmDialog>
    </div>
  )
}
