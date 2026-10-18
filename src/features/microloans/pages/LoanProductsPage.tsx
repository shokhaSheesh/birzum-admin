import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { loanProductsStore, rateRangeOf, type LoanProduct } from '@/entities/microloans/products'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { LoanProductModal } from '../components/LoanProductModal'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const rateText = (item: LoanProduct) => {
  const { from, to } = rateRangeOf(item)
  return from === to ? `${from}%` : `${from}–${to}%`
}
const millions = (sum: number) => String(Math.round((sum / 1_000_000) * 10) / 10)

/**
 * Mahsulotlar of one microloan brand: every product its app offers, in the order the app lists
 * them, with the sum range, yearly rate and terms the calculator uses. Added and edited in a
 * modal; the arrows set the order.
 */
export function LoanProductsPage({ brand }: { brand: Brand }) {
  const { t, tl } = useI18n()
  const all = loanProductsStore.useAll()
  const [editing, setEditing] = useState<LoanProduct | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<LoanProduct | null>(null)
  const products = all.filter((item) => item.brand === brand)
  const brandName = WORKSPACE_INFO[brand].name

  // Moves a product one place within its brand, keeping the other brand's where they are
  const move = (item: LoanProduct, by: -1 | 1) => {
    const i = products.indexOf(item)
    const other = products[i + by]
    if (!other) return
    loanProductsStore.replaceAll(all.map((p) => (p === item ? other : p === other ? item : p)))
    logAction({
      section: 'mlProducts',
      kind: 'update',
      action: 'audit.a.loanProductMoved',
      params: { brand: brandName },
      target: item.name,
      href: brandPath(brand, 'products'),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.products')}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus size={20} />
            {t('mlProducts.add')}
          </Button>
        }
      />

      <section className="overflow-hidden rounded-card border border-line bg-canvas">
        {products.length === 0 ? (
          <EmptyState title={t('mlProducts.empty')} hint={t('mlProducts.empty.hint')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead className="border-b border-line bg-surface/60">
                <tr>
                  <th className={cn(th, 'w-12')}>№</th>
                  <th className={th}>{t('mlProducts.col.product')}</th>
                  <th className={th}>{t('mlProducts.col.sum')}</th>
                  <th className={th}>{t('mlProducts.col.rate')}</th>
                  <th className={th}>{t('mlProducts.col.term')}</th>
                  <th className={th}>{t('mlProducts.col.status')}</th>
                  <th className={cn(th, 'w-px')}>
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, i) => (
                  <tr
                    key={item.id}
                    onClick={() => setEditing(item)}
                    className={cn(
                      'cursor-pointer border-b border-line last:border-b-0 hover:bg-surface/60',
                      !item.enabled && 'bg-surface/40',
                    )}
                  >
                    <td className="px-4 py-3.5 text-sm text-ink-subtle tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <p className={cn('font-semibold', !item.enabled && 'text-ink-muted')}>
                        {item.name}
                      </p>
                      <p className="max-w-80 truncate text-xs text-ink-subtle">{tl(item.for)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums">
                      {t('mlProducts.sumRange', {
                        min: millions(item.min),
                        max: millions(item.max),
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap tabular-nums">
                      {rateText(item)}
                      <span className="block text-xs font-normal text-ink-muted">
                        {t(`mlProducts.mode.${item.rateMode}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums">
                      {t('mlProducts.termRange', {
                        min: String(item.termMin),
                        max: String(item.termMax),
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge tone={item.enabled ? 'success' : 'neutral'}>
                        {t(item.enabled ? 'mlProducts.on' : 'mlProducts.off')}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {(
                          [
                            [ArrowUp, -1, 'slides.up'],
                            [ArrowDown, 1, 'slides.down'],
                          ] as const
                        ).map(([Icon, by, label]) => (
                          <button
                            key={label}
                            type="button"
                            disabled={!products[i + by]}
                            onClick={() => move(item, by)}
                            aria-label={t(label)}
                            title={t(label)}
                            className="grid size-8 place-items-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                          >
                            <Icon size={16} />
                          </button>
                        ))}
                        <RowActions
                          actions={[
                            {
                              icon: Pencil,
                              label: t('common.edit'),
                              onClick: () => setEditing(item),
                            },
                            {
                              icon: Trash2,
                              label: t('common.delete'),
                              onClick: () => setDeleting(item),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing !== undefined && (
        <LoanProductModal
          brand={brand}
          product={editing}
          onClose={() => setEditing(undefined)}
          onDelete={(item) => {
            setEditing(undefined)
            setDeleting(item)
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('mlProducts.delete.title', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) {
            loanProductsStore.remove(deleting.id)
            logAction({
              section: 'mlProducts',
              kind: 'delete',
              action: 'audit.a.loanProductDeleted',
              params: { brand: brandName },
              target: deleting.name,
            })
          }
          setDeleting(null)
          toast(t('mlProducts.deleted'))
        }}
      >
        <p>{t('mlProducts.delete.message')}</p>
      </ConfirmDialog>
    </div>
  )
}
