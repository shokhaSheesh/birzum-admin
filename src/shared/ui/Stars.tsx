import { Star } from 'lucide-react'

/**
 * Five stars filled up to the rating, partly filling the last one (4,5 shows four and a half),
 * in the same amber as the client app.
 */
export function Stars({
  rating,
  size = 16,
  label,
}: {
  rating: number
  size?: number
  label: string
}) {
  return (
    <span role="img" aria-label={label} className="flex shrink-0 items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, rating - (n - 1)))
        return (
          <span key={n} className="relative" style={{ width: size, height: size }}>
            <Star size={size} aria-hidden className="absolute fill-navy-100 text-navy-200" />
            {fill > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} aria-hidden className="fill-warning text-warning" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
