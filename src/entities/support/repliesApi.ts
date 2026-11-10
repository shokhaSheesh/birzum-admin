import { appResource } from '@/shared/api/appResource'
import type { Workspace } from '@/shared/config/workspaces'
import type { QuickReply } from './replies'

type ApiReply = {
  id: string
  app: Workspace
  topic: QuickReply['topic']
  title: QuickReply['title']
  text: QuickReply['text']
}
type ReplyInput = Pick<QuickReply, 'topic' | 'title' | 'text'>

/** Ready answers per app, oldest first; there is no order and no show/hide. */
export const repliesApi = appResource<QuickReply, ApiReply, ReplyInput>('quick-replies', {
  fromApi: (raw) => ({
    id: raw.id,
    app: raw.app,
    topic: raw.topic || 'any',
    title: raw.title,
    text: raw.text,
  }),
  toApi: (input) => ({ topic: input.topic, title: input.title, text: input.text }),
})
