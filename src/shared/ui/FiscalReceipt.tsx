import { ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatDateTime, formatSum } from '@/shared/lib/format'

export type Receipt = {
  /** Who issued the cheque and their tax number (STIR). */
  seller: string
  tin: string
  /** What was paid for, one line. */
  title: string
  amount: number
  at: Date
  /** The card it was paid from, e.g. "Humo •••• 1671". */
  card: string
  /** Any id unique to the payment; the cheque numbers are made from it. */
  seed: string
}

// Same seed, same numbers, so a cheque reads the same every time it is opened
const digits = (seed: string, length: number) => {
  let hash = 2166136261
  let out = ''
  while (out.length < length) {
    for (const char of seed + out.length) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
    out += String(hash >>> 0)
  }
  return out.slice(0, length)
}

/**
 * The fiscal cheque soliq.uz keeps for a payment: seller, what was paid, the fiscal module and
 * sign, and the QR that opens the same cheque on ofd.soliq.uz.
 */
export function FiscalReceipt({ receipt }: { receipt: Receipt }) {
  const { t } = useI18n()
  const { seller, tin, title, amount, at, card, seed } = receipt
  const number = String(Number(digits(seed, 6)))
  const module = `UZ${digits(`${seed}fm`, 12)}`
  const sign = digits(`${seed}fs`, 12)
  const url = `https://ofd.soliq.uz/check?t=${module}&r=${number}&c=${at.getTime()}&s=${sign}`

  const rows: [string, string][] = [
    [t('receipt.number'), number],
    [t('receipt.date'), formatDateTime(at)],
    [t('receipt.paidBy'), card],
    [t('receipt.vat'), t('receipt.vat.none')],
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-card bg-surface p-4 text-sm">
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="font-bold">{seller}</span>
          <span className="text-xs text-ink-muted tabular-nums">
            {t('receipt.tin')}: {tin}
          </span>
        </div>
        <hr className="border-dashed border-line" />
        <div className="flex justify-between gap-3">
          <span className="min-w-0">{title}</span>
          <span className="shrink-0 font-semibold tabular-nums">{formatSum(amount)}</span>
        </div>
        <hr className="border-dashed border-line" />
        <dl className="flex flex-col gap-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="text-right tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-between gap-3 text-base font-bold">
          <span>{t('receipt.total')}</span>
          <span className="tabular-nums">{formatSum(amount)}</span>
        </div>
        <hr className="border-dashed border-line" />
        <div className="flex items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs">
            <span className="text-ink-muted">{t('receipt.module')}</span>
            <span className="font-semibold tabular-nums">{module}</span>
            <span className="text-ink-muted">{t('receipt.sign')}</span>
            <span className="font-semibold tabular-nums">{sign}</span>
          </div>
          <span className="shrink-0 rounded-lg bg-white p-1.5">
            <QRCodeSVG value={url} size={88} />
          </span>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex h-13 items-center justify-center gap-2 rounded-control border border-line bg-canvas font-semibold text-brand hover:bg-surface"
      >
        <ExternalLink size={18} />
        {t('receipt.open')}
      </a>
    </div>
  )
}
