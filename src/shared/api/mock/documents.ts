import { BRAND_NAME, logMock } from './audit'
import { mockError, mockRoutes } from './index'
import { ACTOR, ago, asBody, invalid, nowIso, notFound } from './util'

type File = {
  name: string
  size_bytes: number
  url: string
  uploaded_at: string
  uploaded_by_name: string
  version: number
}
type Doc = {
  app: string
  kind: 'terms' | 'privacy' | 'offer'
  used_in: string[]
  file_uz: File | null
  file_ru: File | null
}

/** A one-page empty PDF, so a sample file opens in the viewer. */
const SAMPLE_PDF =
  'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUi9TaXplIDQ+PgolJUVPRg=='

const file = (name: string, size: number, daysAgo: number, by: string): File => ({
  name,
  size_bytes: size,
  url: SAMPLE_PDF,
  uploaded_at: ago(daysAgo),
  uploaded_by_name: by,
  version: 1,
})

const loanDocs = (app: string): Doc[] => [
  {
    app,
    kind: 'offer',
    used_in: ['signIn', 'contract'],
    file_uz: file(`${app}-ommaviy-oferta-uz.pdf`, 264_192, 50, 'Sardor Saidov'),
    file_ru: file(`${app}-publichnaya-oferta-ru.pdf`, 271_360, 50, 'Sardor Saidov'),
  },
  {
    app,
    kind: 'privacy',
    used_in: ['signIn'],
    file_uz: file(`${app}-maxfiylik-siyosati-uz.pdf`, 139_264, 50, 'Malika Rasulova'),
    // Vodiy has not uploaded the Russian file yet
    file_ru:
      app === 'vodiy'
        ? null
        : file(`${app}-politika-konfidencialnosti-ru.pdf`, 145_408, 50, 'Malika Rasulova'),
  },
]

const docs: Record<string, Doc[]> = {
  birzum: [
    {
      app: 'birzum',
      kind: 'terms',
      used_in: ['signIn'],
      file_uz: file('foydalanish-shartlari-uz.pdf', 184_320, 40, 'Sardor Saidov'),
      file_ru: file('usloviya-ispolzovaniya-ru.pdf', 192_512, 40, 'Sardor Saidov'),
    },
    {
      app: 'birzum',
      kind: 'privacy',
      used_in: ['signIn', 'checkout'],
      file_uz: file('maxfiylik-siyosati-uz.pdf', 151_552, 70, 'Malika Rasulova'),
      file_ru: file('politika-konfidencialnosti-ru.pdf', 158_720, 70, 'Malika Rasulova'),
    },
    {
      app: 'birzum',
      kind: 'offer',
      used_in: ['checkout'],
      file_uz: file('ommaviy-oferta-uz.pdf', 238_592, 70, 'Malika Rasulova'),
      // The Russian file has not been uploaded yet
      file_ru: null,
    },
  ],
  fortuna: loanDocs('fortuna'),
  vodiy: loanDocs('vodiy'),
}

const listOf = (app: string) => {
  const list = docs[app]
  if (!list) throw notFound()
  return list
}

mockRoutes(
  {
    method: 'GET',
    match: '/admin/apps/:app/documents',
    handle: ({ params }) => ({ items: listOf(params.app), total: listOf(params.app).length }),
  },
  {
    method: 'PUT',
    match: '/admin/apps/:app/documents/:kind/:lang',
    handle({ params, body }) {
      const doc = listOf(params.app).find((d) => d.kind === params.kind)
      if (
        !['terms', 'privacy', 'offer'].includes(params.kind) ||
        !['uz', 'ru'].includes(params.lang)
      ) {
        throw invalid({ kind: 'must be one of terms, privacy, offer' })
      }
      if (!doc) throw notFound()
      const input = asBody(body)
      const name = String(input.name ?? '').trim()
      const size = Number(input.size_bytes)
      if (!input.url || !name || name.length > 255) throw invalid({ url: 'is required' })
      if (!(size >= 1 && size <= 10_485_760)) {
        throw mockError(400, 'validation_failed', 'The file is too large')
      }
      const key = params.lang === 'uz' ? 'file_uz' : 'file_ru'
      doc[key] = {
        name,
        size_bytes: size,
        url: String(input.url),
        uploaded_at: nowIso(),
        uploaded_by_name: ACTOR.name,
        version: (doc[key]?.version ?? 0) + 1,
      }
      logMock({
        section: params.app === 'birzum' ? 'documents' : 'mlDocuments',
        kind: 'update',
        action: params.app === 'birzum' ? 'documentUploaded' : 'loanDocumentUploaded',
        target: name,
        entity: 'document',
        entityId: `${params.app}-${params.kind}`,
        company: params.app,
        params: params.app === 'birzum' ? {} : { brand: BRAND_NAME[params.app] },
      })
      return doc
    },
  },
  {
    method: 'POST',
    match: '/admin/files',
    handle({ form }) {
      const purpose = form?.get('purpose')
      const upload = form?.get('file')
      if (purpose !== 'image' && purpose !== 'document') {
        throw invalid({ purpose: 'must be one of image, document' })
      }
      if (!(upload instanceof Blob)) throw invalid({ file: 'is required' })
      if (upload.size === 0) throw invalid({ file: 'is empty' })
      const types = purpose === 'image' ? ['image/jpeg', 'image/png'] : ['application/pdf']
      if (!types.includes(upload.type))
        throw invalid({ file: 'has a type that is not allowed here' })
      if (upload.size > (purpose === 'image' ? 5 : 10) * 1_048_576) {
        throw invalid({ file: 'is too large' })
      }
      // The picture only lives in this tab, which is all a sample panel needs
      return {
        url: URL.createObjectURL(upload),
        name: upload instanceof File ? upload.name : 'file',
        size: upload.size,
      }
    },
  },
)
