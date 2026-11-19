import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { CALL_RESULTS, type CallResult } from '@/entities/collections/contacts'
import {
  MANUAL_STATUSES,
  statusAfterCall,
  type DebtCase,
  type DebtStatus,
} from '@/entities/collections/debtCases'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { parseDate, startOfDay } from '@/shared/lib/dates'
import { formatDateTime } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { DateField } from '@/shared/ui/DateField'
import { Modal } from '@/shared/ui/Modal'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { moveIn, type DebtTarget } from '../lib/board'
import { atSlot, dateText, slotOf, TIME_SLOTS } from '../lib/rows'

const footer = (onClose: () => void, onSave: () => void, cancel: string, save: string) => (
  <>
    <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
      {cancel}
    </Button>
    <Button size="sm" className="px-4!" onClick={onSave}>
      {save}
    </Button>
  </>
)

/** A day and a half-hour slot side by side. */
function DayAndTime({
  label,
  day,
  onDay,
  slot,
  onSlot,
  error,
  allowEmpty,
}: {
  label: string
  day: string
  onDay: (value: string) => void
  slot: string
  onSlot: (value: string) => void
  error?: string
  allowEmpty?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_140px] items-start gap-3">
      <DateField
        label={label}
        placeholder={allowEmpty ? t('debts.next.none') : 'dd.mm.yyyy'}
        value={day}
        onChange={onDay}
        error={error}
      />
      <SelectField
        label={t('debts.time')}
        options={TIME_SLOTS.map((value) => ({ value, label: value }))}
        value={slot}
        onChange={onSlot}
      />
    </div>
  )
}

/** One call as the form gives it to the workspace to keep. */
export type CallEntry = {
  at: Date
  by: string
  result: CallResult
  promiseDate?: Date
  clientAnswer?: string
  comment?: string
  nextCall?: Date
  statusAfter: DebtStatus
  /** Who picked up, when it was not the borrower (a microloan's contact). */
  whom?: string
}

/**
 * Writes down a call about a late debt: the result, what the person said, the operator's note,
 * the next call and the status it moves the debt to. A microloan's form also asks who was called
 * (the borrower or one of their contacts). When the person has other late debts, the same call
 * can go on those too.
 */
export function DebtCallModal({
  file,
  target,
  others,
  people,
  onSave,
  onClose,
}: {
  file: DebtCase
  target: DebtTarget
  /** The person's other open files. */
  others: { file: DebtCase; href: string }[]
  /** Who can be called; the first is the borrower. None for Birzum. */
  people?: { value: string; label: string }[]
  /** Keeps the call on one debt. */
  onSave: (fileId: string, entry: CallEntry) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [now] = useState(() => new Date())
  const [result, setResult] = useState<CallResult>('promised')
  const [whom, setWhom] = useState(people?.[0]?.value ?? '')
  const [callDay, setCallDay] = useState(dateText(now))
  const [callSlot, setCallSlot] = useState(slotOf(now))
  const [promise, setPromise] = useState('')
  const [answer, setAnswer] = useState('')
  const [comment, setComment] = useState('')
  const [nextDay, setNextDay] = useState('')
  const [nextSlot, setNextSlot] = useState('10:00')
  const [status, setStatus] = useState<DebtStatus>(statusAfterCall('promised', file.status))
  const [statusTouched, setStatusTouched] = useState(false)
  const [allToo, setAllToo] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const today = startOfDay(now)
  const needsPromise = result === 'promised' || result === 'askedDelay'
  const callDate = parseDate(callDay)
  const promiseDate = parseDate(promise)
  const nextDate = parseDate(nextDay)
  const errors = {
    call: !callDate ? t('error.required') : callDate > today ? t('debts.error.future') : undefined,
    promise: !needsPromise
      ? undefined
      : !promiseDate
        ? t('error.required')
        : promiseDate < today
          ? t('contact.error.pastDate')
          : undefined,
    next: nextDay && (!nextDate || nextDate < today) ? t('contact.error.pastDate') : undefined,
  }

  const pickResult = (value: CallResult) => {
    setResult(value)
    if (!statusTouched) setStatus(statusAfterCall(value, file.status))
  }

  const save = () => {
    setSubmitted(true)
    if (errors.call || errors.promise || errors.next) return
    const by = admin?.name ?? '—'
    const at = atSlot(callDate!, callSlot)
    const nextCall = nextDate ? atSlot(nextDate, nextSlot) : undefined
    const label = t(`contact.result.${result}`)
    const whomName =
      people && whom !== people[0]?.value ? people.find((p) => p.value === whom)?.label : undefined
    const targets = allToo
      ? [{ file, href: target.href }, ...others]
      : [{ file, href: target.href }]
    for (const item of targets) {
      onSave(item.file.id, {
        at,
        by,
        result,
        promiseDate: needsPromise ? (promiseDate ?? undefined) : undefined,
        clientAnswer: answer.trim() || undefined,
        comment: comment.trim() || undefined,
        nextCall,
        statusAfter: status,
        whom: whomName,
      })
      moveIn(target.store, item.file, status, by, label)
      if (nextCall) target.store.update(item.file.id, { nextCall: { at: nextCall } })
      logAction({
        section: target.section,
        kind: 'update',
        action: 'audit.a.debtCall',
        params: { result: label },
        target: target.name,
        href: item.href,
        changes:
          item.file.status !== status
            ? [
                {
                  field: 'debts.status',
                  from: t(`debts.status.${item.file.status}`),
                  to: t(`debts.status.${status}`),
                },
              ]
            : undefined,
      })
    }
    toast(t('contact.saved'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={target.name}
      title={t('contact.call.title')}
      size="wide"
      footer={footer(onClose, save, t('common.cancel'), t('common.save'))}
    >
      {people && people.length > 1 && (
        <SelectField
          label={t('debts.whom')}
          options={people}
          value={whom}
          onChange={setWhom}
          hint={t('debts.whom.hint')}
        />
      )}
      <ChoiceGrid
        label={t('contact.result')}
        columns={4}
        options={CALL_RESULTS.map((value) => ({ value, label: t(`contact.result.${value}`) }))}
        value={result}
        onChange={pickResult}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <DayAndTime
          label={t('debts.callAt')}
          day={callDay}
          onDay={setCallDay}
          slot={callSlot}
          onSlot={setCallSlot}
          error={submitted ? errors.call : undefined}
        />
        {needsPromise && (
          <DateField
            label={t(result === 'askedDelay' ? 'debts.delayUntil' : 'contact.promiseDate')}
            placeholder="dd.mm.yyyy"
            value={promise}
            onChange={setPromise}
            error={submitted ? errors.promise : undefined}
          />
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextAreaField
          label={t('debts.clientAnswer')}
          placeholder={t('debts.clientAnswer.placeholder')}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
        />
        <TextAreaField
          label={t('debts.operatorComment')}
          placeholder={t('debts.operatorComment.placeholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <DayAndTime
          label={t('debts.nextCall')}
          day={nextDay}
          onDay={setNextDay}
          slot={nextSlot}
          onSlot={setNextSlot}
          error={submitted ? errors.next : undefined}
          allowEmpty
        />
        <SelectField
          label={t('debts.statusAfter')}
          options={MANUAL_STATUSES.map((value) => ({
            value,
            label: t(`debts.status.${value}`),
          }))}
          value={status === 'new' || status === 'closed' ? 'firstCall' : status}
          onChange={(value) => {
            setStatusTouched(true)
            setStatus(value)
          }}
          hint={t('debts.statusAfter.hint')}
        />
      </div>
      {others.length > 0 && (
        <Checkbox
          label={t('debts.callAllToo', { count: String(others.length) })}
          description={t('debts.callAllToo.hint')}
          checked={allToo}
          onChange={setAllToo}
        />
      )}
    </Modal>
  )
}

/**
 * Moves a debt to another status with a reason. Opened from the file, or when a card is dropped
 * on another column of the board (then the new status is already picked).
 */
export function DebtStatusModal({
  file,
  target,
  to,
  onClose,
}: {
  file: DebtCase
  target: DebtTarget
  to?: DebtStatus
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const first = MANUAL_STATUSES.find((value) => value !== file.status) ?? 'firstCall'
  const [status, setStatus] = useState<DebtStatus>(to ?? first)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const errors = {
    status: status === file.status ? t('debts.error.sameStatus') : undefined,
    comment: comment.trim() ? undefined : t('error.required'),
  }

  const save = () => {
    setSubmitted(true)
    if (errors.status || errors.comment) return
    moveIn(target.store, file, status, admin?.name ?? '—', comment.trim())
    logAction({
      section: target.section,
      kind: 'update',
      action: 'audit.a.debtStatus',
      target: target.name,
      href: target.href,
      changes: [
        {
          field: 'debts.status',
          from: t(`debts.status.${file.status}`),
          to: t(`debts.status.${status}`),
        },
      ],
    })
    toast(t('debts.status.saved'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={target.name}
      title={t('debts.status.change')}
      footer={footer(onClose, save, t('common.cancel'), t('common.save'))}
    >
      <p className="text-sm text-ink-muted">
        {t('debts.status.now', { status: t(`debts.status.${file.status}`) })}
      </p>
      <SelectField
        label={t('debts.status.target')}
        options={MANUAL_STATUSES.map((value) => ({ value, label: t(`debts.status.${value}`) }))}
        value={status}
        onChange={setStatus}
        error={submitted ? errors.status : undefined}
      />
      <TextAreaField
        label={t('debts.status.reason')}
        placeholder={t('debts.status.reason.placeholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        error={submitted ? errors.comment : undefined}
      />
    </Modal>
  )
}

/** Sets, moves or removes the next call of a debt. */
export function NextCallModal({
  file,
  target,
  onClose,
}: {
  file: DebtCase
  target: DebtTarget
  onClose: () => void
}) {
  const { t } = useI18n()
  const [now] = useState(() => new Date())
  const [day, setDay] = useState(file.nextCall ? dateText(file.nextCall.at) : '')
  const [slot, setSlot] = useState(file.nextCall ? slotOf(file.nextCall.at) : '10:00')
  const [note, setNote] = useState(file.nextCall?.note ?? '')
  const [submitted, setSubmitted] = useState(false)
  const date = parseDate(day)
  const error = !date
    ? t('error.required')
    : date < startOfDay(now)
      ? t('contact.error.pastDate')
      : undefined

  const log = (to: string) =>
    logAction({
      section: target.section,
      kind: 'update',
      action: 'audit.a.debtNextCall',
      target: target.name,
      href: target.href,
      changes: [
        {
          field: 'debts.nextCall',
          from: file.nextCall ? formatDateTime(file.nextCall.at) : '—',
          to,
        },
      ],
    })

  const save = () => {
    setSubmitted(true)
    if (error) return
    const at = atSlot(date!, slot)
    target.store.update(file.id, { nextCall: { at, note: note.trim() || undefined } })
    log(formatDateTime(at))
    toast(t('debts.next.saved'))
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={target.name}
      title={t('debts.next.title')}
      footer={
        <>
          {file.nextCall && (
            <Button
              size="sm"
              variant="ghost"
              className="px-4! text-danger!"
              onClick={() => {
                target.store.update(file.id, { nextCall: undefined })
                log('—')
                toast(t('debts.next.removed'))
                onClose()
              }}
            >
              {t('debts.next.remove')}
            </Button>
          )}
          {footer(onClose, save, t('common.cancel'), t('common.save'))}
        </>
      }
    >
      <DayAndTime
        label={t('debts.next.day')}
        day={day}
        onDay={setDay}
        slot={slot}
        onSlot={setSlot}
        error={submitted ? error : undefined}
      />
      <TextAreaField
        label={t('debts.next.note')}
        placeholder={t('debts.next.note.placeholder')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
    </Modal>
  )
}

/** Gives a debt to an operator, or takes it back to "Biriktirilmagan". */
export function OperatorModal({
  file,
  target,
  onClose,
}: {
  file: DebtCase
  target: DebtTarget
  onClose: () => void
}) {
  const { t } = useI18n()
  const [operator, setOperator] = useState(file.operatorId ?? '')
  const nameOf = (id?: string) =>
    target.operators.find((item) => item.id === id)?.name ?? t('debts.operator.none')

  const save = () => {
    if (operator !== (file.operatorId ?? '')) {
      target.store.update(file.id, { operatorId: operator || undefined })
      logAction({
        section: target.section,
        kind: 'update',
        action: 'audit.a.debtOperator',
        target: target.name,
        href: target.href,
        changes: [
          {
            field: 'debts.operator',
            from: nameOf(file.operatorId),
            to: nameOf(operator || undefined),
          },
        ],
      })
      toast(t('debts.operator.saved'))
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={target.name}
      title={t('debts.operator.title')}
      footer={footer(onClose, save, t('common.cancel'), t('common.save'))}
    >
      <SelectField
        label={t('debts.operator')}
        options={[
          { value: '', label: t('debts.operator.none') },
          ...target.operators.map((admin) => ({ value: admin.id, label: admin.name })),
        ]}
        value={operator}
        onChange={setOperator}
        hint={t('debts.operator.hint')}
      />
    </Modal>
  )
}
