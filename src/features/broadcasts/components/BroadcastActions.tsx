import { broadcastsStore } from '@/entities/broadcasts/broadcasts'
import { useI18n } from '@/shared/i18n/useI18n'
import { toast } from '@/shared/lib/toast'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import type { useBroadcastActions } from '../model/useBroadcastActions'

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
          if (!stay) afterDelete()
        }}
      >
        <p>{t('broadcast.delete.message')}</p>
      </ConfirmDialog>
    </>
  )
}
