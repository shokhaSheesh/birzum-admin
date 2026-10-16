import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { filialsStore, useFilialsOf } from '@/entities/merchants/filials'
import { merchantsStore } from '@/entities/merchants/merchants'
import { merchantStatusTone } from '@/entities/merchants/merchantStatus'
import { MerchantLogo } from '@/entities/merchants/ui/MerchantLogo'
import { merchantEditPath, ROUTES } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatCard } from '@/shared/ui/StatCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'

/** One card of the details column: a title, then label and value rows. */
function Details({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5">
      <h2 className="font-bold">{title}</h2>
      <dl className="flex flex-col gap-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 text-sm">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="font-medium break-words tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * One merchant as the admin sees it: who it is, its figures, the filials it runs, and every
 * detail from its form. Edit opens the form; delete asks first.
 */
export function MerchantDetailPage() {
  const { t, tl } = useI18n()
  const navigate = useNavigate()
  const { id } = useParams()
  const merchant = merchantsStore.useAll().find((item) => item.id === id)
  const filials = useFilialsOf(id)
  const [deleting, setDeleting] = useState(false)

  const back = (
    <button
      type="button"
      onClick={() => navigate(ROUTES.merchants)}
      className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={18} />
      {t('nav.merchants')}
    </button>
  )

  if (!merchant) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
        {back}
        <EmptyState title={t('merchant.notFound')} />
      </div>
    )
  }

  const remove = () => {
    filials.forEach((filial) => filialsStore.remove(filial.id))
    merchantsStore.remove(merchant.id)
    toast(t('merchant.deleted'))
    navigate(ROUTES.merchants, { replace: true })
  }

  const pause = () => {
    merchantsStore.update(merchant.id, { status: 'paused' })
    setDeleting(false)
    toast(t('merchant.paused'))
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8">
      {back}

      <div className="flex flex-wrap items-center gap-5">
        <MerchantLogo merchant={merchant} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{merchant.name}</h1>
            <StatusBadge tone={merchantStatusTone[merchant.status]}>
              {t(`merchant.status.${merchant.status}`)}
            </StatusBadge>
          </div>
          <p className="text-ink-muted">
            {merchant.legal.company} · {t('merchants.inn')} {merchant.legal.inn} ·{' '}
            {t('merchant.since', { date: formatDate(merchant.createdAt) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-danger!"
            onClick={() => setDeleting(true)}
          >
            <Trash2 size={18} />
            {t('common.delete')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(merchantEditPath(merchant.id))}
          >
            <Pencil size={18} />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('merchant.filials')} value={String(filials.length)} />
        <StatCard label={t('merchants.col.products')} value={String(merchant.products)} />
        <StatCard label={t('merchants.stat.nasiya')} value={groupDigits(merchant.activeNasiya)} />
        <StatCard label={t('merchants.stat.sales')} value={formatSum(merchant.salesThisMonth)} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col rounded-card border border-line bg-canvas">
          <div className="flex flex-col gap-1 p-5">
            <h2 className="text-lg font-bold">{t('merchant.filials')}</h2>
            <p className="text-sm text-ink-muted">{t('merchant.filials.hint')}</p>
          </div>
          {filials.length === 0 ? (
            <EmptyState
              title={t('merchant.filials.empty')}
              hint={t('merchant.filials.emptyHint')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-t border-line">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>{t('merchant.filials')}</th>
                    <th className={th}>{t('filial.col.phone')}</th>
                    <th className={th}>{t('filial.col.hours')}</th>
                    <th className={th}>{t('filial.col.staff')}</th>
                    <th className={th}>{t('merchants.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filials.map((filial) => (
                    <tr key={filial.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-semibold">{tl(filial.name)}</span>
                          <span className="text-sm text-ink-muted">{tl(filial.address)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums">
                        {formatPhone(filial.phone)}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">{filial.hours}</td>
                      <td className="px-4 py-3 text-sm tabular-nums">{filial.staff}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={filial.active ? 'success' : 'neutral'}>
                          {t(filial.active ? 'filial.open' : 'filial.closed')}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <Details
            title={t('merchant.section.shop')}
            rows={[
              [t('merchant.description'), tl(merchant.description) || '—'],
              [t('merchant.phone'), formatPhone(merchant.phone)],
            ]}
          />
          <Details
            title={t('merchant.section.legal')}
            rows={[
              [t('merchant.company'), merchant.legal.company],
              [t('merchants.inn'), merchant.legal.inn],
              [t('merchant.director'), merchant.legal.director],
              [t('merchant.address'), merchant.legal.address],
            ]}
          />
          <Details
            title={t('merchant.section.bank')}
            rows={[
              [t('merchant.bank'), merchant.bank.name],
              [t('merchant.mfo'), merchant.bank.mfo],
              [t('merchant.account'), merchant.bank.account],
            ]}
          />
          <Details
            title={t('merchant.section.contract')}
            rows={[
              [t('merchant.contract'), merchant.contract.number],
              [t('merchant.contractDate'), merchant.contract.date],
              [t('merchant.schedule'), t(`merchant.schedule.${merchant.payoutSchedule}`)],
            ]}
          />
          <Details
            title={t('merchant.section.owner')}
            rows={[
              [t('merchant.owner'), merchant.owner.name],
              [t('merchant.phone'), formatPhone(merchant.owner.phone)],
              [t('login.username'), merchant.owner.login],
            ]}
          />
        </div>
      </div>

      {merchant.activeNasiya > 0 ? (
        <ConfirmDialog
          open={deleting}
          onClose={() => setDeleting(false)}
          title={t('common.cantDelete')}
          tone="primary"
          cancelLabel={merchant.status === 'paused' ? t('common.understood') : undefined}
          confirmLabel={merchant.status === 'paused' ? undefined : t('merchant.pause')}
          onConfirm={pause}
        >
          <p>
            {t('merchant.delete.blockedHint', {
              name: merchant.name,
              count: groupDigits(merchant.activeNasiya),
            })}
          </p>
          <p>
            {t(
              merchant.status === 'paused'
                ? 'merchant.delete.alreadyPaused'
                : 'merchant.delete.pauseHint',
            )}
          </p>
        </ConfirmDialog>
      ) : (
        <ConfirmDialog
          open={deleting}
          onClose={() => setDeleting(false)}
          title={t('merchant.delete.title')}
          confirmLabel={t('common.delete')}
          onConfirm={remove}
        >
          <p>{t('merchant.delete.message', { name: merchant.name })}</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
