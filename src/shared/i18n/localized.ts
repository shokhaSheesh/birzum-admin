import { LANGS, type Lang, type LocalizedText } from './dictionaries'

export const emptyText = (): LocalizedText => ({ uz: '', ru: '' })

export const withLang = (text: LocalizedText, lang: Lang, value: string): LocalizedText => ({
  ...text,
  [lang]: value,
})

/** True when the text is filled in for every language. */
export const isComplete = (text: LocalizedText) => LANGS.every((lang) => text[lang].trim() !== '')

export const isBlank = (text: LocalizedText) => LANGS.every((lang) => text[lang].trim() === '')

/** Copies the filled language into any empty one, and trims. */
export function fillMissing(text: LocalizedText): LocalizedText {
  const fallback = LANGS.map((lang) => text[lang].trim()).find((value) => value !== '') ?? ''
  return { uz: text.uz.trim() || fallback, ru: text.ru.trim() || fallback }
}

/** The first language a text is missing in, if any. Used to jump to it on a failed save. */
export const missingLang = (texts: LocalizedText[]): Lang | undefined =>
  LANGS.find((lang) => texts.some((text) => text[lang].trim() === ''))
