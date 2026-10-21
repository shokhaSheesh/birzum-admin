import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useState, type DragEvent, type KeyboardEvent } from 'react'
import { logAction } from '@/entities/audit/audit'
import { bannersStore, bannerState, type Banner } from '@/entities/onboarding/banners'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { RowActions } from '@/shared/ui/RowActions'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Switch } from '@/shared/ui/Switch'
import { BannerModal } from './BannerModal'
import { BannerThumb } from './BannerThumb'
import { datesSummary, stateTone, targetSummary } from './bannerText'

/** The list with `moved` placed before or after `target`. */
function reorder(list: Banner[], moved: Banner, target: Banner, after: boolean) {
  const rest = list.filter((item) => item !== moved)
  const at = rest.indexOf(target) + (after ? 1 : 0)
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

/**
 * Birzum's Bosh sahifa banners, in the order the carousel shows them, dragged by their handle.
 * Each row: picture, name, what it opens, its dates and where it stands today.
 */
export function BannerList({
  editing,
  setEditing,
}: {
  /** The banner open in the modal: null for a new one, undefined for none. */
  editing: Banner | null | undefined
  setEditing: (banner: Banner | null | undefined) => void
}) {
  const { t, tl } = useI18n()
  const banners = bannersStore.useAll()
  const [deleting, setDeleting] = useState<Banner | null>(null)
  const [dragged, setDragged] = useState<Banner | null>(null)
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null)

  const dragOver = (e: DragEvent, target: Banner) => {
    if (!dragged || dragged === target) return
    e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    setDrop({ id: target.id, after: e.clientY > box.top + box.height / 2 })
  }
  const dropOn = (target: Banner) => {
    if (dragged && drop && dragged !== target)
      bannersStore.replaceAll(reorder(banners, dragged, target, drop.after))
    setDragged(null)
    setDrop(null)
  }
  // The handle also moves a banner with the arrow keys, for keyboards and screen readers
  const keyMove = (e: KeyboardEvent, banner: Banner) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const target = banners[banners.indexOf(banner) + (e.key === 'ArrowUp' ? -1 : 1)]
    if (target) bannersStore.replaceAll(reorder(banners, banner, target, e.key === 'ArrowDown'))
  }
  const toggle = (banner: Banner) => {
    bannersStore.update(banner.id, { visible: !banner.visible })
    logAction({
      section: 'onboarding',
      kind: 'update',
      action: banner.visible ? 'audit.a.bannerHidden' : 'audit.a.bannerShown',
      target: tl(banner.title),
    })
    toast(t(banner.visible ? 'banners.hidden' : 'banners.shown'))
  }

  return (
    <>
      <section className="flex flex-col rounded-card border border-line bg-canvas">
        {banners.length === 0 ? (
          <EmptyState title={t('banners.empty')} hint={t('banners.empty.hint')} />
        ) : (
          <ol className="flex flex-col">
            {banners.map((banner, i) => {
              const state = bannerState(banner)
              return (
                <li
                  key={banner.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    setDragged(banner)
                  }}
                  onDragEnd={() => {
                    setDragged(null)
                    setDrop(null)
                  }}
                  onDragOver={(e) => dragOver(e, banner)}
                  onDrop={() => dropOn(banner)}
                  onClick={() => setEditing(banner)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 border-b border-line py-4 pr-4 pl-2 last:border-b-0 hover:bg-surface/60',
                    state !== 'live' && 'bg-surface/40',
                    dragged === banner && 'opacity-40',
                    drop?.id === banner.id &&
                      (drop.after
                        ? 'shadow-[inset_0_-2px_0_var(--color-primary)]'
                        : 'shadow-[inset_0_2px_0_var(--color-primary)]'),
                  )}
                >
                  <span onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onKeyDown={(e) => keyMove(e, banner)}
                      aria-label={t('banners.drag', { title: tl(banner.title) })}
                      title={t('banners.drag', { title: tl(banner.title) })}
                      className="grid size-8 cursor-grab place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink active:cursor-grabbing"
                    >
                      <GripVertical size={18} />
                    </button>
                  </span>
                  <span className="w-5 text-sm text-ink-subtle tabular-nums">{i + 1}</span>
                  <BannerThumb
                    banner={banner}
                    className={cn('w-36! shrink-0', state !== 'live' && 'opacity-50')}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className={cn('font-semibold', state !== 'live' && 'text-ink-muted')}>
                      {tl(banner.title)}
                    </p>
                    <p className="text-sm text-ink-muted">{targetSummary(banner, t)}</p>
                    <p className="text-sm text-ink-muted tabular-nums">{datesSummary(banner, t)}</p>
                  </div>
                  <StatusBadge tone={stateTone[state]}>{t(`banners.state.${state}`)}</StatusBadge>
                  <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={banner.visible}
                      onChange={() => toggle(banner)}
                      label={t('slides.visible')}
                    />
                  </span>
                  <RowActions
                    actions={[
                      { icon: Pencil, label: t('common.edit'), onClick: () => setEditing(banner) },
                      {
                        icon: Trash2,
                        label: t('common.delete'),
                        onClick: () => setDeleting(banner),
                        danger: true,
                      },
                    ]}
                  />
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {editing !== undefined && (
        <BannerModal
          banner={editing}
          onClose={() => setEditing(undefined)}
          onDelete={(banner) => {
            setEditing(undefined)
            setDeleting(banner)
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('banners.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) {
            bannersStore.remove(deleting.id)
            logAction({
              section: 'onboarding',
              kind: 'delete',
              action: 'audit.a.bannerDeleted',
              target: tl(deleting.title),
            })
          }
          setDeleting(null)
          toast(t('banners.deleted'))
        }}
      >
        <p>{t('banners.delete.message')}</p>
      </ConfirmDialog>
    </>
  )
}
