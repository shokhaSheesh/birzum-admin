import { cn } from '@/shared/lib/cn'

type Props = {
  initials: string
  photoUrl?: string
  size?: 'md' | 'lg'
}

const sizes = { md: 'size-11 text-sm', lg: 'size-20 text-2xl' }

/** A person's photo, or their initials when there is none. */
export function Avatar({ initials, photoUrl, size = 'md' }: Props) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-navy-200 font-bold text-brand',
        sizes[size],
      )}
    >
      {photoUrl ? <img src={photoUrl} alt="" className="size-full object-cover" /> : initials}
    </span>
  )
}
