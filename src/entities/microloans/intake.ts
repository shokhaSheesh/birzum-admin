import type { Brand } from '@/shared/config/workspaces'
import type { LocalizedText } from '@/shared/i18n/dictionaries'
import { createStore } from '@/shared/lib/createStore'

/**
 * Whether a brand's app takes new arizalar. While paused, the app shows `message` instead of the
 * Qarz olish form; borrowers still see and pay their loans, and arizalar already sent go on.
 */
export type Intake = {
  id: Brand
  open: boolean
  message: LocalizedText
  /** When and by whom it was last switched. */
  since?: Date
  by?: string
}

export const DEFAULT_PAUSE_MESSAGE: LocalizedText = {
  uz: 'Yangi arizalar qabuli vaqtincha toʻxtatildi. Tez orada qayta ochamiz.',
  ru: 'Приём новых заявок временно приостановлен. Скоро откроем снова.',
}

// Both brands take arizalar today. Replace with the API.
export const intakeStore = createStore<Intake>([
  { id: 'fortuna', open: true, message: DEFAULT_PAUSE_MESSAGE },
  { id: 'vodiy', open: true, message: DEFAULT_PAUSE_MESSAGE },
])
