import { Link } from 'react-router-dom'
import { WIRED_PAGES } from '@/shared/api/wired'
import { useI18n } from '@/shared/i18n/useI18n'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const BRANDS = ['fortuna', 'vodiy'] as const

/** Which pages of this preview talk to the staging backend; every other page shows sample data. */
export function ApiStatusPage() {
  const { t } = useI18n()
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader title={t('nav.apiStatus')} />
      <p className="text-sm text-ink-muted">{t('apiStatus.intro')}</p>
      <div className="overflow-x-auto rounded-card border border-line bg-canvas">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>{t('apiStatus.page')}</th>
              <th className={th}>{t('apiStatus.business')}</th>
              <th className={th}>{t('merchants.status')}</th>
              <th className={th}>{t('apiStatus.endpoints')}</th>
              <th className={th}>{t('apiStatus.doc')}</th>
            </tr>
          </thead>
          <tbody>
            {WIRED_PAGES.map((page) => (
              <tr
                key={`${page.scope}${page.path}`}
                className="border-b border-line last:border-b-0"
              >
                <td className="px-4 py-3 text-sm font-semibold">
                  <Link
                    to={page.scope === 'ml' ? `/${BRANDS[0]}${page.path}` : page.path}
                    className="text-brand hover:underline"
                  >
                    {t(page.label)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">
                  {page.scope === 'ml' ? 'Fortuna, Vodiy' : 'Birzum'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone="success">{t('apiStatus.wired')}</StatusBadge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{page.endpoints}</td>
                <td className="px-4 py-3 text-sm tabular-nums">§{page.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-ink-muted">{t('apiStatus.sample')}</p>
    </div>
  )
}
