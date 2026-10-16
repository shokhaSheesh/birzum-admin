import { ChevronDown, ChevronUp, CornerDownRight, Plus } from 'lucide-react'
import { useState } from 'react'
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
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { CategoryModal } from '../components/CategoryModal'
import { CategoryThumb } from '../components/CategoryThumb'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const arrow =
  'grid h-6 w-8 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink disabled:opacity-30'

type Editing = { category: Category | null; parentId?: string }

/**
 * Every product category with its subcategories under it, in the order shoppers see them.
 * A row opens it in a modal; the arrows move it among its siblings. A category with products
 * or subcategories cannot be deleted.
 */
export function CategoriesPage() {
  const { t, tl } = useI18n()
  const all = categoriesStore.useAll()
  const [editing, setEditing] = useState<Editing | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  // Swaps a category with its previous or next sibling; the rest of the list keeps its place
  const move = (category: Category, by: -1 | 1) => {
    const siblings = all.filter((item) => item.parentId === category.parentId)
    const other = siblings[siblings.indexOf(category) + by]
    if (!other) return
    categoriesStore.replaceAll(
      all.map((item) => (item === category ? other : item === other ? category : item)),
    )
  }
  const askDelete = (category: Category) => {
    setEditing(null)
    setDeleting(category)
  }
  const remove = (category: Category) => {
    categoriesStore.remove(category.id)
    setDeleting(null)
    toast(t('category.deleted'))
  }
  const hide = (category: Category) => {
    categoriesStore.update(category.id, { visible: false })
    setDeleting(null)
    toast(t('category.hidden'))
  }

  const row = (category: Category, siblings: Category[], parent?: Category) => {
    const index = siblings.indexOf(category)
    const children = parent ? [] : childrenOf(all, category.id)
    // A subcategory of a hidden category is hidden too, whatever its own switch says
    const shown = category.visible && (parent?.visible ?? true)
    return (
      <tr
        key={category.id}
        onClick={() => setEditing({ category })}
        className={cn(
          'cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60',
          parent && 'bg-surface/30',
        )}
      >
        <td className="py-2 pl-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(category, -1)}
              aria-label={t('categories.up', { name: tl(category.name) })}
              className={arrow}
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              disabled={index === siblings.length - 1}
              onClick={() => move(category, 1)}
              aria-label={t('categories.down', { name: tl(category.name) })}
              className={arrow}
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className={cn('flex items-center gap-3', parent && 'pl-6')}>
            {parent && <CornerDownRight size={18} className="shrink-0 text-ink-subtle" />}
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
        <td className="px-4 py-3 text-right tabular-nums">
          {groupDigits(productsIn(all, category))}
        </td>
        <td className="px-4 py-3">
          <StatusBadge tone={shown ? 'success' : 'neutral'}>
            {t(shown ? 'category.shown' : 'category.hiddenBadge')}
          </StatusBadge>
        </td>
        <td className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
          {!parent && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => setEditing({ category: null, parentId: category.id })}
            >
              <Plus size={18} />
              {t('categories.addSub')}
            </Button>
          )}
        </td>
      </tr>
    )
  }

  const roots = rootsOf(all)
  const deletingChildren = deleting ? childrenOf(all, deleting.id).length : 0

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.categories')}
        description={t('categories.description')}
        actions={
          <Button onClick={() => setEditing({ category: null })}>
            <Plus size={20} />
            {t('categories.add')}
          </Button>
        }
      />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        {all.length === 0 ? (
          <EmptyState title={t('categories.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="w-16" aria-label={t('categories.order')} />
                  <th className={th}>{t('categories.col.name')}</th>
                  <th className={`${th} text-right`}>{t('merchants.col.products')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className="w-48" />
                </tr>
              </thead>
              <tbody>
                {roots.flatMap((root) => {
                  const children = childrenOf(all, root.id)
                  return [row(root, roots), ...children.map((child) => row(child, children, root))]
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-5 py-3 text-sm text-ink-muted">
          {t('categories.orderHint')}
        </p>
      </div>

      {editing && (
        <CategoryModal
          key={editing.category?.id ?? `new-${editing.parentId ?? ''}`}
          category={editing.category}
          parentId={editing.parentId}
          onClose={() => setEditing(null)}
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
