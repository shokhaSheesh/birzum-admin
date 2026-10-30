import { GripVertical } from 'lucide-react'
import { useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

/** The list with `moved` placed before or after `target`. */
function reorder<T>(list: T[], moved: T, target: T, after: boolean) {
  const rest = list.filter((item) => item !== moved)
  const at = rest.indexOf(target) + (after ? 1 : 0)
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

/**
 * Rows in the order the app shows them, dragged by the grip at the start (arrow keys on the grip
 * too). A click on a row opens it.
 */
export function DragList<T extends { id: string }>({
  items,
  name,
  render,
  onReorder,
  onOpen,
}: {
  items: T[]
  /** For the grip's label, e.g. the row's title. */
  name: (item: T) => string
  render: (item: T, index: number) => ReactNode
  onReorder: (ordered: T[]) => void
  onOpen: (item: T) => void
}) {
  const { t } = useI18n()
  const [dragged, setDragged] = useState<T | null>(null)
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null)

  const dragOver = (e: DragEvent, target: T) => {
    if (!dragged || dragged === target) return
    e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    setDrop({ id: target.id, after: e.clientY > box.top + box.height / 2 })
  }
  const dropOn = (target: T) => {
    if (dragged && drop && dragged !== target)
      onReorder(reorder(items, dragged, target, drop.after))
    setDragged(null)
    setDrop(null)
  }
  const keyMove = (e: KeyboardEvent, item: T) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const target = items[items.indexOf(item) + (e.key === 'ArrowUp' ? -1 : 1)]
    if (target) onReorder(reorder(items, item, target, e.key === 'ArrowDown'))
  }

  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            setDragged(item)
          }}
          onDragEnd={() => {
            setDragged(null)
            setDrop(null)
          }}
          onDragOver={(e) => dragOver(e, item)}
          onDrop={() => dropOn(item)}
          onClick={() => onOpen(item)}
          className={cn(
            'flex cursor-pointer items-center gap-3 border-b border-line py-3 pr-4 pl-2 last:border-b-0 hover:bg-surface/60',
            dragged === item && 'opacity-40',
            drop?.id === item.id &&
              (drop.after
                ? 'shadow-[inset_0_-2px_0_var(--color-primary)]'
                : 'shadow-[inset_0_2px_0_var(--color-primary)]'),
          )}
        >
          <span onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onKeyDown={(e) => keyMove(e, item)}
              aria-label={t('banners.drag', { title: name(item) })}
              title={t('banners.drag', { title: name(item) })}
              className="grid size-8 cursor-grab place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink active:cursor-grabbing"
            >
              <GripVertical size={18} />
            </button>
          </span>
          <span className="w-5 text-sm text-ink-subtle tabular-nums">{i + 1}</span>
          {render(item, i)}
        </li>
      ))}
    </ol>
  )
}
