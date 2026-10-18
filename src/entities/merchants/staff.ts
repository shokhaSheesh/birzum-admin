import { createStore } from '@/shared/lib/createStore'
import { merchantsStore } from './merchants'

/**
 * The people who sign in to a merchant's app. The roles are the merchant app's three:
 * Egasi (everything), Menejer (its filials and staff) and Sotuvchi (clients and arizalar).
 */
export const STAFF_ROLES = ['owner', 'manager', 'seller'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]
export type StaffStatus = 'active' | 'blocked'

export type MerchantUser = {
  id: string
  merchantId: string
  name: string
  /** Nine digits after +998. */
  phone: string
  login: string
  role: StaffRole
  /** The filials they work in; empty means all of them. */
  filialIds: string[]
  status: StaffStatus
  createdAt: Date
  lastSeenAt?: Date
}

type Seed = [
  merchantId: string,
  name: string,
  phone: string,
  login: string,
  role: StaffRole,
  filials: string[],
  blocked?: boolean,
]

// Invented sample staff; each owner comes from the merchant's form. Replace with the API.
const SEEDS: Seed[] = [
  ['m1', 'Laylo Sobirova', '935004411', 'laylo.s', 'manager', ['f1']],
  ['m1', 'Rustam Olimov', '977203090', 'rustam.o', 'seller', ['f1']],
  ['m1', 'Madina Sobirova', '901458899', 'madina.s', 'seller', ['f2']],
  ['m1', 'Sherzod Umarov', '939117722', 'sherzod.u', 'seller', ['f2', 'f3']],
  ['m1', 'Dilfuza Rahimova', '998804411', 'dilfuza.r', 'seller', ['f3'], true],
  ['m2', 'Timur Ahmedov', '946617788', 'timur.a', 'manager', ['f4', 'f5']],
  ['m2', 'Kamola Ergasheva', '903325566', 'kamola.e', 'seller', ['f5']],
  ['m3', 'Javohir Tursunov', '915550909', 'javohir.t', 'seller', ['f6']],
  ['m4', 'Oybek Nazarov', '977441100', 'oybek.n', 'seller', ['f7', 'f8'], true],
]

function seed(): MerchantUser[] {
  const now = new Date(2026, 9, 16, 15)
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000)
  const owners = merchantsStore.getAll().map((merchant, i): MerchantUser => ({
    id: `${merchant.id}-owner`,
    merchantId: merchant.id,
    ...merchant.owner,
    role: 'owner',
    filialIds: [],
    status: 'active',
    createdAt: merchant.createdAt,
    lastSeenAt: merchant.status === 'onboarding' ? undefined : hoursAgo(2 + i * 7),
  }))
  const staff = SEEDS.map(
    ([merchantId, name, phone, login, role, filialIds, blocked], i): MerchantUser => ({
      id: `s${i + 1}`,
      merchantId,
      name,
      phone,
      login,
      role,
      filialIds,
      status: blocked ? 'blocked' : 'active',
      createdAt: new Date(2026, 6, 3 + i * 5),
      lastSeenAt: hoursAgo(1 + i * 11),
    }),
  )
  return [...owners, ...staff]
}

export const staffStore = createStore<MerchantUser>(seed())

/** The staff who work in a filial: those placed there and those with every filial. */
export const staffOfFilial = (all: MerchantUser[], merchantId: string, filialId: string) =>
  all.filter(
    (user) =>
      user.merchantId === merchantId &&
      (user.filialIds.length === 0 || user.filialIds.includes(filialId)),
  )
