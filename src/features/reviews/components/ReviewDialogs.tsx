import { useState } from 'react'
import { HIDE_REASONS, type HideReason, type Review } from '@/entities/reviews/reviews'
import { deleteReview, hideReview, restoreReview } from '@/entities/reviews/reviewsApi'
import { attempt } from '@/shared/api/createRemoteStore'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { TextAreaField } from '@/shared/ui/TextAreaField'

/** Takes a review off the shop page and out of its rating, with a reason. */
export function HideReviewModal({
  review,
  onClose,
  onDone,
}: {
  review: Review
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState<HideReason>('abuse')
  const [comment, setComment] = useState('')

  const hide = async () => {
    setSaving(true)
    const ok = await attempt(
      () => hideReview(review.id, reason, comment.trim()),
      () => toast(t('review.hidden')),
    )
    setSaving(false)
    if (ok) {
      onDone()
      onClose()
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={review.author}
      title={t('review.hide.title')}
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
            onClick={() => void hide()}
          >
            {t('review.hide')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{t('review.hide.hint')}</p>
      <blockquote className="rounded-control bg-surface p-3 text-sm">{review.text}</blockquote>
      <ChoiceGrid
        label={t('review.hide.reason')}
        columns={2}
        options={HIDE_REASONS.map((value) => ({ value, label: t(`review.reason.${value}`) }))}
        value={reason}
        onChange={setReason}
      />
      <TextAreaField
        label={t('contact.comment')}
        placeholder={t('review.hide.comment')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />
    </Modal>
  )
}

/** Puts a hidden or merchant-removed review back on the shop page, after a confirm. */
export function RestoreReviewDialog({
  review,
  onClose,
  onDone,
}: {
  review: Review
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      tone="primary"
      title={t('review.restore.title')}
      confirmLabel={t('review.restore')}
      onConfirm={async () => {
        const ok = await attempt(
          () => restoreReview(review.id),
          () => toast(t('review.restored')),
        )
        if (ok) onDone()
        onClose()
      }}
    >
      <p>{t(review.status === 'removed' ? 'review.restore.removed' : 'review.restore.hidden')}</p>
    </ConfirmDialog>
  )
}

/** Deletes a review for good, after a confirm. */
export function DeleteReviewDialog({
  review,
  onClose,
  onDone,
}: {
  review: Review
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('review.delete.title')}
      confirmLabel={t('common.delete')}
      onConfirm={async () => {
        const ok = await attempt(
          () => deleteReview(review.id),
          () => toast(t('review.deleted')),
        )
        if (ok) onDone()
        onClose()
      }}
    >
      <p>{t('review.delete.message')}</p>
    </ConfirmDialog>
  )
}
