import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  DECLINE_REASONS,
  loanApplicationsStore,
  type DeclineReason,
  type LoanApplication,
  type LoanAppStatus,
} from '@/entities/microloans/applications'
import { loanProductsStore, monthlyOf } from '@/entities/microloans/products'
import { useAdmin } from '@/entities/session/session'
import { loanAppPath, WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatSum, groupDigits } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { NumberField } from '@/shared/ui/NumberField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'

export type Decision = 'approve' | 'counter' | 'decline'

// How long the borrower has to sign an offer
const OFFER_DAYS = 3

/**
 * An admin's decision on an ariza the rules left open: approve the sum asked, offer a smaller
 * one (the monthly payment follows as it is typed), or decline with a reason the app shows.
 */
export function LoanDecisionModal({
  app,
  decision,
  onClose,
}: {
  app: LoanApplication
  decision: Decision
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const product = loanProductsStore.useAll().find((p) => p.id === app.productId)
  const [offered, setOffered] = useState<number | null>(null)
  const [reason, setReason] = useState<DeclineReason>('income')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const min = product?.min ?? 1_000_000

  const offerError =
    offered === null
      ? t('error.required')
      : offered >= app.amount
        ? t('loanDecision.error.less', { sum: formatSum(app.amount) })
        : offered < min
          ? t('loanDecision.error.min', { sum: formatSum(min) })
          : undefined
  const commentError = reason === 'other' && !comment.trim() ? t('error.required') : undefined

  const confirm = () => {
    setSubmitted(true)
    if (decision === 'counter' && offerError) return
    if (decision === 'decline' && commentError) return
    const at = new Date()
    const status: LoanAppStatus =
      decision === 'approve' ? 'approved' : decision === 'counter' ? 'counter' : 'declined'
    const by = { admin: admin?.name ?? '—' }
    const offerUntil =
      decision === 'decline' ? undefined : new Date(at.getTime() + OFFER_DAYS * 86_400_000)
    loanApplicationsStore.update(app.id, {
      status,
      offered: decision === 'counter' ? offered! : undefined,
      decline:
        decision === 'decline' ? { reason, comment: comment.trim() || undefined } : undefined,
      offerUntil,
      history: [
        ...app.history,
        {
          at,
          status,
          by,
          note:
            decision === 'counter'
              ? t('loanDecision.note.counter', { sum: formatSum(offered!) })
              : decision === 'decline'
                ? comment.trim() || t(`loanDecline.${reason}`)
                : undefined,
        },
      ],
    })
    logAction({
      section: 'mlApplications',
      kind: 'update',
      action: `audit.a.loanApp.${decision}`,
      params: { brand: WORKSPACE_INFO[app.brand].name },
      target: t('application.title', { number: groupDigits(app.number) }),
      href: loanAppPath(app.brand, app.id),
      changes: [
        {
          field: 'merchants.status',
          from: t(`loanApp.status.${app.status}`),
          to: t(`loanApp.status.${status}`),
        },
        ...(decision === 'counter'
          ? [
              {
                field: 'loanApps.col.sum' as const,
                from: formatSum(app.amount),
                to: formatSum(offered!),
              },
            ]
          : []),
      ],
    })
    toast(t(`loanDecision.done.${decision}`))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('application.title', { number: groupDigits(app.number) })}
      title={t(`loanDecision.title.${decision}`)}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant={decision === 'decline' ? 'danger' : 'primary'}
            className="px-4!"
            onClick={confirm}
          >
            {t(`loanDecision.confirm.${decision}`)}
          </Button>
        </>
      }
    >
      {decision === 'approve' && (
        <p className="text-ink-muted">
          {t('loanDecision.approve.text', {
            name: app.borrower.name,
            sum: formatSum(app.amount),
            term: String(app.term),
            monthly: formatSum(monthlyOf(app.amount, app.rate, app.term)),
            days: String(OFFER_DAYS),
          })}
        </p>
      )}
      {decision === 'counter' && (
        <>
          <p className="text-ink-muted">
            {t('loanDecision.counter.text', {
              sum: formatSum(app.amount),
              days: String(OFFER_DAYS),
            })}
          </p>
          <NumberField
            label={t('loanDecision.offered')}
            value={offered}
            onChange={setOffered}
            suffix="UZS"
            error={submitted ? offerError : undefined}
            hint={
              offered && !offerError
                ? t('loanDecision.monthly', {
                    monthly: formatSum(monthlyOf(offered, app.rate, app.term)),
                    term: String(app.term),
                  })
                : t('loanDecision.offered.hint', { sum: formatSum(min) })
            }
          />
        </>
      )}
      {decision === 'decline' && (
        <>
          <SelectField
            label={t('loanDecision.reason')}
            options={DECLINE_REASONS.map((value) => ({ value, label: t(`loanDecline.${value}`) }))}
            value={reason}
            onChange={setReason}
          />
          <TextAreaField
            label={t('loanDecision.comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            hint={t('loanDecision.comment.hint')}
            error={submitted ? commentError : undefined}
          />
        </>
      )}
    </Modal>
  )
}
