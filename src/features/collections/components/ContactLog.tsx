import { BellRing, PhoneCall } from 'lucide-react'
import type { Contact } from '@/entities/collections/contacts'
import { useI18n } from '@/shared/i18n/useI18n'
import { cn } from '@/shared/lib/cn'
import { startOfDay } from '@/shared/lib/dates'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/EmptyState'

/**
 * Calls and reminders with one shopper, newest first. A promise whose day has passed counts as
 * broken while the shopper still owes.
 */
export function ContactLog({
  contacts,
  today,
  owing,
}: {
  contacts: Contact[]
  today: Date
  owing: boolean
}) {
  const { t } = useI18n()
  if (contacts.length === 0) return <EmptyState title={t('contact.empty')} />
  return (
    <ol className="flex flex-col p-5">
      {contacts.map((contact) => {
        const Icon = contact.channel === 'call' ? PhoneCall : BellRing
        const broken = owing && !!contact.promiseDate && contact.promiseDate < startOfDay(today)
        return (
          <li key={contact.id} className="flex gap-3 pb-5 last:pb-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink-muted">
              <Icon size={18} />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-semibold">
                {contact.channel === 'call'
                  ? t(`contact.result.${contact.result ?? 'noAnswer'}`)
                  : t('contact.reminded')}
              </p>
              {contact.promiseDate && (
                <p className={cn('text-sm font-medium', broken ? 'text-danger' : 'text-success')}>
                  {t(broken ? 'contact.promiseBroken' : 'contact.promise', {
                    date: formatDate(contact.promiseDate),
                  })}
                </p>
              )}
              {contact.comment && <p className="text-sm">{contact.comment}</p>}
              <p className="text-sm text-ink-muted">
                {formatDateTime(contact.at)} · {contact.by}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
