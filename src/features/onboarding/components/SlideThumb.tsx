import { Image as ImageIcon } from 'lucide-react'
import type { Slide } from '@/entities/onboarding/slides'
import type { Lang } from '@/shared/i18n/dictionaries'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

/**
 * A slide's picture at the app's ratio, in the given language (the panel's by default), or a
 * note that the app draws its own.
 */
export function SlideThumb({
  slide,
  lang: wanted,
  className,
}: {
  slide: Pick<Slide, 'image' | 'builtIn'>
  lang?: Lang
  className?: string
}) {
  const { t, lang: panelLang } = useI18n()
  const src = slide.image?.[wanted ?? panelLang]
  return (
    <div
      className={cn(
        'grid aspect-[280/230] w-full place-items-center overflow-hidden rounded-control bg-surface',
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1.5 px-3 text-center text-xs text-ink-muted">
          <ImageIcon size={22} />
          {t(
            slide.builtIn && !slide.image?.uz && !slide.image?.ru
              ? 'slides.builtIn'
              : 'slides.noImage',
          )}
        </span>
      )}
    </div>
  )
}
