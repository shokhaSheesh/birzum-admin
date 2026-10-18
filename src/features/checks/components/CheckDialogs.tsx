import { useState } from 'react'
import { applicationsStore, type Application } from '@/entities/applications/applications'
import {
  CHECK_REJECT_REASONS,
  checksStore,
  type CheckRejectReason,
} from '@/entities/applications/checks'
import { logAction } from '@/entities/audit/audit'
import { useAdmin } from '@/entities/session/session'
import { checkPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { Modal } from '@/shared/ui/Modal'
import { TextAreaField } from '@/shared/ui/TextAreaField'

type Props = { application: Application; onClose: () => void }
const now = () => new Date()

/** Lets the merchant hand the goods over. A note is optional. */
export function ApproveCheckModal({ application, onClose }: Props) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [comment, setComment] = useState('')
  const number = groupDigits(application.number)

  const approve = () => {
    const at = now()
    // A shopper's order goes to the merchant to confirm; one made in the shop goes on to its contract
    const next = application.source === 'client' ? 'pending' : 'processing'
    applicationsStore.update(application.id, {
      status: next,
      history: [
        ...application.history,
        {
          status: next,
          at,
          by: { kind: 'system', name: 'Birzum' },
          comment: comment.trim() || undefined,
        },
      ],
    })
    checksStore.update(application.id, {
      state: 'approved',
      mode: 'manual',
      decidedAt: at,
      decidedBy: admin?.name ?? '—',
      comment: comment.trim() || undefined,
    })
    logAction({
      section: 'checks',
      kind: 'update',
      action: 'audit.a.checkApproved',
      target: t('application.title', { number }),
      href: checkPath(application.id),
    })
    toast(t('check.approved'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('application.title', { number })}
      title={t('check.approve.title')}
      footer={
        <>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={approve}>{t('check.approve')}</Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{t('check.approve.hint')}</p>
      <TextAreaField
        label={t('check.comment.optional')}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
    </Modal>
  )
}

/** Stops the ariza: it becomes Rad etilgan and the merchant and shopper see the comment. */
export function RejectCheckModal({ application, onClose }: Props) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [reason, setReason] = useState<CheckRejectReason>('income')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const number = groupDigits(application.number)

  const reject = () => {
    setSubmitted(true)
    if (!comment.trim()) return
    const at = now()
    checksStore.update(application.id, {
      state: 'rejected',
      mode: 'manual',
      decidedAt: at,
      decidedBy: admin?.name ?? '—',
      reason,
      comment: comment.trim(),
    })
    applicationsStore.update(application.id, {
      status: 'rejected',
      rejection: { reason: 'risk', comment: comment.trim() },
      history: [
        ...application.history,
        { status: 'rejected', at, by: { kind: 'system', name: 'Birzum' }, comment: comment.trim() },
      ],
    })
    logAction({
      section: 'checks',
      kind: 'update',
      action: 'audit.a.checkRejected',
      target: t('application.title', { number }),
      href: checkPath(application.id),
      changes: [
        {
          field: 'audit.f.status',
          from: t('application.status.checking'),
          to: t('application.status.rejected'),
        },
      ],
    })
    toast(t('check.rejected'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('application.title', { number })}
      title={t('check.reject.title')}
      footer={
        <>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={reject}>
            {t('check.reject')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{t('check.reject.hint')}</p>
      <ChoiceGrid
        label={t('check.reason')}
        options={CHECK_REJECT_REASONS.map((value) => ({
          value,
          label: t(`check.reason.${value}`),
        }))}
        value={reason}
        onChange={setReason}
        columns={2}
      />
      <TextAreaField
        label={t('check.comment')}
        hint={t('check.comment.hint')}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={submitted && !comment.trim() ? t('error.required') : undefined}
      />
    </Modal>
  )
}
