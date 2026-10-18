import { useState } from 'react'
import { logAction, sumParam } from '@/entities/audit/audit'
import { clientsStore, fullName, type Client } from '@/entities/clients/clients'
import { LIMIT_REASONS, limitsStore, type LimitReason } from '@/entities/clients/limits'
import { useAdmin } from '@/entities/session/session'
import { clientPath } from '@/shared/config/routes'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { parseDate } from '@/shared/lib/dates'
import { formatDate, formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DateField } from '@/shared/ui/DateField'
import { Modal } from '@/shared/ui/Modal'
import { NumberField } from '@/shared/ui/NumberField'
import { TextAreaField } from '@/shared/ui/TextAreaField'

const now = () => new Date()
const inMonths = (months: number) => {
  const date = now()
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate())
}
/** The most an admin may set by hand. */
const MAX_LIMIT = 100_000_000

type Props = { client: Client; onClose: () => void }

/** Sets the limit by hand: the new sum, how long it holds, why, and a note for the record. */
export function LimitModal({ client, onClose }: Props) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [amount, setAmount] = useState<number | null>(client.limit?.amount ?? null)
  const [until, setUntil] = useState(formatDate(client.limit?.validUntil ?? inMonths(6)))
  const [reason, setReason] = useState<LimitReason | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const date = parseDate(until)
  const errors = {
    amount: !amount
      ? t('error.required')
      : amount > MAX_LIMIT
        ? t('limit.error.max', { max: formatSum(MAX_LIMIT) })
        : amount === client.limit?.amount
          ? t('limit.error.same')
          : undefined,
    until: !date ? t('error.required') : date <= now() ? t('limit.error.past') : undefined,
    reason: !reason ? t('error.required') : undefined,
    comment: !comment.trim() ? t('error.required') : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || !amount || !date || !reason) return
    const from = client.limit?.amount ?? null
    clientsStore.update(client.id, { limit: { amount, validUntil: date } })
    limitsStore.save({
      id: newId(),
      clientId: client.id,
      at: now(),
      source: 'manual',
      by: admin?.name ?? '—',
      from,
      to: amount,
      validUntil: date,
      reason,
      comment: comment.trim(),
    })
    logAction({
      section: 'customers',
      kind: 'update',
      action: 'audit.a.limitChanged',
      target: fullName(client),
      href: clientPath(client.id),
      changes: [
        { field: 'client.limit', from: from === null ? '—' : sumParam(from), to: sumParam(amount) },
      ],
    })
    toast(t('limit.saved'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={fullName(client)}
      title={t('limit.edit.title')}
      footer={
        <>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save}>{t('common.save')}</Button>
        </>
      }
    >
      <p className="rounded-control bg-surface p-3 text-sm text-ink-muted">
        {client.limit
          ? t('limit.current', {
              sum: formatSum(client.limit.amount),
              date: formatDate(client.limit.validUntil),
            })
          : t('clients.limit.none')}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label={t('limit.amount')}
          value={amount}
          onChange={setAmount}
          suffix="UZS"
          error={submitted ? errors.amount : undefined}
        />
        <DateField
          label={t('limit.until')}
          placeholder="KK.OO.YYYY"
          value={until}
          onChange={setUntil}
          error={submitted ? errors.until : undefined}
        />
      </div>
      <ChoiceGrid
        label={t('limit.reason')}
        options={LIMIT_REASONS.map((value) => ({ value, label: t(`limit.reason.${value}`) }))}
        value={reason}
        onChange={setReason}
        columns={2}
        error={submitted ? errors.reason : undefined}
      />
      <TextAreaField
        label={t('limit.comment')}
        hint={t('limit.comment.hint')}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={submitted ? errors.comment : undefined}
      />
    </Modal>
  )
}

/**
 * Asks FlexSoft to score the shopper again. In the prototype the answer comes at once: the same
 * sum, valid for another six months.
 */
export function RecalculateDialog({ client, onClose }: Props) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      tone="primary"
      title={t('limit.recalc.title')}
      confirmLabel={t('limit.recalc')}
      onConfirm={() => {
        const amount = client.limit?.amount ?? 5_000_000
        const validUntil = inMonths(6)
        clientsStore.update(client.id, { limit: { amount, validUntil } })
        limitsStore.save({
          id: newId(),
          clientId: client.id,
          at: now(),
          source: 'scoring',
          from: client.limit?.amount ?? null,
          to: amount,
          validUntil,
        })
        logAction({
          section: 'customers',
          kind: 'update',
          action: 'audit.a.limitRecalculated',
          target: fullName(client),
          href: clientPath(client.id),
        })
        toast(t('limit.recalc.done'))
        onClose()
      }}
    >
      <p>{t('limit.recalc.message')}</p>
    </ConfirmDialog>
  )
}
