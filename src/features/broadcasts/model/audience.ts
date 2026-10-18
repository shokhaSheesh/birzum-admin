import { useState } from 'react'
import { applicationsStore } from '@/entities/applications/applications'
import type { Audience, ClientSegment } from '@/entities/broadcasts/broadcasts'
import { clientsStore } from '@/entities/clients/clients'
import { clientStatusOf, debtOf } from '@/entities/clients/debt'
import { paymentsStore } from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'

/**
 * How many people each audience reaches today: shoppers by their nasiyalar, merchants by
 * the ones picked (none picked: all of them, paused ones left out).
 */
export function useAudience() {
  const clients = clientsStore.useAll()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const merchants = merchantsStore.useAll()
  const [today] = useState(() => new Date())

  const statuses = clients.map((client) =>
    clientStatusOf(client, debtOf(client, applications, payments, today)),
  )
  const segments: Record<ClientSegment, number> = {
    all: clients.length,
    running: statuses.filter((s) => s === 'running' || s === 'overdue').length,
    overdue: statuses.filter((s) => s === 'overdue').length,
    idle: statuses.filter((s) => s === 'idle').length,
    limitExpired: clients.filter((c) => c.limit && c.limit.validUntil < today).length,
  }
  const reachable = merchants.filter((merchant) => merchant.status !== 'paused')
  const countOf = (audience: Audience) =>
    audience.kind === 'clients'
      ? segments[audience.segment]
      : audience.merchantIds.length || reachable.length

  return { segments, merchants: reachable, countOf }
}
