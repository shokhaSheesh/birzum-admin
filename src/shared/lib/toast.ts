import { useSyncExternalStore } from 'react'

export type Toast = { id: number; message: string; tone: 'success' | 'error' }

// Every message shows until its own time runs out; new ones go under the earlier ones.
const LIFETIME_MS = 3200
/** More than this and the oldest goes at once. */
const MAX = 4
let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

export function dismissToast(id: number) {
  toasts = toasts.filter((item) => item.id !== id)
  emit()
}

/** Shows a short confirmation at the top right, e.g. "Saqlandi". It goes away by itself. */
export function toast(message: string, tone: Toast['tone'] = 'success') {
  const id = nextId++
  toasts = [...toasts, { id, message, tone }].slice(-MAX)
  emit()
  setTimeout(() => dismissToast(id), LIFETIME_MS)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useToasts = () => useSyncExternalStore(subscribe, () => toasts)
