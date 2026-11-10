import { WORKSPACES, type Workspace } from '@/shared/config/workspaces'

/** `blocked`: cannot sign in; what they did stays in the history. */
export type AdminStatus = 'active' | 'blocked'

/** The role an admin has in one business. */
export type Grant = { workspace: Workspace; roleId: string }

/**
 * A person who signs in to this panel. They work in one or more businesses (Birzum, Fortuna,
 * Vodiy), with a role in each; what they may do there comes from that role.
 */
export type AdminUser = {
  id: string
  name: string
  login: string
  /** Where the code for a forgotten password goes. */
  email: string
  /** Nine digits after +998. */
  phone: string
  grants: Grant[]
  status: AdminStatus
  /** Holds the Bosh admin role in Birzum. */
  isOwner: boolean
  createdAt: Date
  lastSeenAt?: Date
}

/** The admin's role in a business, if they work there. */
export const roleIn = (admin: Pick<AdminUser, 'grants'>, workspace: Workspace) =>
  admin.grants.find((grant) => grant.workspace === workspace)?.roleId

/** Grants in the order of the workspace switcher. */
export const sortGrants = (grants: Grant[]) =>
  [...grants].sort((a, b) => WORKSPACES.indexOf(a.workspace) - WORKSPACES.indexOf(b.workspace))

export const initialsOfName = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()

/** A strong password to suggest, e.g. "Bz4821-kqmt": letters and digits, 11 characters. */
export function suggestPassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyz'
  const pick = () => letters[Math.floor(Math.random() * letters.length)]
  return `Bz${Math.floor(1000 + Math.random() * 9000)}-${pick()}${pick()}${pick()}${pick()}`
}

/** At least 8 characters with both letters and digits. */
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export const strongEnough = (password: string) =>
  password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)
