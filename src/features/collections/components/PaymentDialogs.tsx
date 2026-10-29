import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { applicationsStore, type Application } from '@/entities/applications/applications'
import { CARD_LOGOS, fullName, type Client } from '@/entities/clients/clients'
import {
  paymentsStore,
  progressOf,
  recordFailedCharge,
  recordPayment,
  type FailReason,
} from '@/entities/collections/payments'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { NumberField } from '@/shared/ui/NumberField'
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
