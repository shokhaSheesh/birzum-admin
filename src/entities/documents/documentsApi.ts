import { apiGet, apiPut } from '@/shared/api/client'
import { createRemoteStore } from '@/shared/api/createRemoteStore'
import type { Workspace } from '@/shared/config/workspaces'
import type { Lang } from '@/shared/i18n/dictionaries'
import type { ConsentPlace, DocFile, DocumentId, LegalDoc } from './documents'

type ApiFile = {
  name: string
  size_bytes: number
  url: string
  uploaded_at: string
  uploaded_by_name: string
  version: number
}

type ApiDocument = {
  app: Workspace
  kind: DocumentId
  used_in: ConsentPlace[]
  file_uz: ApiFile | null
  file_ru: ApiFile | null
}

const toFile = (raw: ApiFile | null): DocFile | null =>
  raw && {
    name: raw.name,
    size: raw.size_bytes,
    url: raw.url,
    uploadedAt: new Date(raw.uploaded_at),
    uploadedBy: raw.uploaded_by_name,
    version: raw.version,
  }

const toDocument = (raw: ApiDocument): LegalDoc => ({
  id: `${raw.app}-${raw.kind}`,
  app: raw.app,
  doc: raw.kind,
  usedIn: raw.used_in,
  files: { uz: toFile(raw.file_uz), ru: toFile(raw.file_ru) },
})

const stores = new Map<Workspace, ReturnType<typeof createRemoteStore<LegalDoc>>>()

/** One app's documents, in the app's fixed order. */
export function documentsStoreOf(app: Workspace) {
  let store = stores.get(app)
  if (!store) {
    store = createRemoteStore<LegalDoc>(async () => {
      const data = await apiGet<{ items: ApiDocument[] }>(`/admin/apps/${app}/documents`)
      return data.items.map(toDocument)
    })
    stores.set(app, store)
  }
  return store
}

/** The PDF was uploaded with `POST /admin/files` (purpose document); this attaches it as a new version. */
export async function attachDocument(
  doc: LegalDoc,
  lang: Lang,
  file: { url: string; name: string; size: number },
) {
  await apiPut(`/admin/apps/${doc.app}/documents/${doc.doc}/${lang}`, {
    url: file.url,
    name: file.name,
    size_bytes: file.size,
  })
  await documentsStoreOf(doc.app).reload()
}
