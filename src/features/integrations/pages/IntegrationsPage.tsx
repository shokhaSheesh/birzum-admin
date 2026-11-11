import { Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/client'
import { attempt } from '@/shared/api/createRemoteStore'
import { useResource } from '@/shared/api/useResource'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { RowActions } from '@/shared/ui/RowActions'
import { SegmentedTabs } from '@/shared/ui/SegmentedTabs'
import { SelectField } from '@/shared/ui/SelectField'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'
import { Switch } from '@/shared/ui/Switch'
import { TextField } from '@/shared/ui/TextField'

const KINDS = ['suggest', 'geocoder', 'mapkit'] as const
type Kind = (typeof KINDS)[number]

type GeoKey = {
  id: string
  kind: Kind
  label: string
  masked: string
  active: boolean
  status: 'available' | 'exhausted' | 'off'
  exhausted_until: string
  exhausted_count: number
  last_exhausted_at: string
}

const th = 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase'
const tone: Record<GeoKey['status'], StatusTone> = {
  available: 'success',
  exhausted: 'warning',
  off: 'neutral',
}

/**
 * Yandex Maps key pools (`/admin/settings/geo/keys`): several keys per kind, the app takes the one
 * that works and moves on when its limit runs out. A key is never shown whole, and is not edited:
 * delete it and add another.
 */
export function IntegrationsPage() {
  const { t } = useI18n()
  const [kind, setKind] = useState<Kind>('suggest')
  const keys = useResource(() => apiGet<{ items: GeoKey[] }>('/admin/settings/geo/keys'), 'keys')
  const rows = (keys.data?.items ?? []).filter((item) => item.kind === kind)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<GeoKey | null>(null)

  const save = (key: GeoKey, patch: { active?: boolean; clear?: boolean }) =>
    attempt(
      () =>
        apiPut(`/admin/settings/geo/keys/${key.id}`, {
          label: key.label,
          active: patch.active ?? key.active,
          clear_exhausted: patch.clear ?? false,
        }),
      () => {
        toast(t('toast.saved'))
        keys.reload()
      },
    )
  const check = (key: GeoKey) =>
    attempt(async () => {
      const data = await apiGet<{ result: string }>(`/admin/settings/geo/keys/${key.id}/check`)
      toast(
        t(`geo.check.${data.result}` as 'geo.check.ok'),
        data.result === 'ok' ? 'success' : 'error',
      )
    })

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeader
        title={t('nav.integrations')}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={20} />
            {t('geo.add')}
          </Button>
        }
      />
      <div className="max-w-xl">
        <SegmentedTabs
          label={t('geo.kind')}
          options={KINDS.map((value) => ({ value, label: t(`geo.kind.${value}`) }))}
          value={kind}
          onChange={setKind}
        />
      </div>
      <p className="text-sm text-ink-muted">{t(`geo.kind.${kind}.hint`)}</p>

      <div className="flex flex-col rounded-card border border-line bg-canvas">
        {keys.loading && !keys.data ? (
          <EmptyState title={t('common.loading')} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('geo.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t('geo.label')}</th>
                  <th className={th}>{t('geo.key')}</th>
                  <th className={th}>{t('merchants.status')}</th>
                  <th className={th}>{t('geo.on')}</th>
                  <th className="w-36" />
                </tr>
              </thead>
              <tbody>
                {rows.map((key) => (
                  <tr key={key.id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{key.label || '—'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{key.masked}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge tone={tone[key.status]}>
                          {t(`geo.status.${key.status}`)}
                        </StatusBadge>
                        {key.status === 'exhausted' && key.exhausted_until && (
                          <span className="text-xs text-ink-muted">
                            {t('geo.until', {
                              date: formatDateTime(new Date(key.exhausted_until)),
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={key.active}
                        onChange={(active) => void save(key, { active })}
                        label={t('geo.on')}
                      />
                    </td>
                    <td className="pr-3">
                      <RowActions
                        actions={[
                          ...(key.status === 'exhausted'
                            ? [
                                {
                                  icon: RotateCcw,
                                  label: t('geo.clear'),
                                  onClick: () => void save(key, { clear: true }),
                                },
                              ]
                            : []),
                          {
                            icon: ShieldCheck,
                            label: t('geo.check'),
                            onClick: () => void check(key),
                          },
                          {
                            icon: Trash2,
                            label: t('common.delete'),
                            onClick: () => setDeleting(key),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && (
        <AddKeyModal
          kind={kind}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            keys.reload()
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('geo.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (deleting)
            await attempt(
              () => apiDelete(`/admin/settings/geo/keys/${deleting.id}`),
              () => {
                toast(t('geo.deleted'))
                keys.reload()
              },
            )
          setDeleting(null)
        }}
      >
        <p>{t('geo.delete.message', { key: deleting?.masked ?? '' })}</p>
      </ConfirmDialog>
    </div>
  )
}

function AddKeyModal({
  kind: initial,
  onClose,
  onSaved,
}: {
  kind: Kind
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [kind, setKind] = useState<Kind>(initial)
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const keyError = !/^[A-Za-z0-9_-]{8,128}$/.test(key.trim()) ? t('geo.error.key') : undefined

  const save = async () => {
    setSubmitted(true)
    if (keyError || label.length > 100) return
    setSaving(true)
    const ok = await attempt(
      () => apiPost('/admin/settings/geo/keys', { kind, key: key.trim(), label: label.trim() }),
      () => toast(t('geo.added')),
    )
    setSaving(false)
    if (ok) onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('nav.integrations')}
      title={t('geo.add')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" loading={saving} onClick={() => void save()}>
            {t('common.add')}
          </Button>
        </>
      }
    >
      <SelectField
        label={t('geo.kind')}
        options={KINDS.map((value) => ({ value, label: t(`geo.kind.${value}`) }))}
        value={kind}
        onChange={setKind}
      />
      <TextField
        label={t('geo.key')}
        autoComplete="off"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        hint={t('geo.key.hint')}
        error={submitted ? keyError : undefined}
      />
      <TextField
        label={t('geo.label')}
        placeholder="Asosiy"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={100}
      />
    </Modal>
  )
}
