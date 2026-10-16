type Props = { label: string; value: string; hint?: string }

/** One figure at the top of a list page, e.g. "Faol merchantlar 3". */
export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-card border border-line bg-canvas p-4">
      <p className="truncate text-sm text-ink-muted">{label}</p>
      <p className="truncate text-2xl font-bold">{value}</p>
      {hint && <p className="truncate text-sm text-ink-subtle">{hint}</p>}
    </div>
  )
}
