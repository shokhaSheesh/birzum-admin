import { Image as ImageIcon } from 'lucide-react'
import type { Banner } from '@/entities/onboarding/banners'
import type { Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

/** A banner's picture at the app's ratio, in the given language, or a note that the app draws it. */
export function BannerThumb({
  banner,
  lang: wanted,
  className,
}: {
  banner: Pick<Banner, 'image' | 'builtIn'>
  lang?: Lang
  className?: string
}) {
  const { t, lang: panelLang } = useI18n()
  const src = banner.image?.[wanted ?? panelLang]
  return (
    <div
      className={cn(
        'grid aspect-[127/60] w-full place-items-center overflow-hidden rounded-control bg-surface',
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1 px-3 text-center text-xs text-ink-muted">
          <ImageIcon size={20} />
          {t(
            banner.builtIn && !banner.image?.uz && !banner.image?.ru
              ? 'banners.builtIn'
              : 'slides.noImage',
          )}
        </span>
      )}
    </div>
  )
}
