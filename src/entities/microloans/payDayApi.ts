import { apiGet, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Brand } from '@/shared/config/workspaces'
import type { PayDayRule, PayDayRules } from './rules'

type ApiRule = { from: number; to: number; up_to: number | 'appDay' }
type ApiRules = {
  mode: PayDayRules['mode']
  fixed_days: number[]
  rules: ApiRule[]
  after: number
  updated_at: string
  updated_by: { id: string; name: string } | null
}

const rulesStores = new Map<Brand, ReturnType<typeof createRemoteStore<PayDayRules>>>()

/** A brand's payment-day rule, kept as a list of one like the other stores. */
export function payDayStoreOf(brand: Brand) {
  let store = rulesStores.get(brand)
  if (!store) {
    store = createRemoteStore<PayDayRules>(async () => {
      const raw = await apiGet<ApiRules>(`/admin/apps/${brand}/pay-day`)
      return [
        {
          id: brand,
          mode: raw.mode,
          fixedDays: raw.fixed_days ?? [],
          rules: (raw.rules ?? []).map((r): PayDayRule => ({
            from: r.from,
            to: r.to,
            upTo: r.up_to,
          })),
          after: raw.after,
          updatedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
          updatedBy: raw.updated_by?.name,
        },
      ]
    })
    rulesStores.set(brand, store)
  }
  return store
}

/** The whole rule is replaced; both drafts (fixed days and lines) are kept whatever the mode. */
export async function savePayDay(brand: Brand, rules: Omit<PayDayRules, 'id'>) {
  await apiPut(`/admin/apps/${brand}/pay-day`, {
    mode: rules.mode,
    fixed_days: rules.fixedDays,
    rules: rules.rules.map((r) => ({ from: r.from, to: r.to, up_to: r.upTo })),
    after: rules.after,
  })
  await payDayStoreOf(brand).reload()
  await payDayHistoryStoreOf(brand).reload()
}

export type PayDayRevision = {
  id: string
  at: Date
  by: string
  changes: { field: 'mode' | 'fixed_days' | 'rules' | 'after'; from: unknown; to: unknown }[]
}

const historyStores = new Map<Brand, ReturnType<typeof createRemoteStore<PayDayRevision>>>()

/** The last 100 saves, newest first. */
export function payDayHistoryStoreOf(brand: Brand) {
  let store = historyStores.get(brand)
  if (!store) {
    store = createRemoteStore<PayDayRevision>(async () => {
      const data = await apiGet<{
        items: {
          id: string
          at: string
          by: { name: string } | null
          changes: PayDayRevision['changes']
        }[]
      }>(`/admin/apps/${brand}/pay-day/history`)
      return data.items.map((item) => ({
        id: item.id,
        at: new Date(item.at),
        by: item.by?.name ?? '—',
        changes: item.changes,
      }))
    })
    historyStores.set(brand, store)
  }
  return store
}
