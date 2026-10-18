import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { groupDigits } from '@/shared/lib/format'
import type { Pager } from '@/shared/lib/usePagination'
import { Listbox, SelectChevron } from './Listbox'

const SIZES = ['20', '50', '100'] as const

/** Page numbers with gaps: 1 … 4 5 6 … 12. */
function numbersFor(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const near = [page - 1, page, page + 1].filter((n) => n > 1 && n < pages)
  return [
    1,
    ...(near[0] > 2 ? [null] : []),
    ...near,
    ...(near.at(-1)! < pages - 1 ? [null] : []),
    pages,
  ]
}

/**
 * The bar under a long table: which rows are shown out of how many, rows per page, and the
 * pages. It hides itself when everything fits on one page of 20.
 */
export function Pagination({ pager }: { pager: Pager }) {
  const { t } = useI18n()
  const { page, size, total, setPage, setSize } = pager
  if (total <= 20 && size === 20) return null
  const pages = Math.max(1, Math.ceil(total / size))
  const from = total ? (page - 1) * size + 1 : 0
  const to = Math.min(total, page * size)
  const arrow =
    'grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <nav
      aria-label={t('pagination.label')}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3"
    >
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="tabular-nums">
          {t('pagination.shown', {
            from: groupDigits(from),
            to: groupDigits(to),
            total: groupDigits(total),
          })}
        </span>
        <Listbox
          options={SIZES.map((value) => ({ value, label: t('pagination.size', { size: value }) }))}
          value={String(size) as (typeof SIZES)[number]}
          onChange={(value) => setSize(Number(value))}
          ariaLabel={t('pagination.perPage')}
          fit
          up
          triggerClassName="flex h-9 items-center gap-1.5 rounded-control border border-line bg-canvas pr-2 pl-3 text-sm text-ink hover:border-navy-400"
          trigger={({ open, selected }) => (
            <>
              {selected?.label}
              <SelectChevron open={open} />
            </>
          )}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('pagination.prev')}
          title={t('pagination.prev')}
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={arrow}
        >
          <ChevronLeft size={18} />
        </button>
        {numbersFor(page, pages).map((n, i) =>
          n === null ? (
            <span key={`gap${i}`} className="w-6 text-center text-ink-subtle">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? 'page' : undefined}
              onClick={() => setPage(n)}
              className={cn(
                'h-9 min-w-9 rounded-full px-2 text-sm font-semibold tabular-nums',
                n === page ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-surface',
              )}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label={t('pagination.next')}
          title={t('pagination.next')}
          disabled={page === pages}
          onClick={() => setPage(page + 1)}
          className={arrow}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  )
}
