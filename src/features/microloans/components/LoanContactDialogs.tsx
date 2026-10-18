import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  CONTACT_RESULTS,
  loanContactsStore,
  type ContactResult,
} from '@/entities/microloans/loanContacts'
import type { Loan } from '@/entities/microloans/loans'
import { useAdmin } from '@/entities/session/session'
import { brandLoanPath, WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { parseDate, startOfDay } from '@/shared/lib/dates'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DateField } from '@/shared/ui/DateField'
import { Modal } from '@/shared/ui/Modal'
import { TextAreaField } from '@/shared/ui/TextAreaField'

const now = () => new Date()

/** Writes down how a call about a late loan went; a promise needs the day they will pay by. */
export function LoanCallModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [result, setResult] = useState<ContactResult>('promised')
  const [promise, setPromise] = useState('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const date = parseDate(promise)
  const dateError =
    result !== 'promised'
      ? undefined
      : !date
        ? t('error.required')
        : date < startOfDay(now())
          ? t('contact.error.pastDate')
          : undefined

  const save = () => {
    setSubmitted(true)
    if (dateError) return
    loanContactsStore.save({
      id: newId(),
      loanId: loan.id,
      at: now(),
      by: admin?.name ?? '—',
      channel: 'call',
      result,
      promiseDate: result === 'promised' ? (date ?? undefined) : undefined,
      comment: comment.trim() || undefined,
    })
    toast(t('contact.saved'))
    logAction({
      section: 'mlOverdue',
      kind: 'update',
      action: 'audit.a.loanContactSaved',
      params: { brand: WORKSPACE_INFO[loan.brand].name },
      target: `${loan.number} · ${loan.borrower.name}`,
      href: brandLoanPath(loan.brand, loan.id),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={`${loan.number} · ${loan.borrower.name}`}
      title={t('contact.call.title')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <ChoiceGrid
        label={t('contact.result')}
        columns={2}
        options={CONTACT_RESULTS.map((value) => ({ value, label: t(`contact.result.${value}`) }))}
        value={result}
        onChange={setResult}
      />
      {result === 'promised' && (
        <DateField
          label={t('contact.promiseDate')}
          placeholder="dd.mm.yyyy"
          value={promise}
          onChange={setPromise}
          error={submitted ? dateError : undefined}
        />
      )}
      <TextAreaField
        label={t('contact.comment')}
        placeholder={t('contact.comment.placeholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
    </Modal>
  )
}

/** Sends the borrower an SMS and an app notification about the late loan, after showing it. */
export function LoanReminderDialog({
  loan,
  amount,
  days,
  onClose,
}: {
  loan: Loan
  amount: number
  days: number
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const firstName = loan.borrower.name.split(' ')[1] ?? loan.borrower.name
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('contact.remind.title')}
      tone="primary"
      confirmLabel={t('contact.remind.send')}
      onConfirm={() => {
        loanContactsStore.save({
          id: newId(),
          loanId: loan.id,
          at: now(),
          by: admin?.name ?? '—',
          channel: 'reminder',
        })
        toast(t('contact.reminded'))
        logAction({
          section: 'mlOverdue',
          kind: 'update',
          action: 'audit.a.loanReminded',
          params: { brand: WORKSPACE_INFO[loan.brand].name },
          target: `${loan.number} · ${loan.borrower.name}`,
          href: brandLoanPath(loan.brand, loan.id),
        })
        onClose()
      }}
    >
      <p>{t('overdue.remind.message')}</p>
      <p className="mt-1 rounded-control bg-surface p-3 text-sm text-ink">
        {t('overdue.remind.text', {
          name: firstName,
          brand: WORKSPACE_INFO[loan.brand].name,
          number: loan.number,
          sum: formatSum(amount),
          days: String(days),
        })}
      </p>
    </ConfirmDialog>
  )
}
