import { Image as ImageIcon } from 'lucide-react'
import type { Slide } from '@/entities/onboarding/slides'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'

/** A slide's picture at the app's ratio, or a note that the app draws its own. */
export function SlideThumb({
  slide,
  className,
}: {
  slide: Pick<Slide, 'image' | 'builtIn'>
  className?: string
}) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'grid aspect-[280/230] w-full place-items-center overflow-hidden rounded-control bg-surface',
        className,
      )}
    >
      {slide.image ? (
        <img src={slide.image} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1.5 px-3 text-center text-xs text-ink-muted">
          <ImageIcon size={22} />
          {t(slide.builtIn ? 'slides.builtIn' : 'slides.noImage')}
        </span>
      )}
    </div>
  )
}
