import type { AuditKind } from '@/entities/audit/audit'
import { useI18n } from '@/shared/i18n/useI18n'
import { StatusBadge, type StatusTone } from '@/shared/ui/StatusBadge'

const tones: Record<AuditKind, StatusTone> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  money: 'warning',
  access: 'neutral',
}

/** Yaratish · Tahrirlash · Oʻchirish · Pul · Kirish, each in its own colour. */
export function AuditKindBadge({ kind }: { kind: AuditKind }) {
  const { t } = useI18n()
  return <StatusBadge tone={tones[kind]}>{t(`audit.kind.${kind}`)}</StatusBadge>
}
