import { Info, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  loanProductsStore,
  PRODUCTS_SYNCED_AT,
  rateRangeOf,
  type LoanProduct,
} from '@/entities/microloans/products'
import { brandPath, WORKSPACE_INFO, type Brand } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { DragList } from '../components/DragList'
import { LoanProductSettingsModal } from '../components/LoanProductSettingsModal'

const millions = (sum: number) => String(Math.round((sum / 1_000_000) * 10) / 10)
const rateText = (item: LoanProduct) => {
  const { from, to } = rateRangeOf(item)
  return from === to ? `${from}%` : `${from}–${to}%`
}
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mahsulotlar of one microloan brand, as FlexSoft has them: code, name, sums, longest term and rate
 * are FlexSoft's and read-only here. The admin sets the order the app lists them in (drag by the
 * grip), and in a modal who each is for, its payment types and whether the app shows it.
 * «FlexSoft-dan yangilash» fetches them again.
 */
export function LoanProductsPage({ brand }: { brand: Brand }) {
  const { t, tl } = useI18n()
  const all = loanProductsStore.useAll()
  const products = all.filter((item) => item.brand === brand)
  const [editing, setEditing] = useState<LoanProduct | null>(null)
  const [syncedAt, setSyncedAt] = useState(PRODUCTS_SYNCED_AT)
  const [syncing, setSyncing] = useState(false)

  // Puts this brand's new order back into the store, the other brand's products where they are
  const place = (ordered: LoanProduct[]) => {
    const queue = [...ordered]
    loanProductsStore.replaceAll(all.map((item) => (item.brand === brand ? queue.shift()! : item)))
    logAction({
      section: 'mlProducts',
      kind: 'update',
      action: 'audit.a.loanProductMoved',
      params: { brand: WORKSPACE_INFO[brand].name },
      href: brandPath(brand, 'products'),
    })
  }
  const sync = async () => {
    setSyncing(true)
    await delay(1200)
    setSyncedAt(new Date())
    setSyncing(false)
    toast(t('mlProducts.synced'))
  }

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.products')}
        actions={
          <Button variant="secondary" loading={syncing} onClick={() => void sync()}>
            <RefreshCw size={18} />
            {t('mlProducts.sync')}
          </Button>
        }
      />

      <p className="flex items-start gap-2 rounded-control bg-surface p-3 text-sm text-ink-muted">
        <Info size={18} className="mt-0.5 shrink-0" />
        {t('mlProducts.fromFlexSoft.hint', { time: formatDateTime(syncedAt) })}
      </p>

      <section className="overflow-hidden rounded-card border border-line bg-canvas">
        {products.length === 0 ? (
          <EmptyState title={t('mlProducts.empty')} />
        ) : (
          <DragList
            items={products}
            name={(item) => item.name}
            onReorder={place}
            onOpen={setEditing}
            render={(item) => (
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-4">
                <div className="min-w-0">
                  <p className={cn('font-semibold', !item.enabled && 'text-ink-muted')}>
                    {item.name}{' '}
                    <span className="text-xs font-normal text-ink-subtle tabular-nums">
                      · {item.code}
                    </span>
                  </p>
                  <p className="truncate text-xs text-ink-subtle">{tl(item.for)}</p>
                </div>
                <span className="text-sm whitespace-nowrap tabular-nums">
                  {t('mlProducts.sumRange', { min: millions(item.min), max: millions(item.max) })}
                </span>
                <span className="text-sm whitespace-nowrap tabular-nums">
                  {t('mlProducts.upToMonths', { n: String(item.termMax) })}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                  {rateText(item)}
                </span>
                <span className="text-sm">
                  {item.payTypes.map((type) => t(`payType.${type}`)).join(', ')}
                </span>
                <StatusBadge tone={item.enabled ? 'success' : 'neutral'}>
                  {t(item.enabled ? 'mlProducts.on' : 'mlProducts.off')}
                </StatusBadge>
              </div>
            )}
          />
        )}
      </section>

      {editing && <LoanProductSettingsModal product={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
