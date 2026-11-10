import type { Workspace } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import type { ChatTopic } from './chats'

/**
 * A saved answer operators drop into a chat, written in both languages so it goes out in the
 * shopper's. `any` fits every topic; the others come first in chats of that topic.
 */
export type QuickReply = {
  id: string
  /** Whose operators use it: Birzum's, or a microloan brand's. */
  app: Workspace
  topic: ChatTopic | 'any'
  title: LocalizedText
  text: LocalizedText
}
