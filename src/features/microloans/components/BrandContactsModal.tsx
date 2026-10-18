import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import { brandContactsStore, type BrandContacts } from '@/entities/microloans/brandContacts'
import { brandPath, WORKSPACE_INFO } from '@/shared/config/workspaces'
import { isComplete } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { PHONE_DIGITS } from '@/shared/lib/phone'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { LocalizedTextField } from '@/shared/ui/LocalizedTextField'
import { Modal } from '@/shared/ui/Modal'
import { PhoneField } from '@/shared/ui/PhoneField'
import { TextField } from '@/shared/ui/TextField'

const HANDLE = /^[a-zA-Z0-9_.]{3,32}$/
const handleOf = (text: string) => text.trim().replace(/^@/, '')

/**
 * Edit how app users reach the brand: the main and an extra phone, email, website, Telegram and
 * Instagram (both optional), head office and hours in both languages.
 */
export function BrandContactsModal({
  contacts,
  onClose,
}: {
  contacts: BrandContacts
  onClose: () => void
}) {
  const { t } = useI18n()
  const [phone, setPhone] = useState(contacts.phones[0] ?? '')
  const [phone2, setPhone2] = useState(contacts.phones[1] ?? '')
  const [email, setEmail] = useState(contacts.email)
  const [website, setWebsite] = useState(contacts.website)
  const [telegram, setTelegram] = useState(contacts.telegram ?? '')
  const [instagram, setInstagram] = useState(contacts.instagram ?? '')
  const [address, setAddress] = useState(contacts.address)
  const [hours, setHours] = useState(contacts.hours)
  const [submitted, setSubmitted] = useState(false)
  const errors = {
    phone: phone.length !== PHONE_DIGITS ? t('error.required') : undefined,
    phone2: phone2 && phone2.length !== PHONE_DIGITS ? t('mlContacts.error.phone') : undefined,
    email: !/^\S+@\S+\.\S+$/.test(email.trim()) ? t('mlContacts.error.email') : undefined,
    website: !/^[\w.-]+\.[a-z]{2,}$/i.test(website.trim())
      ? t('mlContacts.error.website')
      : undefined,
    telegram:
      telegram.trim() && !HANDLE.test(handleOf(telegram))
        ? t('mlContacts.error.handle')
        : undefined,
    instagram:
      instagram.trim() && !HANDLE.test(handleOf(instagram))
        ? t('mlContacts.error.handle')
        : undefined,
  }

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || !isComplete(address) || !isComplete(hours)) return
    brandContactsStore.update(contacts.id, {
      phones: [phone, ...(phone2 ? [phone2] : [])],
      email: email.trim(),
      website: website.trim().replace(/^https?:\/\//, ''),
      telegram: handleOf(telegram) || undefined,
      instagram: handleOf(instagram) || undefined,
      address: { uz: address.uz.trim(), ru: address.ru.trim() },
      hours: { uz: hours.uz.trim(), ru: hours.ru.trim() },
    })
    toast(t('toast.saved'))
    logAction({
      section: 'mlContacts',
      kind: 'update',
      action: 'audit.a.loanContactsSaved',
      params: { brand: WORKSPACE_INFO[contacts.id].name },
      href: brandPath(contacts.id, 'contacts'),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      eyebrow={WORKSPACE_INFO[contacts.id].name}
      title={t('mlContacts.contacts')}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <PhoneField
          label={t('mlContacts.phone')}
          value={phone}
          onChange={setPhone}
          error={submitted ? errors.phone : undefined}
        />
        <PhoneField
          label={t('mlContacts.phone2')}
          value={phone2}
          onChange={setPhone2}
          hint={t('mlContacts.optional')}
          error={submitted ? errors.phone2 : undefined}
        />
        <TextField
          label={t('mlContacts.email')}
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={submitted ? errors.email : undefined}
        />
        <TextField
          label={t('mlContacts.website')}
          placeholder="fortunabiznes.uz"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          error={submitted ? errors.website : undefined}
        />
        <TextField
          label="Telegram"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          trailing={<span className="text-ink-subtle">t.me</span>}
          hint={t('mlContacts.optional')}
          error={submitted ? errors.telegram : undefined}
        />
        <TextField
          label="Instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          hint={t('mlContacts.optional')}
          error={submitted ? errors.instagram : undefined}
        />
      </div>
      <LocalizedTextField
        label={t('mlContacts.office')}
        value={address}
        onChange={setAddress}
        requireBoth={submitted}
      />
      <LocalizedTextField
        label={t('mlContacts.hours')}
        placeholder={t('faq.contacts.hours.placeholder')}
        value={hours}
        onChange={setHours}
        requireBoth={submitted}
      />
    </Modal>
  )
}
