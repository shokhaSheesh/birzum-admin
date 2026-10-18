import { useState } from 'react'
import {
  BLOCK_REASONS,
  clientsStore,
  fullName,
  type BlockReason,
  type Client,
} from '@/entities/clients/clients'
import { useAdmin } from '@/entities/session/session'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'
import { logAction } from '@/entities/audit/audit'
import { clientPath } from '@/shared/config/routes'

const now = () => new Date()

/**
 * Blocks a shopper: a reason and a comment, both required. A blocked shopper can still sign in
 * and keep paying, but cannot start a new nasiya.
 */
export function BlockModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [reason, setReason] = useState<BlockReason>('fraud')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const block = () => {
    setSubmitted(true)
    if (!comment.trim()) return
    clientsStore.update(client.id, {
      block: { reason, comment: comment.trim(), at: now(), by: admin?.name ?? '—' },
    })
    toast(t('client.blocked'))
    logAction({
      section: 'customers',
      kind: 'update',
      action: 'audit.a.clientBlocked',
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
      title={t('client.block.title')}
      footer={
        <>
          <Button size="sm" variant="ghost" className="ml-auto px-4!" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" variant="danger" className="px-4!" onClick={block}>
            {t('client.block')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{t('client.block.hint')}</p>
      <SelectField
        label={t('client.block.reason')}
        options={BLOCK_REASONS.map((value) => ({
          value,
          label: t(`client.block.reason.${value}`),
        }))}
        value={reason}
        onChange={setReason}
      />
      <TextAreaField
        label={t('client.block.comment')}
        placeholder={t('client.block.comment.placeholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={submitted && !comment.trim() ? t('error.required') : undefined}
      />
    </Modal>
  )
}

/** Lifts a block, after a confirm. */
export function UnblockDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('client.unblock.title')}
      tone="primary"
      confirmLabel={t('client.unblock')}
      onConfirm={() => {
        clientsStore.update(client.id, { block: undefined })
        toast(t('client.unblocked'))
        logAction({
          section: 'customers',
          kind: 'update',
          action: 'audit.a.clientUnblocked',
          target: fullName(client),
          href: clientPath(client.id),
        })
        onClose()
      }}
    >
      <p>{t('client.unblock.message', { name: fullName(client) })}</p>
    </ConfirmDialog>
  )
}
