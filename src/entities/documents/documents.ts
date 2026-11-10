import type { Workspace } from '@/shared/config/workspaces'
import type { Lang } from '@/shared/i18n/dictionaries'

/** The documents an app links to; each is a file per language. Birzum's app has all three. */
export const DOCUMENT_IDS = ['terms', 'privacy', 'offer'] as const
export type DocumentId = (typeof DOCUMENT_IDS)[number]

/** Where the app asks people to agree to it; `contract`: signing a microloan. */
export type ConsentPlace = 'signIn' | 'checkout' | 'contract'

/** An uploaded file. */
export type DocFile = {
  name: string
  /** Bytes. */
  size: number
  url: string
  uploadedAt: Date
  uploadedBy: string
  version: number
}

export type LegalDoc = {
  /** `<app>-<kind>`: the backend has no id, a document is its app and kind. */
  id: string
  app: Workspace
  doc: DocumentId
  usedIn: ConsentPlace[]
  files: Record<Lang, DocFile | null>
}
