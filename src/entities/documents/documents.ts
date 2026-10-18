import type { Lang } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The documents the client app links to; each is a file per language. */
export const DOCUMENT_IDS = ['terms', 'privacy', 'offer'] as const
export type DocumentId = (typeof DOCUMENT_IDS)[number]

/** Where the client app asks shoppers to agree to it. */
export type ConsentPlace = 'signIn' | 'checkout'

/** An uploaded file. `url` is set for files uploaded in this session; samples have none. */
export type DocFile = {
  name: string
  /** Bytes. */
  size: number
  url?: string
  uploadedAt: Date
  uploadedBy: string
}

export type LegalDoc = {
  id: DocumentId
  usedIn: ConsentPlace[]
  files: Record<Lang, DocFile | null>
}

const at = (month: number, day: number) => new Date(2026, month, day, 11)

// The files the client app shows today. Replace with the API.
export const documentsStore = createStore<LegalDoc>([
  {
    id: 'terms',
    usedIn: ['signIn'],
    files: {
      uz: {
        name: 'foydalanish-shartlari-uz.pdf',
        size: 184_320,
        uploadedAt: at(9, 1),
        uploadedBy: 'Sardor Saidov',
      },
      ru: {
        name: 'usloviya-ispolzovaniya-ru.pdf',
        size: 192_512,
        uploadedAt: at(9, 1),
        uploadedBy: 'Sardor Saidov',
      },
    },
  },
  {
    id: 'privacy',
    usedIn: ['signIn', 'checkout'],
    files: {
      uz: {
        name: 'maxfiylik-siyosati-uz.pdf',
        size: 151_552,
        uploadedAt: at(8, 1),
        uploadedBy: 'Malika Rasulova',
      },
      ru: {
        name: 'politika-konfidencialnosti-ru.pdf',
        size: 158_720,
        uploadedAt: at(8, 1),
        uploadedBy: 'Malika Rasulova',
      },
    },
  },
  {
    id: 'offer',
    usedIn: ['checkout'],
    files: {
      uz: {
        name: 'ommaviy-oferta-uz.pdf',
        size: 238_592,
        uploadedAt: at(8, 1),
        uploadedBy: 'Malika Rasulova',
      },
      // The Russian file has not been uploaded yet
      ru: null,
    },
  },
])
