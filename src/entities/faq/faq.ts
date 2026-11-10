import type { Workspace } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'

/** One question in an app's Savol-javoblar (Birzum's or a brand's); the list comes in the order people see it. */
export type Faq = {
  id: string
  app: Workspace
  question: LocalizedText
  answer: LocalizedText
  /** Hidden: kept here, not shown in the app. */
  visible: boolean
}

/** How shoppers reach support, shown under the questions in the app. */
export type SupportContacts = {
  id: 'contacts'
  phone: string
  hours: LocalizedText
  telegram: string
}
