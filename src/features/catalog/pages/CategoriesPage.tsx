import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { categoriesStore, type Category } from '@/entities/catalog/categories'
import { useI18n } from '@/shared/i18n/useI18n'
import { groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { CategoryDrawer } from '../components/CategoryDrawer'
import { CategoryThumb } from '../components/CategoryThumb'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Every product category, in the order shoppers see them. A row opens it in a side panel;
 * the arrows move it up or down. A category with products cannot be deleted, only hidden.
 */
export function CategoriesPage() {
  const { t, tl } = useI18n()
  const all = categoriesStore.useAll()
  // undefined: closed; null: creating; a category: editing it
  const [editing, setEditing] = useState<Category | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const move = (index: number, by: -1 | 1) => {
    const next = [...all]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    categoriesStore.replaceAll(next)
  }
  const askDelete = (category: Category) => {
    setEditing(undefined)
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
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
        {all.length === 0 ? (
          <EmptyState title={t('categories.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="w-16" aria-label={t('categories.order')} />
                  <th className={th}>{t('categories.col.name')}</th>
                  <th className={`${th} text-right`}>{t('merchants.col.products')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                </tr>
              </thead>
              <tbody>
                {all.map((category, index) => (
                  <tr
                    key={category.id}
                    onClick={() => setEditing(category)}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                  >
                    <td className="py-2 pl-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          aria-label={t('categories.up', { name: tl(category.name) })}
                          className="grid h-6 w-8 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          disabled={index === all.length - 1}
                          onClick={() => move(index, 1)}
                          aria-label={t('categories.down', { name: tl(category.name) })}
                          className="grid h-6 w-8 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CategoryThumb image={category.image} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">{category.name.uz}</span>
                          <span className="truncate text-sm text-ink-muted">
                            {category.name.ru}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {groupDigits(category.products)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={category.visible ? 'success' : 'neutral'}>
                        {t(category.visible ? 'category.shown' : 'category.hiddenBadge')}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-5 py-3 text-sm text-ink-muted">
          {t('categories.orderHint')}
        </p>
      </div>

      {editing !== undefined && (
        <CategoryDrawer
          key={editing?.id ?? 'new'}
          category={editing}
          onClose={() => setEditing(undefined)}
          onDelete={askDelete}
        />
      )}

      {deleting &&
        (deleting.products > 0 ? (
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
              {t('category.delete.blockedHint', {
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
