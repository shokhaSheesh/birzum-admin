import { createContext } from 'react'
import type { Lang, LocalizedText, TranslationKey } from './dictionaries'

export type I18nValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  /** `params` fill `{name}` placeholders in the string. */
  t: (key: TranslationKey, params?: Record<string, string>) => string
  /** Picks the current language out of merchant-entered text, falling back to the other one. */
  tl: (text: LocalizedText) => string
}

export const I18nContext = createContext<I18nValue | null>(null)
