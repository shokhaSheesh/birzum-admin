import { useSyncExternalStore } from 'react'

export type Toast = { id: number; message: string; tone: 'success' | 'error' }

// One message at a time: a new one replaces the old.
let current: Toast | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

/** Shows a short confirmation at the top of the screen, e.g. "Saqlandi". It goes away by itself. */
export function toast(message: string, tone: Toast['tone'] = 'success') {
  current = { id: Date.now(), message, tone }
  emit()
  clearTimeout(timer)
  timer = setTimeout(() => {
    current = null
    emit()
  }, 2400)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useToast = () => useSyncExternalStore(subscribe, () => current)
