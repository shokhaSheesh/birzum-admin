import { useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { startOfDay } from '@/shared/lib/dates'
import { boundsOf, type Period } from '@/shared/lib/period'
import { ExportMenu } from '@/shared/ui/ExportMenu'
import { PageHeader } from '@/shared/ui/PageHeader'
import { PeriodFilter } from '@/shared/ui/PeriodFilter'
import { PlanFact } from '../components/PlanFact'

/**
 * Plan / fakt by nasiya and month, on its own page. Opens on all time (from the first hand-over to
 * this month); every row is on the page, no pagination (user, 2026-11-19).
 */
export function PlanFactPage() {
  const { t } = useI18n()
  const [today] = useState(() => new Date())
  const [period, setPeriod] = useState<Period>(() => ({
    unit: 'all',
    anchor: startOfDay(new Date()),
    range: { from: null, to: null },
  }))

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.planFact')}
        actions={<ExportMenu section="planFact" period={period} />}
      />
      <PeriodFilter value={period} onChange={setPeriod} />
      <section className="flex flex-col rounded-card border border-line bg-canvas">
        <PlanFact bounds={boundsOf(period)} today={today} />
      </section>
    </div>
  )
}
