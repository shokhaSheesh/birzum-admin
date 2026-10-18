import { useState } from 'react'
import {
  HIDE_REASONS,
  reviewsStore,
  type HideReason,
  type Review,
} from '@/entities/reviews/reviews'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { TextAreaField } from '@/shared/ui/TextAreaField'

const now = () => new Date()

/** Takes a review off the shop page and out of its rating, with a reason. */
export function HideReviewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [reason, setReason] = useState<HideReason>('abuse')
  const [comment, setComment] = useState('')

  const hide = () => {
    reviewsStore.update(review.id, {
      status: 'hidden',
      moderation: {
        at: now(),
        by: admin?.name ?? '—',
        reason,
        comment: comment.trim() || undefined,
      },
    })
    toast(t('review.hidden'))
    onClose()
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
          <Button size="sm" variant="danger" className="px-4!" onClick={hide}>
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
export function RestoreReviewDialog({ review, onClose }: { review: Review; onClose: () => void }) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      tone="primary"
      title={t('review.restore.title')}
      confirmLabel={t('review.restore')}
      onConfirm={() => {
        reviewsStore.update(review.id, { status: 'published', moderation: undefined })
        toast(t('review.restored'))
        onClose()
      }}
    >
      <p>{t(review.status === 'removed' ? 'review.restore.removed' : 'review.restore.hidden')}</p>
    </ConfirmDialog>
  )
}

/** Deletes a review for good, after a confirm. */
export function DeleteReviewDialog({ review, onClose }: { review: Review; onClose: () => void }) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('review.delete.title')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        reviewsStore.remove(review.id)
        toast(t('review.deleted'))
        onClose()
      }}
    >
      <p>{t('review.delete.message')}</p>
    </ConfirmDialog>
  )
}
