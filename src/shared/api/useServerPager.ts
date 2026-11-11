import { useState } from 'react'
import type { Pager } from '@/shared/lib/usePagination'

/**
 * Paging done by the server (`page`, `limit`): back to page 1 when `resetKey` changes (the filters).
 * `pager(total)` is what the Pagination bar draws.
 */
export function useServerPager(resetKey: string) {
  const [state, setState] = useState({ page: 1, size: 20, key: resetKey })
  if (state.key !== resetKey) setState({ ...state, page: 1, key: resetKey })
  return {
    page: state.page,
    limit: state.size,
    pager: (total: number): Pager => ({
      page: state.page,
      size: state.size,
      total,
      setPage: (next) => setState({ ...state, page: next }),
      setSize: (size) => setState({ ...state, size, page: 1 }),
    }),
  }
}
