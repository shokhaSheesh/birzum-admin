import { cn } from '@/shared/lib/cn'

/** A top tile as the app draws it: the cover, or the brand colour, with the title on it. */
export function TileThumb({
  image,
  title,
  className,
}: {
  image?: string
  title: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative flex size-20 shrink-0 items-end overflow-hidden rounded-xl bg-primary p-1.5 text-left',
        className,
      )}
    >
      {image && <img src={image} alt="" className="absolute inset-0 size-full object-cover" />}
      <span className="relative line-clamp-2 text-[11px] leading-tight font-bold text-white drop-shadow">
        {title}
      </span>
    </span>
  )
}
