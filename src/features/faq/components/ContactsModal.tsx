import { useState } from 'react'
import { contactsInfoStore, type SupportContacts } from '@/entities/faq/faq'
import { isComplete } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { PhoneField } from '@/shared/ui/PhoneField'
import { TextField } from '@/shared/ui/TextField'
import { logAction } from '@/entities/audit/audit'

/** Edit how shoppers reach support: the call-centre number, its hours and the Telegram account. */
export function ContactsModal({
  contacts,
  onClose,
}: {
  contacts: SupportContacts
  onClose: () => void
}) {
  const { t } = useI18n()
  const [phone, setPhone] = useState(contacts.phone)
  const [hours, setHours] = useState(contacts.hours)
  const [telegram, setTelegram] = useState(contacts.telegram)
  const [submitted, setSubmitted] = useState(false)
  const handle = telegram.trim().replace(/^@/, '')
  const errors = {
    phone: phone.length !== PHONE_DIGITS ? t('error.required') : undefined,
    telegram: !/^[a-zA-Z0-9_]{5,32}$/.test(handle) ? t('faq.contacts.telegram.error') : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (errors.phone || errors.telegram || !isComplete(hours)) return
    contactsInfoStore.update('contacts', {
      phone,
      hours: { uz: hours.uz.trim(), ru: hours.ru.trim() },
      telegram: handle,
    })
    toast(t('toast.saved'))
    logAction({ section: 'faq', kind: 'update', action: 'audit.a.contactsSaved' })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t('nav.faq')}
      title={t('faq.contacts')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" className="px-4!" onClick={save}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <PhoneField
        label={t('faq.contacts.phone')}
        value={phone}
        onChange={setPhone}
        error={submitted ? errors.phone : undefined}
      />
      <LocalizedTextField
        label={t('faq.contacts.hours')}
        placeholder={t('faq.contacts.hours.placeholder')}
        value={hours}
        onChange={setHours}
        requireBoth={submitted}
      />
      <TextField
        label="Telegram"
        placeholder="birzum_support"
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
        trailing={<span className="text-ink-subtle">t.me</span>}
        hint={t('faq.contacts.telegram.hint')}
        error={submitted ? errors.telegram : undefined}
      />
    </Modal>
  )
}
