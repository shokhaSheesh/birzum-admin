import { Bell } from 'lucide-react'
import type { Lang, LocalizedText } from '@/shared/i18n/dictionaries'
import logoMark from '@/shared/assets/logo-mark.svg'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

type Props = {
  lang: Lang
  title: LocalizedText
  body: LocalizedText
  image?: string
  /** "Birzum Biznes" for merchants, "Birzum" for shoppers, or a microloan brand. */
  appName: string
  /** The app's icon; Birzum's by default. */
  mark?: string
  /** What the app calls its news list: Yangiliklar in Birzum, Bildirishnomalar in the brands. */
  listLabel?: string
}

/**
 * How the broadcast will look on a phone, in one language: the push on the lock screen and
 * the item in the app's news list.
 */
export function PhonePreview({ lang, title, body, image, appName, mark, listLabel }: Props) {
  const { t } = useI18n()
  const heading = title[lang].trim() || t('broadcast.preview.title')
  const text = body[lang].trim() || t('broadcast.preview.body')
  const empty = !title[lang].trim() && !body[lang].trim()

  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col gap-3 rounded-[36px] border-[6px] border-navy-950 bg-gradient-to-b from-navy-700 to-navy-950 p-3 pt-8 shadow-xl">
      <p className="text-center text-3xl font-light text-white/90 tabular-nums">09:41</p>

      {/* Push on the lock screen */}
      <div
        className={cn(
          'flex gap-2.5 rounded-2xl bg-white/90 p-3 text-navy-950',
          empty && 'opacity-60',
        )}
      >
        <img src={mark ?? logoMark} alt="" className="size-8 shrink-0 rounded-lg bg-white p-1" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-2 text-[11px] text-navy-700">
            <span className="font-semibold uppercase">{appName}</span>
            <span>{t('broadcast.preview.now')}</span>
          </div>
          <p className="truncate text-[13px] font-semibold">{heading}</p>
          <p className="line-clamp-2 text-[13px] leading-snug">{text}</p>
        </div>
      </div>

      {/* The item in Yangiliklar */}
      <div className="flex flex-col overflow-hidden rounded-2xl bg-white text-navy-950">
        <p className="flex items-center gap-1.5 border-b border-navy-100 px-3 py-2 text-[11px] font-semibold text-navy-700">
          <Bell size={12} />
          {listLabel ?? t('broadcast.preview.news')}
        </p>
        {image && <img src={image} alt="" className="aspect-[2/1] w-full object-cover" />}
        <div className={cn('flex flex-col gap-1 p-3', empty && 'opacity-60')}>
          <p className="text-[13px] font-bold">{heading}</p>
          <p className="text-[12px] leading-snug text-navy-700">{text}</p>
        </div>
      </div>
    </div>
  )
}
