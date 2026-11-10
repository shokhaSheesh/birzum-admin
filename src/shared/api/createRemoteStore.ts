import { useEffect, useSyncExternalStore } from 'react'
import { toastError } from './errors'

/**
 * A list that lives on the backend: read with `load` the first time a page uses it, and again on
 * `reload()` (after a save, or when a failed call left the screen out of date). It has the shape of
 * `createStore` for reading, so pages keep their `useAll()`/`get()` lines; changes go through the
 * entity's own save and delete calls, which end with `reload()`.
 */
export function createRemoteStore<T extends { id: string }>(load: () => Promise<T[]>) {
  let items: T[] = []
  let status = { loading: false, loaded: false }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  let inflight: Promise<void> | null = null
  let loadedAt = 0
  const reload = () => {
    inflight ??= (async () => {
      status = { ...status, loading: true }
      emit()
      try {
        items = await load()
      } catch (e) {
        toastError(e)
      } finally {
        status = { loading: false, loaded: true }
        loadedAt = Date.now()
        inflight = null
        emit()
      }
    })()
    return inflight
  }

  return {
    /** Loads on first use; opening the page again shows the list at once and reads it anew. */
    useAll: () => {
      useEffect(() => {
        // Several parts of one page use the same list: read it once, not once each
        if (Date.now() - loadedAt > 2000) void reload()
      }, [])
      return useSyncExternalStore(subscribe, () => items)
    },
    /** True until the first answer arrives. */
    useLoading: () => useSyncExternalStore(subscribe, () => status).loading && !status.loaded,
    getAll: () => items,
    get: (id: string | undefined) => items.find((item) => item.id === id),
    reload,
    /** Shows a new order at once while the backend call is on its way. */
    setLocal: (next: T[]) => {
      items = next
      emit()
    },
    /** Forgets the list (sign-out), so the next admin does not see the previous one's. */
    clear: () => {
      items = []
      status = { loading: false, loaded: false }
      loadedAt = 0
      emit()
    },
  }
}

/** Runs a save or delete: success calls `done`, a failure shows the server's message and returns false. */
export async function attempt(call: () => Promise<unknown>, done?: () => void) {
  try {
    await call()
    done?.()
    return true
  } catch (e) {
    toastError(e)
    return false
  }
}
