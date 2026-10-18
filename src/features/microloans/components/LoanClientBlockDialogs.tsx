import { useState } from 'react'
import { logAction } from '@/entities/audit/audit'
import {
  BLOCK_REASONS,
  loanClientsStore,
  type BlockReason,
  type LoanClient,
} from '@/entities/microloans/loanClients'
import { useAdmin } from '@/entities/session/session'
import { brandClientPath, WORKSPACE_INFO } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal'
import { SelectField } from '@/shared/ui/SelectField'
import { TextAreaField } from '@/shared/ui/TextAreaField'

const now = () => new Date()

/**
 * Blocks a client: a reason and a comment, both required. They can still sign in and pay what
 * they owe, but cannot send a new ariza.
 */
export function LoanClientBlockModal({
  client,
  onClose,
}: {
  client: LoanClient
  onClose: () => void
}) {
  const { t } = useI18n()
  const admin = useAdmin()
  const [reason, setReason] = useState<BlockReason>('fraud')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const block = () => {
    setSubmitted(true)
    if (!comment.trim()) return
    loanClientsStore.update(client.id, {
      block: { reason, comment: comment.trim(), at: now(), by: admin?.name ?? '—' },
    })
    toast(t('client.blocked'))
    logAction({
      section: 'mlClients',
      kind: 'update',
      action: 'audit.a.loanClientBlocked',
      params: { brand: WORKSPACE_INFO[client.brand].name },
      target: client.name,
      href: brandClientPath(client.brand, client.id),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={client.name}
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
      <p className="text-sm text-ink-muted">{t('mlClients.block.hint')}</p>
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
        rows={3}
        error={submitted && !comment.trim() ? t('error.required') : undefined}
      />
    </Modal>
  )
}

/** Lets a blocked client send arizalar again. */
export function LoanClientUnblockDialog({
  client,
  onClose,
}: {
  client: LoanClient
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('client.unblock.title')}
      tone="primary"
      confirmLabel={t('client.unblock')}
      onConfirm={() => {
        loanClientsStore.update(client.id, { block: undefined })
        toast(t('client.unblocked'))
        logAction({
          section: 'mlClients',
          kind: 'update',
          action: 'audit.a.loanClientUnblocked',
          params: { brand: WORKSPACE_INFO[client.brand].name },
          target: client.name,
          href: brandClientPath(client.brand, client.id),
        })
        onClose()
      }}
    >
      <p>{t('mlClients.unblock.message', { name: client.name })}</p>
    </ConfirmDialog>
  )
}
