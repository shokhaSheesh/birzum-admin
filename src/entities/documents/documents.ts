import type { Brand, Workspace } from '@/shared/config/workspaces'
import type { Lang } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/** The documents an app links to; each is a file per language. Birzum's app has all three. */
export const DOCUMENT_IDS = ['terms', 'privacy', 'offer'] as const
export type DocumentId = (typeof DOCUMENT_IDS)[number]

/** Where the app asks people to agree to it; `contract`: signing a microloan. */
export type ConsentPlace = 'signIn' | 'checkout' | 'contract'

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
  id: string
  app: Workspace
  doc: DocumentId
  usedIn: ConsentPlace[]
  files: Record<Lang, DocFile | null>
}

const at = (month: number, day: number) => new Date(2026, month, day, 11)

// A brand's app shows the offer (agreed to at sign-in and again when signing the contract) and
// the privacy policy, each with its own file
const loanDocs = (brand: Brand, prefix: string): LegalDoc[] => [
  {
    id: `${brand}-offer`,
    app: brand,
    doc: 'offer',
    usedIn: ['signIn', 'contract'],
    files: {
      uz: {
        name: `${prefix}-ommaviy-oferta-uz.pdf`,
        size: 264_192,
        uploadedAt: at(8, 20),
        uploadedBy: 'Sardor Saidov',
      },
      ru: {
        name: `${prefix}-publichnaya-oferta-ru.pdf`,
        size: 271_360,
        uploadedAt: at(8, 20),
        uploadedBy: 'Sardor Saidov',
      },
    },
  },
  {
    id: `${brand}-privacy`,
    app: brand,
    doc: 'privacy',
    usedIn: ['signIn'],
    files: {
      uz: {
        name: `${prefix}-maxfiylik-siyosati-uz.pdf`,
        size: 139_264,
        uploadedAt: at(8, 20),
        uploadedBy: 'Malika Rasulova',
      },
      // Vodiy has not uploaded the Russian file yet
      ru:
        brand === 'vodiy'
          ? null
          : {
              name: `${prefix}-politika-konfidencialnosti-ru.pdf`,
              size: 145_408,
              uploadedAt: at(8, 20),
              uploadedBy: 'Malika Rasulova',
            },
    },
  },
]

// The files the apps show today. Replace with the API.
export const documentsStore = createStore<LegalDoc>([
  ...loanDocs('fortuna', 'fortuna'),
  ...loanDocs('vodiy', 'vodiy'),
  {
    id: 'terms',
    app: 'birzum',
    doc: 'terms',
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
    app: 'birzum',
    doc: 'privacy',
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
    app: 'birzum',
    doc: 'offer',
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
