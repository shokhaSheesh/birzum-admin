import { CircleAlert, CircleCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import {
  approveProduct,
  rejectProduct,
  type ModProductDetail,
} from '@/entities/catalog/moderationApi'
import { MODERATION_REASONS, type ModerationReason } from '@/entities/catalog/products'
import { attempt } from '@/shared/api/createRemoteStore'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'

const card = 'flex flex-col gap-3 rounded-card border border-line bg-canvas p-5'

/**
 * Where the product stands with the admin. A new one waits here: approve it and the merchant
 * can fill in its stock, or turn it down with a reason the merchant reads. `onChanged` reads the
 * product again.
 */
export function ModerationCard({
  product,
  onChanged,
}: {
  product: ModProductDetail
  onChanged: () => void
}) {
  const { t } = useI18n()
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const { moderation } = product

  const approve = async () => {
    setBusy(true)
    // A product someone else just decided comes back as a 409 with the server's message
    await attempt(
      () => approveProduct(product.id),
      () => toast(t('moderation.approved')),
    )
    setBusy(false)
    onChanged()
  }

  if (moderation.state === 'approved') {
    return (
      <p className="flex items-center gap-2 px-1 text-sm text-ink-muted">
        <CircleCheck size={16} className="shrink-0 text-success" />
        {moderation.decidedAt
          ? t('moderation.approvedNote', {
              date: formatDateTime(moderation.decidedAt),
              name: moderation.by.slice(0, 8),
            })
          : t('moderation.approved')}
      </p>
    )
  }

  if (moderation.state === 'rejected') {
    return (
      <section className="flex gap-3 rounded-card bg-danger-soft p-5 text-danger">
        <CircleAlert size={20} className="mt-0.5 shrink-0" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-semibold">
            {t('moderation.rejectedNote', {
              reason: moderation.reason ? t(`moderation.reason.${moderation.reason}`) : '—',
            })}
          </p>
          {moderation.comment && <p className="text-sm break-words">{moderation.comment}</p>}
          {moderation.decidedAt && (
            <p className="text-sm opacity-80">
              {t('moderation.decided', {
                date: formatDateTime(moderation.decidedAt),
                name: moderation.by.slice(0, 8),
              })}
            </p>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-warning" />
        <h2 className="text-lg font-bold">{t('moderation.title')}</h2>
      </div>
      <p className="text-sm">
        {t('moderation.pending', { date: formatDateTime(moderation.submittedAt) })}
      </p>
      <p className="text-sm text-ink-muted">{t('moderation.check')}</p>
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="flex-1" loading={busy} onClick={() => void approve()}>
          {t('moderation.approve')}
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={() => setRejecting(true)}>
          {t('moderation.reject')}
        </Button>
      </div>
      {rejecting && (
        <RejectModal
          product={product}
          onClose={() => {
            setRejecting(false)
            onChanged()
          }}
        />
      )}
    </section>
  )
}

/** Turning a product down: a reason from the list and a comment the merchant acts on. */
function RejectModal({ product, onClose }: { product: ModProductDetail; onClose: () => void }) {
  const { t, tl } = useI18n()
  const [reason, setReason] = useState<ModerationReason>('photo')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const reject = async () => {
    setSubmitted(true)
    if (!comment.trim()) return
    setSaving(true)
    const ok = await attempt(
      () => rejectProduct(product.id, reason, comment.trim()),
      () => toast(t('moderation.rejectedToast')),
    )
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={tl(product.name)}
      title={t('moderation.reject.title')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="px-4!"
            loading={saving}
            onClick={() => void reject()}
          >
            {t('moderation.reject')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SelectField
          label={t('moderation.reason')}
          options={MODERATION_REASONS.map((value) => ({
            value,
            label: t(`moderation.reason.${value}`),
          }))}
          value={reason}
          onChange={setReason}
        />
        <TextAreaField
          label={t('moderation.comment')}
          hint={t('moderation.comment.hint')}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          error={submitted && !comment.trim() ? t('error.required') : undefined}
        />
      </div>
    </Modal>
  )
}
