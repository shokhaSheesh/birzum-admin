import type { PersonContact } from '@/entities/people/contacts'
import { useI18n } from '@/shared/i18n/useI18n'
import { formatPhone } from '@/shared/lib/phone'

/** The client's own contacts on a client page: who, relation and note, the phone on the right. */
export function PersonContacts({ contacts }: { contacts: PersonContact[] }) {
  const { t } = useI18n()
  if (contacts.length === 0) return <p className="text-sm text-ink-muted">{t('people.none')}</p>
  return (
    <ul className="flex flex-col">
      {contacts.map((contact) => (
        <li
          key={contact.phone}
          className="flex items-start justify-between gap-3 border-b border-line py-2.5 first:pt-0 last:border-b-0 last:pb-0"
        >
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{contact.name ?? t(`relation.${contact.relation}`)}</span>
            {contact.name && (
              <span className="text-sm text-ink-muted">{t(`relation.${contact.relation}`)}</span>
            )}
            {contact.comment && <span className="text-sm text-ink-muted">{contact.comment}</span>}
          </span>
          <a
            href={`tel:+998${contact.phone}`}
            className="text-sm font-medium whitespace-nowrap text-brand tabular-nums"
          >
            {formatPhone(contact.phone)}
          </a>
        </li>
      ))}
    </ul>
  )
}
