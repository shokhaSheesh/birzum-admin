import { cn } from '@/shared/lib/cn'

/** A grey block that pulses while the real content is on its way. Shape it with classes. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-navy-100', className)} />
}

/** Stands in for a list card: rows with a round picture and two lines of text. */
export function SkeletonRows({ count = 6, avatar = true }: { count?: number; avatar?: boolean }) {
  return (
    <div role="status" aria-busy="true" className="rounded-card bg-surface px-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0"
        >
          {avatar && <Skeleton className="size-11 shrink-0 rounded-full bg-navy-200" />}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5 bg-navy-200" />
            <Skeleton className="h-3 w-2/5 bg-navy-200" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0 bg-navy-200" />
        </div>
      ))}
    </div>
  )
}

/** Stands in for a two-column grid of product cards. */
export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="grid grid-cols-2 gap-x-3 gap-y-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-card" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Stands in for a stack of cards, such as the shopper's purchases. */
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-card bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-2/5 bg-navy-200" />
            <Skeleton className="h-5 w-24 rounded-full bg-navy-200" />
          </div>
          <Skeleton className="h-3 w-3/5 bg-navy-200" />
          <Skeleton className="h-3 w-4/5 bg-navy-200" />
        </div>
      ))}
    </div>
  )
}

/** Stands in for a detail screen: a title, a card of label and value rows, then a block. */
export function SkeletonDetail() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-7 w-3/5" />
      </div>
      <div className="rounded-card bg-surface px-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex justify-between gap-4 border-b border-line py-3.5 last:border-b-0"
          >
            <Skeleton className="h-4 w-1/3 bg-navy-200" />
            <Skeleton className="h-4 w-1/4 bg-navy-200" />
          </div>
        ))}
      </div>
      <Skeleton className="h-13 w-full rounded-control" />
      <Skeleton className="h-32 w-full rounded-card" />
    </div>
  )
}
