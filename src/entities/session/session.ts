import { useSyncExternalStore } from 'react'

/** The admin who is signed in. Sample person until the backend answers. */
export type Admin = { name: string; username: string; initials: string }

const KEY = 'birzum-admin.session'
const listeners = new Set<() => void>()

function read(): Admin | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Admin) : null
  } catch {
    return null
  }
}

let current = read()

function write(admin: Admin | null) {
  current = admin
  try {
    if (admin) localStorage.setItem(KEY, JSON.stringify(admin))
    else localStorage.removeItem(KEY)
  } catch {
    // Private mode: the session lasts until the tab is closed
  }
  listeners.forEach((listener) => listener())
}

export const session = {
  signIn: (admin: Admin) => write(admin),
  signOut: () => write(null),
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The signed-in admin, outside React. */
export const getAdmin = () => current

export const useAdmin = () => useSyncExternalStore(subscribe, () => current)
