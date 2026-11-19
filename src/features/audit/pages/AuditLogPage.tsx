import { useState } from 'react'
import type { Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { thisMonth, type Period } from '@/shared/lib/period'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { UnderlineTabs } from '@/shared/ui/UnderlineTabs'
import { AdminActionsLog } from '../components/AdminActionsLog'
import { EventsLog } from '../components/EventsLog'

type Tab = 'events' | 'admin'

/**
 * The full log of one workspace (Birzum, Fortuna or Vodiy): every step in its apps and
 * integrations (sign-up, MyID, cards, scoring, arizalar, payouts, payments, support), and every
 * admin action on its pages. Nothing in it can be changed or deleted.
 */
export function AuditLogPage({ workspace = 'birzum' }: { workspace?: Workspace }) {
  const { t } = useI18n()
  const [period, setPeriod] = useState<Period>(() => thisMonth(new Date()))
  const [tab, setTab] = useState<Tab>('events')

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.audit')} />
      <PeriodFilter value={period} onChange={setPeriod} />

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        <div className="px-4 pt-2">
          <UnderlineTabs
            label={t('nav.audit')}
            options={[
              { value: 'events', label: t('events.tab.events') },
              { value: 'admin', label: t('events.tab.admin') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        {tab === 'events' ? (
          <EventsLog workspace={workspace} period={period} />
        ) : (
          <AdminActionsLog workspace={workspace} period={period} />
        )}
      </div>
    </div>
  )
}
