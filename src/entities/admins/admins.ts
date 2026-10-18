import { createStore } from '@/shared/lib/createStore'

/** `invited`: created, has not signed in with the temporary password yet. */
export type AdminStatus = 'active' | 'invited' | 'blocked'

/** A person who signs in to this panel. What they may do comes from their role. */
export type AdminUser = {
  id: string
  name: string
  login: string
  /** Nine digits after +998. */
  phone: string
  roleId: string
  status: AdminStatus
  createdAt: Date
  lastSeenAt?: Date
}

export const initialsOfName = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()

/** A readable temporary password, e.g. "Bz-4821-kq". The admin changes it at first sign-in. */
export function tempPassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyz'
  const pick = () => letters[Math.floor(Math.random() * letters.length)]
  return `Bz-${Math.floor(1000 + Math.random() * 9000)}-${pick()}${pick()}`
}

const at = (month: number, day: number, hour = 10, minute = 0) =>
  new Date(2026, month, day, hour, minute)

// The panel's people today. Replace with the API.
export const adminsStore = createStore<AdminUser>([
  {
    id: 'a1',
    name: 'Sardor Saidov',
    login: 'admin',
    phone: '901112233',
    roleId: 'owner',
    status: 'active',
    createdAt: at(6, 1),
    lastSeenAt: at(9, 18, 9, 5),
  },
  {
    id: 'a2',
    name: 'Malika Rasulova',
    login: 'malika.r',
    phone: '935554411',
    roleId: 'finance',
    status: 'active',
    createdAt: at(6, 15),
    lastSeenAt: at(9, 18, 8, 40),
  },
  {
    id: 'a3',
    name: 'Sardor Nematov',
    login: 'sardor.n',
    phone: '977003322',
    roleId: 'support',
    status: 'active',
    createdAt: at(7, 3),
    lastSeenAt: at(9, 17, 19, 12),
  },
  {
    id: 'a4',
    name: 'Dilshod Karimov',
    login: 'dilshod.k',
    phone: '909990011',
    roleId: 'collections',
    status: 'active',
    createdAt: at(8, 10),
    lastSeenAt: at(9, 16, 17, 30),
  },
  {
    id: 'a5',
    name: 'Nodira Aliyeva',
    login: 'nodira.a',
    phone: '933217788',
    roleId: 'content',
    status: 'active',
    createdAt: at(8, 20),
    lastSeenAt: at(9, 14, 11, 0),
  },
  {
    id: 'a6',
    name: 'Bobur Tursunov',
    login: 'bobur.t',
    phone: '946541230',
    roleId: 'support',
    status: 'invited',
    createdAt: at(9, 17, 15),
  },
  {
    id: 'a7',
    name: 'Jamshid Olimov',
    login: 'jamshid.o',
    phone: '901237654',
    roleId: 'collections',
    status: 'blocked',
    createdAt: at(7, 12),
    lastSeenAt: at(8, 30, 18, 0),
  },
])
