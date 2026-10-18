import { EyeOff, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type DragEvent, type KeyboardEvent } from 'react'
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

/** The list with `moved` placed before or after `target`. */
function reorder(list: Slide[], moved: Slide, target: Slide, after: boolean) {
  const rest = list.filter((item) => item !== moved)
  const at = rest.indexOf(target) + (after ? 1 : 0)
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

/**
 * The intro slides an app shows once after the first sign-in: picture, title and line in both
 * languages, in order, dragged by their handle to reorder. Each business's own menu opens its
 * app's slides.
 */
export function OnboardingPage({ app }: { app: AppId }) {
  const { t, tl } = useI18n()
  const all = slidesStore.useAll()
  const [editing, setEditing] = useState<Slide | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Slide | null>(null)
  const [dragged, setDragged] = useState<Slide | null>(null)
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null)

  const slides = all.filter((slide) => slide.app === app)

  // Puts this app's new order back into the store, the other apps' slides where they are
  const place = (ordered: Slide[]) => {
    const queue = [...ordered]
    slidesStore.replaceAll(all.map((item) => (item.app === app ? queue.shift()! : item)))
  }
  const dragOver = (e: DragEvent, target: Slide) => {
    if (!dragged || dragged === target) return
    e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    setDrop({ id: target.id, after: e.clientY > box.top + box.height / 2 })
  }
  const dropOn = (target: Slide) => {
    if (dragged && drop && dragged !== target) place(reorder(slides, dragged, target, drop.after))
    setDragged(null)
    setDrop(null)
  }
  // The handle also moves a slide with the arrow keys, for keyboards and screen readers
  const keyMove = (e: KeyboardEvent, slide: Slide) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const target = slides[slides.indexOf(slide) + (e.key === 'ArrowUp' ? -1 : 1)]
    if (target) place(reorder(slides, slide, target, e.key === 'ArrowDown'))
  }
  const toggle = (slide: Slide) => {
    slidesStore.update(slide.id, { visible: !slide.visible })
    logAction({
      section: app === 'birzum' ? 'onboarding' : 'mlOnboarding',
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
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  setDragged(slide)
                }}
                onDragEnd={() => {
                  setDragged(null)
                  setDrop(null)
                }}
                onDragOver={(e) => dragOver(e, slide)}
                onDrop={() => dropOn(slide)}
                onClick={() => setEditing(slide)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 border-b border-line py-4 pr-4 pl-2 last:border-b-0 hover:bg-surface/60',
                  !slide.visible && 'bg-surface/40',
                  dragged === slide && 'opacity-40',
                  drop?.id === slide.id &&
                    (drop.after
                      ? 'shadow-[inset_0_-2px_0_var(--color-primary)]'
                      : 'shadow-[inset_0_2px_0_var(--color-primary)]'),
                )}
              >
                <span onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onKeyDown={(e) => keyMove(e, slide)}
                    aria-label={t('faq.drag', { question: tl(slide.title) })}
                    title={t('faq.drag', { question: tl(slide.title) })}
                    className="grid size-8 cursor-grab place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink active:cursor-grabbing"
                  >
                    <GripVertical size={18} />
                  </button>
                </span>
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
                  <Switch
                    checked={slide.visible}
                    onChange={() => toggle(slide)}
                    label={t('slides.visible')}
                  />
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
              section: app === 'birzum' ? 'onboarding' : 'mlOnboarding',
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
