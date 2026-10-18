import { useState } from 'react'
import { fullName, type Client } from '@/entities/clients/clients'
import { CONTACT_RESULTS, contactsStore, type ContactResult } from '@/entities/collections/contacts'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { parseDate, startOfDay } from '@/shared/lib/dates'
import { formatSum } from '@/shared/lib/format'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ChoiceGrid } from '@/shared/ui/ChoiceGrid'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DateField } from '@/shared/ui/DateField'
import { Modal } from '@/shared/ui/Modal'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { logAction } from '@/entities/audit/audit'
import { clientPath } from '@/shared/config/routes'

const now = () => new Date()

/** Writes down how a call with a debtor went; a promise needs the day they will pay by. */
export function CallResultModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [result, setResult] = useState<ContactResult>('promised')
  const [promise, setPromise] = useState('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const date = parseDate(promise)
  const dateError =
    result !== 'promised'
      ? undefined
      : !date
        ? t('error.required')
        : date < startOfDay(now())
          ? t('contact.error.pastDate')
          : undefined

  const save = () => {
    setSubmitted(true)
    if (dateError) return
    contactsStore.save({
      id: newId(),
      clientId: client.id,
      at: now(),
      by: admin?.name ?? '—',
      channel: 'call',
      result,
      promiseDate: result === 'promised' ? (date ?? undefined) : undefined,
      comment: comment.trim() || undefined,
    })
    toast(t('contact.saved'))
    logAction({
      section: 'collections',
      kind: 'update',
      action: 'audit.a.contactSaved',
      target: fullName(client),
      href: clientPath(client.id),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={fullName(client)}
      title={t('contact.call.title')}
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
      <ChoiceGrid
        label={t('contact.result')}
        columns={2}
        options={CONTACT_RESULTS.map((value) => ({
          value,
          label: t(`contact.result.${value}`),
        }))}
        value={result}
        onChange={setResult}
      />
      {result === 'promised' && (
        <DateField
          label={t('contact.promiseDate')}
          placeholder="dd.mm.yyyy"
          value={promise}
          onChange={setPromise}
          error={submitted ? dateError : undefined}
        />
      )}
      <TextAreaField
        label={t('contact.comment')}
        placeholder={t('contact.comment.placeholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
    </Modal>
  )
}

/** Sends the debtor an SMS and an app notification, after showing what it will say. */
export function ReminderDialog({
  client,
  overdue,
  days,
  onClose,
}: {
  client: Client
  overdue: number
  days: number
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('contact.remind.title')}
      tone="primary"
      confirmLabel={t('contact.remind.send')}
      onConfirm={() => {
        contactsStore.save({
          id: newId(),
          clientId: client.id,
          at: now(),
          by: admin?.name ?? '—',
          channel: 'reminder',
        })
        toast(t('contact.reminded'))
        logAction({
          section: 'collections',
          kind: 'update',
          action: 'audit.a.reminded',
          target: fullName(client),
          href: clientPath(client.id),
        })
        onClose()
      }}
    >
      <p>{t('contact.remind.message')}</p>
      <p className="mt-1 rounded-control bg-surface p-3 text-sm text-ink">
        {t('contact.remind.text', {
          name: client.firstName,
          sum: formatSum(overdue),
          days: String(days),
        })}
      </p>
    </ConfirmDialog>
  )
}
