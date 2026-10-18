import { useState } from 'react'

/**
 * One page of a long list. Going back to page 1 whenever `resetKey` changes (the filters), so a
 * new search never lands on an empty page.
 */
export function usePagination<T>(items: T[], resetKey: string) {
  const [state, setState] = useState({ page: 1, size: 20, key: resetKey })
  if (state.key !== resetKey) setState({ ...state, page: 1, key: resetKey })
  const pages = Math.max(1, Math.ceil(items.length / state.size))
  const page = Math.min(state.page, pages)
  return {
    rows: items.slice((page - 1) * state.size, page * state.size),
    page,
    size: state.size,
    total: items.length,
    setPage: (next: number) => setState({ ...state, page: next }),
    setSize: (size: number) => setState({ ...state, size, page: 1 }),
  }
}

export type Pager = Omit<ReturnType<typeof usePagination>, 'rows'>
