import { WORKSPACES, type Workspace } from '@/shared/config/workspaces'
import { createStore } from '@/shared/lib/createStore'

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
  /** Nine digits after +998. */
  phone: string
  grants: Grant[]
  status: AdminStatus
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
export const strongEnough = (password: string) =>
  password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)

const at = (month: number, day: number, hour = 10, minute = 0) =>
  new Date(2026, month, day, hour, minute)

// The panel's people today. Replace with the API.
export const adminsStore = createStore<AdminUser>([
  {
    id: 'a1',
    name: 'Sardor Saidov',
    login: 'admin',
    phone: '901112233',
    grants: [
      { workspace: 'birzum', roleId: 'owner' },
      { workspace: 'fortuna', roleId: 'owner' },
      { workspace: 'vodiy', roleId: 'owner' },
    ],
    status: 'active',
    createdAt: at(6, 1),
    lastSeenAt: at(9, 18, 9, 5),
  },
  {
    id: 'a2',
    name: 'Malika Rasulova',
    login: 'malika.r',
    phone: '935554411',
    grants: [{ workspace: 'birzum', roleId: 'finance' }],
    status: 'active',
    createdAt: at(6, 15),
    lastSeenAt: at(9, 18, 8, 40),
  },
  {
    id: 'a3',
    name: 'Sardor Nematov',
    login: 'sardor.n',
    phone: '977003322',
    grants: [
      { workspace: 'birzum', roleId: 'support' },
      { workspace: 'fortuna', roleId: 'support' },
      { workspace: 'vodiy', roleId: 'support' },
    ],
    status: 'active',
    createdAt: at(7, 3),
    lastSeenAt: at(9, 17, 19, 12),
  },
  {
    id: 'a4',
    name: 'Dilshod Karimov',
    login: 'dilshod.k',
    phone: '909990011',
    grants: [{ workspace: 'birzum', roleId: 'collections' }],
    status: 'active',
    createdAt: at(8, 10),
    lastSeenAt: at(9, 16, 17, 30),
  },
  {
    id: 'a5',
    name: 'Nodira Aliyeva',
    login: 'nodira.a',
    phone: '933217788',
    grants: [{ workspace: 'birzum', roleId: 'content' }],
    status: 'active',
    createdAt: at(8, 20),
    lastSeenAt: at(9, 14, 11, 0),
  },
  {
    id: 'a6',
    name: 'Bobur Tursunov',
    login: 'bobur.t',
    phone: '946541230',
    grants: [{ workspace: 'fortuna', roleId: 'support' }],
    status: 'active',
    createdAt: at(9, 17, 15),
  },
  {
    id: 'a7',
    name: 'Jamshid Olimov',
    login: 'jamshid.o',
    phone: '901237654',
    grants: [{ workspace: 'birzum', roleId: 'collections' }],
    status: 'blocked',
    createdAt: at(7, 12),
    lastSeenAt: at(8, 30, 18, 0),
  },
  {
    id: 'a8',
    name: 'Gulnoza Ergasheva',
    login: 'gulnoza.e',
    phone: '915553040',
    grants: [
      { workspace: 'fortuna', roleId: 'credit' },
      { workspace: 'vodiy', roleId: 'credit' },
    ],
    status: 'active',
    createdAt: at(9, 5),
    lastSeenAt: at(9, 18, 10, 20),
  },
  {
    id: 'a9',
    name: 'Azizbek Qodirov',
    login: 'azizbek.q',
    phone: '998887766',
    grants: [{ workspace: 'vodiy', roleId: 'loanManager' }],
    status: 'active',
    createdAt: at(9, 8),
    lastSeenAt: at(9, 17, 16, 45),
  },
  {
    id: 'a10',
    name: 'Shahzod Yoqubov',
    login: 'shahzod.y',
    phone: '935001020',
    grants: [
      { workspace: 'fortuna', roleId: 'loanCollector' },
      { workspace: 'vodiy', roleId: 'loanCollector' },
    ],
    status: 'active',
    createdAt: at(9, 10),
    lastSeenAt: at(9, 18, 11, 5),
  },
])
