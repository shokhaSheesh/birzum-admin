import { useEffect, useRef, useState } from 'react'
import { apiPost } from '@/shared/api/client'
import { getAdmin } from '@/entities/session/session'
import type { Workspace } from '@/shared/config/workspaces'

/**
 * The support chat's live signal (admin doc 5.15a, "Real vaqt"): the socket says only which chat
 * changed; the page reads it again over REST, which decides what this operator may see.
 */
export type ChatEvent =
  | { type: 'message' | 'updated'; chatId: string }
  /** The socket (re)connected: anything may have changed while it was down. */
  | { type: 'reconnected' }

type Wire = { type: string; chat_id?: string }

/**
 * Vercel's /api rewrite does not carry WebSockets, so the socket goes straight to the gateway.
 * VITE_SOCKET_URL overrides it (e.g. ws://localhost:8080 for a local gateway).
 */
const SOCKET_BASE =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'wss://api.birzumnasiya.uz'

const MAX_BACKOFF_MS = 30_000

/**
 * Keeps one socket open for the app's chats while mounted: a one-time ticket, then the socket;
 * after any close (the server ends every socket after an hour) it reconnects with a backoff of
 * 1 to 30 seconds. `live` is false while it is down, so the page polls faster meanwhile. The
 * sample panel has no backend and opens nothing.
 */
export function useChatEvents(app: Workspace, onEvent: (event: ChatEvent) => void) {
  const [live, setLive] = useState(false)
  const handler = useRef(onEvent)
  useEffect(() => {
    handler.current = onEvent
  })

  useEffect(() => {
    if (getAdmin()?.demo) return
    let socket: WebSocket | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false
    let attempt = 0
    let opened = false

    const retry = () => {
      setLive(false)
      if (stopped) return
      const wait = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt)
      attempt += 1
      timer = setTimeout(() => void connect(), wait)
    }

    const connect = async () => {
      let ticket: string
      try {
        ;({ ticket } = await apiPost<{ ticket: string }>(`/admin/apps/${app}/chats/socket-ticket`))
      } catch {
        retry()
        return
      }
      if (stopped) return

      socket = new WebSocket(
        `${SOCKET_BASE}/api/v1/ws/support?ticket=${encodeURIComponent(ticket)}`,
      )
      socket.onopen = () => {
        attempt = 0
        setLive(true)
        // The first open needs no reload: the page has just read everything
        if (opened) handler.current({ type: 'reconnected' })
        opened = true
      }
      socket.onmessage = (message) => {
        let data: Wire
        try {
          data = JSON.parse(String(message.data)) as Wire
        } catch {
          return
        }
        if ((data.type === 'message' || data.type === 'updated') && data.chat_id) {
          handler.current({ type: data.type, chatId: data.chat_id })
        }
      }
      socket.onclose = retry
    }

    void connect()
    return () => {
      stopped = true
      clearTimeout(timer)
      if (socket) {
        socket.onclose = null
        socket.close()
      }
    }
  }, [app])

  return live
}
