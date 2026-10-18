import {
  CornerDownRight,
  GripVertical,
  List,
  ListTree,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useState, type DragEvent, type KeyboardEvent } from 'react'
import {
  categoriesStore,
  childrenOf,
  productsIn,
  rootsOf,
  type Category,
} from '@/entities/catalog/categories'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { ViewToggle } from '@/shared/ui/ViewToggle'
import { CategoryModal } from '../components/CategoryModal'
import { CategoryThumb } from '../components/CategoryThumb'
import { logAction } from '@/entities/audit/audit'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

type View = 'tree' | 'list'
type Drop = { id: string; after: boolean }

/** The list with `moved` placed before or after `target`; the two must be siblings. */
function reorder(all: Category[], moved: Category, target: Category, after: boolean) {
  const siblings = all.filter((item) => item.parentId === moved.parentId && item !== moved)
  const at = siblings.indexOf(target) + (after ? 1 : 0)
  const order = [...siblings.slice(0, at), moved, ...siblings.slice(at)]
  // Siblings keep their slots in the full list; only who sits in them changes
  let next = 0
  return all.map((item) => (item.parentId === moved.parentId ? order[next++] : item))
}

/**
 * Every product category. The tree view shows subcategories under their category in the
 * order shoppers see them, and rows are dragged by their handle to reorder them among their
 * siblings. The list view is flat, A to Z, with a search. Rows open the edit modal.
 */
export function CategoriesPage() {
  const { t, tl } = useI18n()
  const all = categoriesStore.useAll()
  const [view, setView] = useState<View>('tree')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Category | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [dragged, setDragged] = useState<Category | null>(null)
  const [drop, setDrop] = useState<Drop | null>(null)

  const askDelete = (category: Category) => {
    setEditing(undefined)
    setDeleting(category)
  }
  const remove = (category: Category) => {
    categoriesStore.remove(category.id)
    setDeleting(null)
    toast(t('category.deleted'))
    logAction({
      section: 'categories',
      kind: 'delete',
      action: 'audit.a.categoryDeleted',
      target: tl(category.name),
    })
  }
  const hide = (category: Category) => {
    categoriesStore.update(category.id, { visible: false })
    setDeleting(null)
    toast(t('category.hidden'))
    logAction({
      section: 'categories',
      kind: 'update',
      action: 'audit.a.categoryHidden',
      target: tl(category.name),
    })
  }

  const dragOver = (e: DragEvent, target: Category) => {
    if (!dragged || dragged === target || dragged.parentId !== target.parentId) return
    e.preventDefault()
    const box = e.currentTarget.getBoundingClientRect()
    setDrop({ id: target.id, after: e.clientY > box.top + box.height / 2 })
  }
  const dropOn = (target: Category) => {
    if (dragged && drop && dragged !== target)
      categoriesStore.replaceAll(reorder(all, dragged, target, drop.after))
    setDragged(null)
    setDrop(null)
  }
  // The handle also moves a row with the arrow keys, for keyboards and screen readers
  const keyMove = (e: KeyboardEvent, category: Category) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const siblings = all.filter((item) => item.parentId === category.parentId)
    const target = siblings[siblings.indexOf(category) + (e.key === 'ArrowUp' ? -1 : 1)]
    if (target) categoriesStore.replaceAll(reorder(all, category, target, e.key === 'ArrowDown'))
  }

  const parentOf = (category: Category) => all.find((item) => item.id === category.parentId)
  // A subcategory of a hidden category is hidden too, whatever its own switch says
  const shownOf = (category: Category) => category.visible && (parentOf(category)?.visible ?? true)

  const cells = (category: Category, indent: boolean) => {
    const children = childrenOf(all, category.id)
    const shown = shownOf(category)
    return (
      <>
        <td className="px-4 py-3">
          <div className={cn('flex items-center gap-3', indent && 'pl-6')}>
            {indent && <CornerDownRight size={18} className="shrink-0 text-ink-subtle" />}
            <CategoryThumb image={category.image} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{category.name.uz}</span>
              <span className="truncate text-sm text-ink-muted">
                {category.name.ru}
                {children.length > 0 &&
                  ` · ${t('categories.subCount', { count: String(children.length) })}`}
              </span>
            </div>
          </div>
        </td>
        {view === 'list' && (
          <td className="px-4 py-3 text-sm text-ink-muted">
            {parentOf(category) ? tl(parentOf(category)!.name) : '—'}
          </td>
        )}
        <td className="px-4 py-3 text-right tabular-nums">
          {groupDigits(productsIn(all, category))}
        </td>
        <td className="px-4 py-3">
          <StatusBadge tone={shown ? 'success' : 'neutral'}>
            {t(shown ? 'category.shown' : 'category.hiddenBadge')}
          </StatusBadge>
        </td>
        <td className="pr-3">
          <RowActions
            actions={[
              { icon: Pencil, label: t('common.edit'), onClick: () => setEditing(category) },
              {
                icon: Trash2,
                label: t('common.delete'),
                onClick: () => askDelete(category),
                danger: true,
              },
            ]}
          />
        </td>
      </>
    )
  }

  const treeRow = (category: Category, indent: boolean) => (
    <tr
      key={category.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        setDragged(category)
      }}
      onDragEnd={() => {
        setDragged(null)
        setDrop(null)
      }}
      onDragOver={(e) => dragOver(e, category)}
      onDrop={() => dropOn(category)}
      onClick={() => setEditing(category)}
      className={cn(
        'cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60',
        indent && 'bg-surface/30',
        dragged === category && 'opacity-40',
        drop?.id === category.id &&
          (drop.after
            ? 'shadow-[inset_0_-2px_0_var(--color-primary)]'
            : 'shadow-[inset_0_2px_0_var(--color-primary)]'),
      )}
    >
      <td className="w-12 py-3 pl-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onKeyDown={(e) => keyMove(e, category)}
          aria-label={t('categories.drag', { name: tl(category.name) })}
          title={t('categories.drag', { name: tl(category.name) })}
          className="grid size-8 cursor-grab place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      </td>
      {cells(category, indent)}
    </tr>
  )

  const needle = query.trim().toLowerCase()
  const listRows = [...all]
    .filter(
      (category) =>
        needle === '' ||
        category.name.uz.toLowerCase().includes(needle) ||
        category.name.ru.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.name.uz.localeCompare(b.name.uz))
  const deletingChildren = deleting ? childrenOf(all, deleting.id).length : 0

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.categories')}
        description={t('categories.description')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('categories.add')}
          </Button>
        }
      />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <ViewToggle
            label={t('categories.view')}
            options={[
              { value: 'tree', label: t('categories.view.tree'), icon: ListTree },
              { value: 'list', label: t('categories.view.list'), icon: List },
            ]}
            value={view}
            onChange={setView}
          />
          {view === 'list' && (
            <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
              <Search size={18} className="shrink-0" />
              <span className="sr-only">{t('categories.search')}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('categories.search')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </label>
          )}
        </div>

        {(view === 'tree' ? all : listRows).length === 0 ? (
          <EmptyState title={t('categories.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-t border-line">
              <thead>
                <tr className="border-b border-line">
                  {view === 'tree' && <th className="w-12" aria-label={t('categories.order')} />}
                  <th className={th}>{t('categories.col.name')}</th>
                  {view === 'list' && <th className={th}>{t('category.parent')}</th>}
                  <th className={`${th} text-right`}>{t('merchants.col.products')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {view === 'tree'
                  ? rootsOf(all).flatMap((root) => [
                      treeRow(root, false),
                      ...childrenOf(all, root.id).map((child) => treeRow(child, true)),
                    ])
                  : listRows.map((category) => (
                      <tr
                        key={category.id}
                        onClick={() => setEditing(category)}
                        className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                      >
                        {cells(category, false)}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-5 py-3 text-sm text-ink-muted">
          {t(view === 'tree' ? 'categories.orderHint' : 'categories.listHint')}
        </p>
      </div>

      {editing !== undefined && (
        <CategoryModal
          key={editing?.id ?? 'new'}
          category={editing}
          onClose={() => setEditing(undefined)}
          onDelete={askDelete}
        />
      )}

      {deleting &&
        (deletingChildren > 0 || deleting.products > 0 ? (
          <ConfirmDialog
            open
            onClose={() => setDeleting(null)}
            title={t('common.cantDelete')}
            tone="primary"
            cancelLabel={deleting.visible ? undefined : t('common.understood')}
            confirmLabel={deleting.visible ? t('category.hide') : undefined}
            onConfirm={() => hide(deleting)}
          >
            <p>
              {deletingChildren > 0
                ? t('category.delete.hasChildren', {
                    name: tl(deleting.name),
                    count: String(deletingChildren),
                  })
                : t('category.delete.blockedHint', {
                    name: tl(deleting.name),
                    count: groupDigits(deleting.products),
                  })}
            </p>
            {deleting.visible && <p>{t('category.delete.hideHint')}</p>}
          </ConfirmDialog>
        ) : (
          <ConfirmDialog
            open
            onClose={() => setDeleting(null)}
            title={t('category.delete.title')}
            confirmLabel={t('common.delete')}
            onConfirm={() => remove(deleting)}
          >
            <p>{t('category.delete.message', { name: tl(deleting.name) })}</p>
          </ConfirmDialog>
        ))}
    </div>
  )
}
