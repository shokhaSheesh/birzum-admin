import { broadcastsStore } from '@/entities/broadcasts/broadcasts'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import type { useBroadcastActions } from '../model/useBroadcastActions'
import { logAction } from '@/entities/audit/audit'

/** The confirms behind `useBroadcastActions`. */
export function BroadcastActions({
  cancelling,
  deleting,
  close,
  afterDelete,
  stay = true,
}: ReturnType<typeof useBroadcastActions> & { stay?: boolean }) {
  const { t, tl } = useI18n()
  return (
    <>
      <ConfirmDialog
        open={!!cancelling}
        onClose={close}
        title={t('broadcast.cancel.title')}
        confirmLabel={t('broadcast.cancel')}
        cancelLabel={t('broadcast.cancel.keep')}
        onConfirm={() => {
          if (cancelling) broadcastsStore.update(cancelling.id, { status: 'cancelled' })
          close()
          toast(t('broadcast.cancelled'))
          logAction({
            section: 'broadcasts',
            kind: 'update',
            action: 'audit.a.broadcastCancelled',
            target: cancelling ? tl(cancelling.title) : undefined,
          })
        }}
      >
        <p>{t('broadcast.cancel.message', { title: cancelling ? tl(cancelling.title) : '' })}</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={close}
        title={t('broadcast.delete.title')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deleting) broadcastsStore.remove(deleting.id)
          close()
          toast(t('broadcast.deleted'))
          logAction({
            section: 'broadcasts',
            kind: 'delete',
            action: 'audit.a.broadcastDeleted',
            target: deleting ? tl(deleting.title) : undefined,
          })
          if (!stay) afterDelete()
        }}
      >
        <p>{t('broadcast.delete.message')}</p>
      </ConfirmDialog>
    </>
  )
}
