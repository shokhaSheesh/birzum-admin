import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { slidesStore, type AppId, type Slide } from '@/entities/onboarding/slides'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { Switch } from '@/shared/ui/Switch'
import { SlideModal } from '../components/SlideModal'
import { SlideThumb } from '../components/SlideThumb'

/**
 * The intro slides an app shows once after the first sign-in: picture, title and line in both
 * languages, in order. Each business's own menu opens its app's slides.
 */
export function OnboardingPage({ app }: { app: AppId }) {
  const { t, tl } = useI18n()
  const all = slidesStore.useAll()
  const [editing, setEditing] = useState<Slide | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Slide | null>(null)

  const slides = all.filter((slide) => slide.app === app)

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

      <section className="flex flex-col rounded-card border border-line bg-canvas">
        {slides.length === 0 ? (
          <EmptyState title={t('slides.empty')} hint={t('slides.empty.hint')} />
        ) : (
          <ol className="flex flex-col">
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
          toast(t('slides.deleted'))
        }}
      >
        <p>{t('slides.delete.message')}</p>
      </ConfirmDialog>
    </div>
  )
}
