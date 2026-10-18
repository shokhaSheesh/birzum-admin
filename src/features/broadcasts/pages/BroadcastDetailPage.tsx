import { ArrowLeft, Ban, Copy, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { broadcastsStore } from '@/entities/broadcasts/broadcasts'
import { categoriesStore } from '@/entities/catalog/categories'
import { merchantsStore } from '@/entities/merchants/merchants'
import { broadcastEditPath, ROUTES } from '@/shared/config/routes'
import { LANGS, type Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDateTime, groupDigits } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useAudienceText } from '../model/useAudienceText'
import { BroadcastActions } from '../components/BroadcastActions'
import { useBroadcastActions } from '../model/useBroadcastActions'
import { broadcastStatusTone } from '../components/broadcastLabels'
import { PhonePreview } from '../components/PhonePreview'
import { useAudience } from '../model/audience'

const card = 'flex flex-col gap-4 rounded-card border border-line bg-canvas p-5'

/**
 * One broadcast: how it did (sent, delivered, opened, tapped), its text in both languages,
 * who it went to and when, and the phone as people saw it.
 */
export function BroadcastDetailPage() {
  const { t, tl, lang: appLang } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const broadcast = broadcastsStore.useAll().find((item) => item.id === id)
  const categories = categoriesStore.useAll()
  const merchants = merchantsStore.useAll()
  const audienceText = useAudienceText()
  const { countOf } = useAudience()
  const actions = useBroadcastActions()
  const [previewLang, setPreviewLang] = useState<Lang>(appLang)

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.broadcasts)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.broadcasts')}
    </button>
  )
  if (!broadcast)
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('broadcast.notFound')} />
      </div>
    )

  const stats = broadcast.stats
  const funnel = stats
    ? ([
        ['recipients', stats.recipients],
        ['delivered', stats.delivered],
        ['opened', stats.opened],
        ['tapped', stats.tapped],
      ] as const)
    : []
  const link = broadcast.link
  const linkText =
    link.kind === 'category'
      ? `${t('broadcast.link.category')}: ${tl(categories.find((c) => c.id === link.id)?.name ?? { uz: link.id, ru: link.id })}`
      : link.kind === 'merchant'
        ? `${t('broadcast.link.merchant')}: ${merchants.find((m) => m.id === link.id)?.name ?? link.id}`
        : t('broadcast.link.none')
  const editable = broadcast.status === 'draft' || broadcast.status === 'scheduled'

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      {back}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{tl(broadcast.title)}</h1>
            <StatusBadge tone={broadcastStatusTone[broadcast.status]}>
              {t(`broadcast.status.${broadcast.status}`)}
            </StatusBadge>
          </div>
          <p className="text-ink-muted">
            {broadcast.sendAt
              ? t(broadcast.status === 'sent' ? 'broadcast.sentAt' : 'broadcast.sendsAt', {
                  date: formatDateTime(broadcast.sendAt),
                })
              : t('broadcast.notSent')}{' '}
            · {broadcast.createdBy}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => actions.copy(broadcast)}>
            <Copy size={18} />
            {t('broadcast.copy')}
          </Button>
          {editable && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(broadcastEditPath(broadcast.id))}
            >
              <Pencil size={18} />
              {t('common.edit')}
            </Button>
          )}
          {broadcast.status === 'scheduled' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger!"
              onClick={() => actions.askCancel(broadcast)}
            >
              <Ban size={18} />
              {t('broadcast.cancel')}
            </Button>
          )}
          {(broadcast.status === 'draft' || broadcast.status === 'cancelled') && (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger!"
              onClick={() => actions.askDelete(broadcast)}
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="text-lg font-bold">{t('broadcast.results')}</h2>
            {!stats ? (
              <p className="text-sm text-ink-muted">
                {t(
                  broadcast.status === 'scheduled'
                    ? 'broadcast.results.later'
                    : 'broadcast.results.none',
                  {
                    count: groupDigits(countOf(broadcast.audience)),
                  },
                )}
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {funnel.map(([key, value], i) => {
                  const share = stats.recipients ? (value / stats.recipients) * 100 : 0
                  return (
                    <li key={key} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{t(`broadcast.stat.${key}`)}</span>
                        <span className="tabular-nums">
                          <span className="font-semibold">{groupDigits(value)}</span>
                          {i > 0 && (
                            <span className="ml-1.5 text-ink-subtle">{Math.round(share)}%</span>
                          )}
                        </span>
                      </div>
                      <div className="h-7 rounded-control bg-surface">
                        <div
                          className="h-full rounded-control bg-brand"
                          style={{
                            width: `${Math.max(value ? 2 : 0, share)}%`,
                            opacity: 1 - i * 0.2,
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            {stats && broadcast.sms && (
              <p className="text-xs text-ink-subtle">{t('broadcast.results.sms')}</p>
            )}
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">{t('broadcast.content')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {LANGS.map((value) => (
                <div key={value} className="flex flex-col gap-1.5 rounded-control bg-surface p-4">
                  <span className="text-xs font-bold text-ink-muted uppercase">{value}</span>
                  <p className="font-semibold">{broadcast.title[value]}</p>
                  <p className="text-sm whitespace-pre-line text-ink-muted">
                    {broadcast.body[value]}
                  </p>
                </div>
              ))}
            </div>
            <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-sm">
              {(
                [
                  [t('broadcast.audience'), audienceText(broadcast.audience)],
                  [t('broadcast.channels'), broadcast.sms ? 'Push + SMS' : 'Push'],
                  ...(broadcast.audience.kind === 'clients'
                    ? [[t('broadcast.link'), linkText] as const]
                    : []),
                  [
                    t('broadcast.createdAt'),
                    `${formatDateTime(broadcast.createdAt)} · ${broadcast.createdBy}`,
                  ],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <p className="font-bold">{t('broadcast.preview')}</p>
            <div className="flex gap-0.5 rounded-full bg-surface p-0.5">
              {LANGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreviewLang(value)}
                  aria-pressed={previewLang === value}
                  className={cn(
                    'h-7 rounded-full px-3 text-xs font-bold uppercase',
                    previewLang === value ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <PhonePreview
            lang={previewLang}
            title={broadcast.title}
            body={broadcast.body}
            image={broadcast.image}
            sms={broadcast.sms}
            appName={broadcast.audience.kind === 'clients' ? 'Birzum' : 'Birzum Biznes'}
            linkLabel={
              link.kind === 'none'
                ? undefined
                : t(
                    link.kind === 'category'
                      ? 'broadcast.link.openCategory'
                      : 'broadcast.link.openMerchant',
                  )
            }
          />
        </aside>
      </div>

      <BroadcastActions {...actions} stay={false} />
    </div>
  )
}
