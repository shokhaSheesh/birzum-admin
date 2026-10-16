import { useSyncExternalStore } from 'react'

/**
 * A small in-memory list of records that components can subscribe to. It stands in for
 * the backend: a page refresh resets it to the seed.
 */
export function createStore<T extends { id: string }>(seed: T[]) {
  let items = seed
  const listeners = new Set<() => void>()
  const change = (next: T[]) => {
    items = next
    listeners.forEach((listener) => listener())
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    useAll: () => useSyncExternalStore(subscribe, () => items),
    getAll: () => items,
    get: (id: string | undefined) => items.find((item) => item.id === id),
    update: (id: string, patch: Partial<T>) =>
      change(items.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    remove: (id: string) => change(items.filter((item) => item.id !== id)),
    /** Adds the record, or replaces the one with the same id. */
    save: (record: T) =>
      change(
        items.some((item) => item.id === record.id)
          ? items.map((item) => (item.id === record.id ? record : item))
          : [record, ...items],
      ),
  }
}

export const newId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`
