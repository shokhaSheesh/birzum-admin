import { apiGet, apiPost } from '@/shared/api/client'
import type { Workspace } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'

export type ChatBox = 'queue' | 'mine' | 'open' | 'closed'
export type Staff = { id: string; name: string }

/** A chat as the list shows it (`GET /admin/apps/:app/chats`). */
export type ChatRow = {
  id: string
  client: { id: string; name: string; phone: string }
  /** A code from `chat-topics`. */
  topic: string
  status: 'open' | 'closed'
  lastMessage: {
    from: 'client' | 'operator' | 'note' | 'system'
    text: string
    hasImage: boolean
    at: Date
  } | null
  unread: number
  assignee: Staff | null
  updatedAt: Date
}

export type ChatLine = {
  id: string
  kind: 'client' | 'operator' | 'note' | 'system'
  /** For a system line: took, handed, closed, reopened. */
  key?: 'took' | 'handed' | 'closed' | 'reopened'
  targetName?: string
  text: string
  images: string[]
  author: Staff | null
  at: Date
}

export type ChatDetail = ChatRow & { messages: ChatLine[] }

type ApiRow = Omit<ChatRow, 'lastMessage' | 'updatedAt'> & {
  last_message: {
    from: 'client' | 'operator' | 'note' | 'system'
    text: string
    has_image: boolean
    at: string
  } | null
  updated_at: string
}
type ApiLine = Omit<ChatLine, 'at' | 'targetName'> & { at: string; target_name?: string }

const toRow = (raw: ApiRow): ChatRow => ({
  id: raw.id,
  client: raw.client,
  topic: raw.topic,
  status: raw.status,
  lastMessage: raw.last_message && {
    from: raw.last_message.from,
    text: raw.last_message.text,
    hasImage: raw.last_message.has_image,
    at: new Date(raw.last_message.at),
  },
  unread: raw.unread,
  assignee: raw.assignee,
  updatedAt: new Date(raw.updated_at),
})

const path = (app: Workspace, rest = '') => `/admin/apps/${app}/chats${rest}`

export async function loadChats(
  app: Workspace,
  query: { box: ChatBox; q: string; limit?: number },
) {
  const data = await apiGet<{
    items: ApiRow[]
    total: number
    counts: Record<ChatBox, number>
  }>(path(app), { box: query.box, q: query.q, page: 1, limit: query.limit ?? 100 })
  return { items: data.items.map(toRow), total: data.total, counts: data.counts }
}

export async function loadChat(app: Workspace, id: string): Promise<ChatDetail> {
  const raw = await apiGet<ApiRow & { messages: ApiLine[] }>(path(app, `/${id}`))
  return {
    ...toRow(raw),
    messages: raw.messages.map((line) => ({
      id: line.id,
      kind: line.kind,
      key: line.key,
      targetName: line.target_name,
      text: line.text,
      images: line.images ?? [],
      author: line.author,
      at: new Date(line.at),
    })),
  }
}

export const markChatRead = (app: Workspace, id: string) => apiPost(path(app, `/${id}/read`))
/** A 409 `chat_taken` means someone else got there first. */
export const takeChat = (app: Workspace, id: string) => apiPost(path(app, `/${id}/take`))
export const assignChat = (app: Workspace, id: string, staffId: string) =>
  apiPost(path(app, `/${id}/assign`), { staff_id: staffId })
export const closeChat = (app: Workspace, id: string) => apiPost(path(app, `/${id}/close`))
export const reopenChat = (app: Workspace, id: string) => apiPost(path(app, `/${id}/reopen`))
export const sendChatMessage = (
  app: Workspace,
  id: string,
  message: { kind: 'reply' | 'note'; text: string; images: string[] },
) => apiPost(path(app, `/${id}/messages`), message)

export async function loadOperators(app: Workspace) {
  return (await apiGet<{ items: Staff[] }>(path(app, '/operators'))).items
}

export async function loadTopics(app: Workspace) {
  return (
    await apiGet<{ items: { code: string; label: LocalizedText }[] }>(
      `/admin/apps/${app}/chat-topics`,
    )
  ).items
}
