import { useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { bucketName, bucketTick, compactSum, niceCeil } from '@/shared/lib/chartAxis'
import { cn } from '@/shared/lib/cn'
import { formatSum } from '@/shared/lib/format'
import type { Bucket } from '@/shared/lib/period'

export type LineSeries = {
  key: string
  label: string
  /** A CSS colour, e.g. var(--color-brand). Marks only; text stays ink. */
  color: string
  /** One value per bucket; null where there is nothing yet (the future). */
  values: (number | null)[]
  /** Draw a faint wash under the line. One series at most. */
  area?: boolean
}

const H = 240

/** A smooth path through the points that never overshoots them (monotone cubic). */
function monotonePath(points: [number, number][]) {
  if (points.length < 2) return points.length ? `M${points[0][0]},${points[0][1]}` : ''
  const n = points.length
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0])
  const slope = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i])
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0]
    if (i === n - 1) return slope[n - 2]
    const a = slope[i - 1]
    const b = slope[i]
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b)
  })
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    d += ` C${x0 + h},${y0 + tangent[i] * h} ${x1 - h},${y1 - tangent[i + 1] * h} ${x1},${y1}`
  }
  return d
}

/**
 * Two or three money series over the period on one axis: 2px lines, a faint wash under the
 * lead series, solid hairline grid. Hovering or focusing a point shows a crosshair, a dot on
 * every line and one tooltip with all values. The legend sits above, so colour is never the
 * only cue.
 */
export function LineChart({
  buckets,
  series,
  now,
  label,
}: {
  buckets: Bucket[]
  series: LineSeries[]
  now: Date
  label: string
}) {
  const { t, lang } = useI18n()
  const [hovered, setActive] = useState<number | null>(null)
  const count = buckets.length
  // A hover from a longer period no longer exists after switching
  const active = hovered !== null && hovered < count ? hovered : null
  const top = niceCeil(Math.max(1, ...series.flatMap((s) => s.values.map((v) => v ?? 0))))
  const x = (i: number) => ((i + 0.5) / count) * 1000
  const y = (v: number) => H - (v / top) * H
  const unit = (key: 'mln' | 'mlrd', n: string) => t(`unit.${key}`, { n })

  // A line breaks where values stop (null), e.g. at today. Each run is a monotone curve:
  // smooth, but it never swings past a point, so it never dips below zero.
  const runsOf = (values: (number | null)[]) => {
    const runs: [number, number][][] = []
    values.forEach((v, i) => {
      if (v === null) return
      if (i === 0 || values[i - 1] === null) runs.push([])
      runs.at(-1)!.push([x(i), y(v)])
    })
    return runs
  }
  const pathOf = (values: (number | null)[]) => runsOf(values).map(monotonePath).join(' ')
  const areaOf = (values: (number | null)[]) =>
    runsOf(values)
      .map((run) => `${monotonePath(run)} L${run.at(-1)![0]},${H} L${run[0][0]},${H} Z`)
      .join(' ')
  const isNow = (bucket: Bucket) => now >= bucket.start && now < bucket.end
  const tipSide =
    active === null ? '' : active < count * 0.2 ? 'left' : active >= count * 0.8 ? 'right' : 'mid'

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label={label}>
        {series.map((s) => {
          const total = s.values.reduce<number>((sum, v) => sum + (v ?? 0), 0)
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              <span className="text-ink-muted">{s.label}</span>
              <span className="font-semibold tabular-nums">{formatSum(total)}</span>
            </li>
          )
        })}
      </ul>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="flex h-60 flex-col justify-between text-right text-xs text-ink-subtle tabular-nums">
          <span className="-translate-y-1/2">{compactSum(top, unit)}</span>
          <span>{compactSum(top / 2, unit)}</span>
          <span className="translate-y-1/2">0</span>
        </div>
        <div className="relative h-60" onMouseLeave={() => setActive(null)}>
          <div className="absolute inset-0 flex flex-col justify-between">
            <span className="border-t border-line" />
            <span className="border-t border-line" />
            <span className="border-t border-line" />
          </div>
          <svg
            viewBox={`0 0 1000 ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
          >
            {series
              .filter((s) => s.area)
              .map((s) => (
                <path key={s.key} d={areaOf(s.values)} fill={s.color} opacity={0.1} />
              ))}
            {series.map((s) => (
              <path
                key={s.key}
                d={pathOf(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {active !== null && (
            <>
              <span
                className="pointer-events-none absolute inset-y-0 w-px bg-navy-400"
                style={{ left: `${x(active) / 10}%` }}
              />
              {series.map((s) => {
                const v = s.values[active]
                return v === null ? null : (
                  <span
                    key={s.key}
                    className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas"
                    style={{
                      left: `${x(active) / 10}%`,
                      top: `${(y(v) / H) * 100}%`,
                      background: s.color,
                    }}
                  />
                )
              })}
              <div
                role="status"
                className={cn(
                  'pointer-events-none absolute top-0 z-10 flex flex-col gap-1 rounded-control border border-line bg-canvas px-3 py-2 text-sm whitespace-nowrap shadow-[0_8px_24px_-8px_rgb(7_42_60/0.35)]',
                  tipSide === 'left'
                    ? 'ml-3'
                    : tipSide === 'right'
                      ? '-ml-3 -translate-x-full'
                      : 'ml-3',
                )}
                style={{ left: `${x(active) / 10}%` }}
              >
                <span className="text-ink-muted tabular-nums">
                  {bucketName(buckets[active], lang)}
                </span>
                {series.map((s) => (
                  <span key={s.key} className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-ink-muted">{s.label}</span>
                    <span className="ml-auto pl-3 font-semibold tabular-nums">
                      {s.values[active] === null ? '—' : formatSum(s.values[active]!)}
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}
          <div className="absolute inset-0 flex">
            {buckets.map((bucket, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${bucketName(bucket, lang)}: ${series
                  .map((s) => `${s.label} ${s.values[i] === null ? '—' : formatSum(s.values[i]!)}`)
                  .join(', ')}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="h-full min-w-0 flex-1 focus-visible:outline-none"
              />
            ))}
          </div>
        </div>
        <span />
        <div className="flex pt-2 text-xs text-ink-subtle tabular-nums">
          {buckets.map((bucket, i) => (
            <span
              key={i}
              className={cn(
                'min-w-0 flex-1 text-center whitespace-nowrap',
                isNow(bucket) && 'font-bold text-ink',
              )}
            >
              {bucketTick(bucket, i, count, lang, now)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
