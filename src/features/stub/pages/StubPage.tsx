import { PencilRuler } from 'lucide-react'
import type { NavItem } from '@/app/nav'
import { useI18n } from '@/shared/i18n/useI18n'
import { PageHeader } from '@/shared/ui/PageHeader'

/** Stands in for a page that is planned but not designed yet: its name and what it will hold. */
export function StubPage({ item }: { item: NavItem }) {
  const { t } = useI18n()

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t(item.label)} description={t(item.about)} />
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-canvas px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-green-200 text-brand">
          <PencilRuler size={26} />
        </span>
        <p className="text-lg font-bold">{t('stub.title')}</p>
        <p className="text-ink-muted">{t('stub.next')}</p>
      </div>
    </div>
  )
}
