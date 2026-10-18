import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { applicationsStore, type Application } from '@/entities/applications/applications'
import { CARD_LOGOS, clientsStore, fullName, type Client } from '@/entities/clients/clients'
import {
  MANUAL_METHODS,
  paymentsStore,
  progressOf,
  recordFailedCharge,
  recordPayment,
  type FailReason,
  type ManualMethod,
} from '@/entities/collections/payments'
import { merchantsStore } from '@/entities/merchants/merchants'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatSum, groupDigits } from '@/shared/lib/format'
import { parseDate, startOfDay } from '@/shared/lib/dates'
import { formatPhone } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { DateField } from '@/shared/ui/DateField'
import { Modal } from '@/shared/ui/Modal'
import { NumberField } from '@/shared/ui/NumberField'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { TextField } from '@/shared/ui/TextField'
import { logAction, sumParam } from '@/entities/audit/audit'
import { clientPath } from '@/shared/config/routes'

const now = () => new Date()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Takes a debtor's late payments from one of their cards right now, instead of waiting for
 * the next automatic try. It ends in a clear result: taken, or the bank's reason it was not.
 */
export function ChargeModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const [today] = useState(now)
  const late = applications
    .filter((application) => application.clientId === client.id && application.status === 'handed')
    .map((application) => ({ application, progress: progressOf(application, payments, today) }))
    .filter((item) => item.progress.overdue > 0)
  const overdue = late.reduce((sum, item) => sum + item.progress.overdue, 0)
  const max = late.reduce((sum, item) => sum + item.progress.remaining, 0)

  const [cardId, setCardId] = useState(client.cards[0]?.id ?? '')
  const [amount, setAmount] = useState<number | null>(overdue)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<
    { ok: true; sum: number } | { ok: false; reason: FailReason }
  >()

  const amountError = !amount
    ? t('error.required')
    : amount > max
      ? t('charge.error.max', { sum: formatSum(max) })
      : undefined

  const charge = async () => {
    setSubmitted(true)
    if (amountError || !amount) return
    setBusy(true)
    await wait(1200)
    setBusy(false)
    const at = now()
    const entry = { at, method: 'charge' as const, cardId, by: admin?.name ?? '—' }
    // Sample bank answer: a card whose latest try came back "blocked" is still blocked
    const lastTry = payments
      .filter((payment) => payment.cardId === cardId)
      .reduce<(typeof payments)[number] | undefined>(
        (latest, payment) => (!latest || payment.at > latest.at ? payment : latest),
        undefined,
      )
    const blocked = lastTry?.failed === 'cardBlocked'
    if (blocked) {
      recordFailedCharge(late[0].application, { ...entry, amount, failed: 'cardBlocked' })
      setResult({ ok: false, reason: 'cardBlocked' })
      return
    }
    // The late months first, oldest nasiya first; anything more goes ahead on the same ones
    let left = amount
    const parts = new Map<Application, number>()
    for (const key of ['overdue', 'remaining'] as const)
      for (const item of late) {
        const part = Math.min(left, item.progress[key] - (parts.get(item.application) ?? 0))
        if (part <= 0) continue
        parts.set(item.application, (parts.get(item.application) ?? 0) + part)
        left -= part
      }
    parts.forEach((sum, application) => recordPayment(application, { ...entry, amount: sum }, at))
    setResult({ ok: true, sum: amount })
    toast(t('charge.done'))
    logAction({
      section: 'collections',
      kind: 'money',
      action: 'audit.a.charged',
      params: { sum: sumParam(amount) },
      target: fullName(client),
      href: clientPath(client.id),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={fullName(client)}
      title={t('charge.title')}
      footer={
        result?.ok ? (
          <Button size="sm" className="ml-auto px-4!" onClick={onClose}>
            {t('common.close')}
          </Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" className="px-4!" loading={busy} onClick={charge}>
              {amount ? t('charge.submit', { sum: formatSum(amount) }) : t('charge.title')}
            </Button>
          </>
        )
      }
    >
      {result?.ok ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CircleCheck size={48} className="text-success" />
          <p className="text-lg font-bold tabular-nums">{formatSum(result.sum)}</p>
          <p className="text-ink-muted">{t('charge.success')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-muted">{t('charge.hint')}</p>
          {result && (
            <Alert message={t('charge.failed', { reason: t(`payment.fail.${result.reason}`) })} />
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-ink-muted">{t('collections.col.card')}</p>
            <div
              role="radiogroup"
              aria-label={t('collections.col.card')}
              className="flex flex-col gap-2"
            >
              {client.cards.map((card) => {
                const selected = card.id === cardId
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setCardId(card.id)
                      setResult(undefined)
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-control border-[1.5px] p-3 text-left transition-colors',
                      selected ? 'border-primary bg-green-200' : 'border-line hover:bg-surface',
                    )}
                  >
                    <img
                      src={CARD_LOGOS[card.brand]}
                      alt=""
                      className="h-7 w-10 shrink-0 rounded object-contain"
                    />
                    <span className="flex-1 font-semibold tabular-nums">
                      <span className="capitalize">{card.brand}</span> •••• {card.last4}
                    </span>
                    <span className="text-sm text-ink-muted tabular-nums">{card.expiry}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <NumberField
            label={t('charge.amount')}
            suffix="UZS"
            value={amount}
            onChange={setAmount}
            error={submitted ? amountError : undefined}
            hint={t('charge.amount.hint', { overdue: formatSum(overdue), max: formatSum(max) })}
          />
        </>
      )}
    </Modal>
  )
}

/**
 * Enters money paid outside the apps: cash at a shop or a bank transfer to Birzum. It needs the
 * nasiya, the sum, the day and the receipt or payment order number.
 */
export function ManualPaymentModal({
  client: fixed,
  onClose,
}: {
  client?: Client
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const clients = clientsStore.useAll()
  const applications = applicationsStore.useAll()
  const payments = paymentsStore.useAll()
  const merchants = merchantsStore.useAll()
  const [today] = useState(now)
  const running = applications.filter((application) => application.status === 'handed')
  const payers = clients.filter((client) => running.some((a) => a.clientId === client.id))

  const [clientId, setClientId] = useState(fixed?.id ?? '')
  const own = running.filter((application) => application.clientId === clientId)
  const [applicationId, setApplicationId] = useState(own.length === 1 ? own[0].id : '')
  const [method, setMethod] = useState<ManualMethod>('cash')
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState(formatDate(today))
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const application = own.find((item) => item.id === applicationId)
  const progress = application ? progressOf(application, payments, today) : null
  const day = parseDate(date)
  const errors = {
    client: !clientId ? t('error.required') : undefined,
    application: !application ? t('error.required') : undefined,
    amount: !amount
      ? t('error.required')
      : progress && amount > progress.remaining
        ? t('charge.error.max', { sum: formatSum(progress.remaining) })
        : undefined,
    date: !day ? t('error.required') : day > today ? t('manual.error.future') : undefined,
    reference: !reference.trim() ? t('error.required') : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || !application || !amount || !day) return
    // A payment entered for today keeps the time; an earlier day gets midday
    const at =
      startOfDay(day).getTime() === startOfDay(today).getTime()
        ? now()
        : new Date(day.getTime() + 12 * 3_600_000)
    recordPayment(
      application,
      {
        at,
        amount,
        method,
        reference: reference.trim(),
        note: note.trim() || undefined,
        by: admin?.name ?? '—',
      },
      today,
    )
    toast(amount >= progress!.remaining ? t('manual.closed') : t('manual.saved'))
    const payer = clients.find((item) => item.id === clientId)
    logAction({
      section: 'collections',
      kind: 'money',
      action: 'audit.a.paymentEntered',
      params: { sum: sumParam(amount) },
      target: payer && fullName(payer),
      href: payer && clientPath(payer.id),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={fixed ? fullName(fixed) : undefined}
      title={t('manual.title')}
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
      {!fixed && (
        <SelectField
          label={t('applications.col.client')}
          options={[
            { value: '', label: t('manual.pickClient'), disabled: true },
            ...payers.map((client) => ({
              value: client.id,
              label: `${fullName(client)} · ${formatPhone(client.phone)}`,
            })),
          ]}
          value={clientId}
          onChange={(value) => {
            setClientId(value)
            const next = running.filter((a) => a.clientId === value)
            setApplicationId(next.length === 1 ? next[0].id : '')
          }}
          error={submitted ? errors.client : undefined}
        />
      )}
      <SelectField
        label={t('payout.col.ariza')}
        options={[
          { value: '', label: t('manual.pickApplication'), disabled: true },
          ...own.map((item) => ({
            value: item.id,
            label: `№ ${groupDigits(item.number)} · ${merchants.find((m) => m.id === item.merchantId)?.name ?? ''} · ${item.lines[0].name}`,
          })),
        ]}
        value={applicationId}
        onChange={setApplicationId}
        disabled={!clientId}
        error={submitted ? errors.application : undefined}
      />
      {progress && (
        <div className="grid grid-cols-3 gap-2 rounded-control bg-surface p-3 text-sm">
          {(
            [
              [t('client.overdue'), progress.overdue, progress.overdue > 0],
              [t('application.monthly'), application!.monthlyPayment, false],
              [t('clients.col.debt'), progress.remaining, false],
            ] as const
          ).map(([label, sum, red]) => (
            <button
              key={label}
              type="button"
              disabled={!sum}
              onClick={() => setAmount(sum)}
              className="flex flex-col items-start rounded-[10px] p-1.5 text-left hover:bg-canvas disabled:hover:bg-transparent"
            >
              <span className="text-xs text-ink-muted">{label}</span>
              <span className={cn('font-semibold tabular-nums', red && 'text-danger')}>
                {formatSum(sum)}
              </span>
            </button>
          ))}
        </div>
      )}
      <ChoiceGrid
        label={t('manual.method')}
        columns={2}
        options={MANUAL_METHODS.map((value) => ({ value, label: t(`payment.method.${value}`) }))}
        value={method}
        onChange={setMethod}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label={t('payouts.col.amount')}
          suffix="UZS"
          value={amount}
          onChange={setAmount}
          error={submitted ? errors.amount : undefined}
        />
        <DateField
          label={t('manual.date')}
          placeholder="dd.mm.yyyy"
          value={date}
          onChange={setDate}
          error={submitted ? errors.date : undefined}
        />
      </div>
      <TextField
        label={t(method === 'cash' ? 'manual.reference.cash' : 'manual.reference.transfer')}
        placeholder={method === 'cash' ? 'KV-004512' : 'PT-2026-10-0187'}
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        error={submitted ? errors.reference : undefined}
      />
      <TextAreaField
        label={t('contact.comment')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      {progress && amount !== null && amount >= progress.remaining && (
        <p className="rounded-control bg-green-200 p-3 text-sm">{t('manual.willClose')}</p>
      )}
    </Modal>
  )
}
