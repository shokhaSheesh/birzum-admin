import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { broadcastsStore, type Broadcast } from '@/entities/broadcasts/broadcasts'
import { useAdmin } from '@/entities/session/session'
import { broadcastEditPath, broadcastsPath } from '@/shared/config/routes'
import type { Workspace } from '@/shared/config/workspaces'
import { useI18n } from '@/shared/i18n/useI18n'
import { newId } from '@/shared/lib/createStore'
import { toast } from '@/shared/lib/toast'

/** Copy, cancel and delete, shared by the list and the detail page. */
export function useBroadcastActions(app: Workspace = 'birzum') {
  const navigate = useNavigate()
  const admin = useAdmin()
  const { t } = useI18n()
  const [cancelling, setCancelling] = useState<Broadcast | null>(null)
  const [deleting, setDeleting] = useState<Broadcast | null>(null)
  return {
    cancelling,
    deleting,
    close: () => {
      setCancelling(null)
      setDeleting(null)
    },
    askCancel: setCancelling,
    askDelete: setDeleting,
    /** A new draft with the same audience and text, opened for editing. */
    copy: (b: Broadcast) => {
      const id = newId()
      broadcastsStore.save({
        ...b,
        id,
        status: 'draft',
        sendAt: undefined,
        stats: undefined,
        createdAt: new Date(),
        createdBy: admin?.name ?? '—',
      })
      toast(t('broadcast.copied'))
      navigate(broadcastEditPath(id, app))
    },
    afterDelete: () => navigate(broadcastsPath(app)),
    app,
  }
}
