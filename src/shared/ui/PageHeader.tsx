import type { ReactNode } from 'react'
import { isDemo } from '@/shared/api/demo'
import { useI18n } from '@/shared/i18n/useI18n'

type Props = {
  title: string
  /** Buttons at the right, e.g. "+ Qoʻshish". */
  actions?: ReactNode
}

/**
 * The top of every admin page: the title and the page's actions on the right. No subtitle (user).
 * In the sample panel every page wears a small "Namuna maʼlumot" badge.
 */
export function PageHeader({ title, actions }: Props) {
  const { t } = useI18n()
  const sample = isDemo()
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <h1 className="min-w-0 text-2xl font-bold text-balance">{title}</h1>
        {sample && (
          <span
            title={t('api.sample.title')}
            className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning"
          >
            {t('api.sample')}
          </span>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
