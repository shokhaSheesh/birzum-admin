import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { brandsStore, type Brand } from '@/entities/catalog/brands'
import { useI18n } from '@/shared/i18n/useI18n'
import { groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { BrandModal } from '../components/BrandModal'
import { BrandLogo } from '../components/BrandLogo'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/**
 * Every brand merchants can pick, A to Z, with a search. A row opens it in a side panel.
 * A brand with products cannot be deleted.
 */
export function BrandsPage() {
  const { t } = useI18n()
  const all = brandsStore.useAll()
  const [query, setQuery] = useState('')
  // undefined: closed; null: creating; a brand: editing it
  const [editing, setEditing] = useState<Brand | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Brand | null>(null)

  const needle = query.trim().toLowerCase()
  const rows = all
    .filter((brand) => brand.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))

  const askDelete = (brand: Brand) => {
    setEditing(undefined)
    setDeleting(brand)
  }
  const remove = (brand: Brand) => {
    brandsStore.remove(brand.id)
    setDeleting(null)
    toast(t('brand.deleted'))
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.brands')}
        description={t('brands.description')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('brands.add')}
          </Button>
        }
      />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="flex items-center justify-between gap-4 p-4">
          <p className="text-sm text-ink-muted">
            {t('brands.count', { count: String(all.length) })}
          </p>
          <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-control bg-surface px-3 text-ink-subtle">
            <Search size={18} className="shrink-0" />
            <span className="sr-only">{t('brands.search')}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('brands.search')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t('brands.empty')} />
        ) : (
          <table className="w-full border-t border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>{t('brands.col.brand')}</th>
                <th className={`${th} text-right`}>{t('merchants.col.products')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((brand) => (
                <tr
                  key={brand.id}
                  onClick={() => setEditing(brand)}
                  className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <BrandLogo brand={brand} />
                      <span className="truncate font-semibold">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {groupDigits(brand.products)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== undefined && (
        <BrandModal
          key={editing?.id ?? 'new'}
          brand={editing}
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
            cancelLabel={t('common.understood')}
          >
            <p>
              {t('brand.delete.blockedHint', {
                name: deleting.name,
                count: groupDigits(deleting.products),
              })}
            </p>
          </ConfirmDialog>
        ) : (
          <ConfirmDialog
            open
            onClose={() => setDeleting(null)}
            title={t('brand.delete.title')}
            confirmLabel={t('common.delete')}
            onConfirm={() => remove(deleting)}
          >
            <p>{t('brand.delete.message', { name: deleting.name })}</p>
          </ConfirmDialog>
        ))}
    </div>
  )
}
