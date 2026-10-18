import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { logAction } from '@/entities/audit/audit'
import { useI18n } from '@/shared/i18n/useI18n'
import type { Period } from '@/shared/lib/period'
import { usePeriodLabel } from '@/shared/lib/usePeriodLabel'
import { usePopover } from '@/shared/lib/usePopover'
import { toast } from '@/shared/lib/toast'
import { Button } from './Button'

const FORMATS = [
  { key: 'pdf', label: 'PDF', icon: FileText },
  { key: 'excel', label: 'Excel', icon: FileSpreadsheet },
] as const

/**
 * "Yuklab olish" with a choice of PDF (a report to send or print) or Excel (the rows, to work
 * with). It exports what the page shows for its period. The prototype makes no file: it only
 * says so and notes the export in the log.
 */
export function ExportMenu({ section, period }: { section: string; period: Period }) {
  const { t } = useI18n()
  const label = usePeriodLabel(period)
  const { open, setOpen, ref } = usePopover()

  const pick = (format: (typeof FORMATS)[number]) => {
    setOpen(false)
    logAction({
      section,
      kind: 'access',
      action: 'audit.a.exported',
      params: { format: format.label },
      target: label,
    })
    toast(t('export.sample', { format: format.label }))
  }

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        variant="secondary"
        className="border border-line bg-canvas! hover:bg-surface!"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Download size={18} />
        {t('export.button')}
        <ChevronDown size={16} className="text-ink-muted" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-2 w-72 rounded-card border border-line bg-canvas p-1.5 shadow-xl"
        >
          <p className="truncate px-3 pt-1.5 pb-2 text-xs font-semibold text-ink-muted">{label}</p>
          {FORMATS.map((format) => (
            <button
              key={format.key}
              type="button"
              role="menuitem"
              onClick={() => pick(format)}
              className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left hover:bg-surface"
            >
              <format.icon size={20} className="shrink-0 text-ink-muted" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{format.label}</span>
                <span className="text-xs text-ink-muted">{t(`export.${format.key}.hint`)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
