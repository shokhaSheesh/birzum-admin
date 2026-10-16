import { ArrowUpRight, Store, Wallet } from 'lucide-react'
import { useI18n } from '@/shared/i18n/useI18n'

/**
 * The right half of the sign-in page: navy, with a few floating cards that hint at what the
 * panel shows. Hidden below 1024px, where the form takes the whole width.
 */
export function BrandPanel() {
  const { t } = useI18n()
  const bars = [38, 52, 44, 66, 58, 80, 72]

  return (
    <aside className="relative hidden w-[46%] max-w-[720px] overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <span
        aria-hidden
        className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-green-500/15"
      />
      <span aria-hidden className="absolute -bottom-40 -left-24 size-96 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-wider text-green-500 uppercase">
          Birzum Admin
        </p>
        <h2 className="max-w-md text-4xl leading-tight font-bold text-balance">
          {t('login.brand.title')}
        </h2>
        <p className="max-w-md text-white/70">{t('login.brand.text')}</p>
      </div>

      {/* Brand colours only, so the cards look the same in the light and dark theme */}
      <div aria-hidden className="relative flex flex-col gap-4">
        <div className="flex w-80 flex-col gap-4 rounded-card bg-white p-5 text-navy-950 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-navy-900/60">{t('login.brand.sales')}</p>
            <span className="flex items-center gap-0.5 rounded-full bg-green-300 px-2 py-0.5 text-xs font-bold text-navy-900/60">
              <ArrowUpRight size={14} />
              12%
            </span>
          </div>
          <p className="text-2xl font-bold">1 284 600 000 UZS</p>
          <div className="flex h-16 items-end gap-2">
            {bars.map((h, i) => (
              <span
                key={i}
                className={
                  i === 5 ? 'flex-1 rounded-t bg-navy-900' : 'flex-1 rounded-t bg-navy-900/15'
                }
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="ml-24 flex w-72 items-center gap-3 rounded-card bg-white p-4 text-navy-950 shadow-2xl">
          <span className="grid size-10 place-items-center rounded-full bg-green-300 text-navy-900">
            <Store size={20} />
          </span>
          <div className="flex flex-col">
            <p className="font-semibold">{t('login.brand.merchants')}</p>
            <p className="text-sm text-navy-900/60">Mediapark · iSpace · CA.store</p>
          </div>
        </div>
        <div className="flex w-64 items-center gap-3 rounded-card bg-white p-4 text-navy-950 shadow-2xl">
          <span className="grid size-10 place-items-center rounded-full bg-green-500 text-navy-950">
            <Wallet size={20} />
          </span>
          <div className="flex flex-col">
            <p className="font-semibold">{t('login.brand.payout')}</p>
            <p className="text-sm text-navy-900/60">56 832 000 UZS</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
