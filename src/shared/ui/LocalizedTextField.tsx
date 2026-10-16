import { useState } from 'react'
import { LANGS, type Lang, type LocalizedText } from '@/shared/i18n/dictionaries'
import { withLang } from '@/shared/i18n/localized'
import { useI18n } from '@/shared/i18n/useI18n'
import { LangToggle } from './LangToggle'
import { TextAreaField } from './TextAreaField'
import { TextField } from './TextField'

type Props = {
  label: string
  value: LocalizedText
  onChange: (value: LocalizedText) => void
  /** Several lines, e.g. a description. */
  multiline?: boolean
  placeholder?: string
  /** Set after a failed save when the text is needed in every language. */
  requireBoth?: boolean
  /** Controls the language from outside, e.g. one toggle for a whole section. */
  lang?: Lang
  hideToggle?: boolean
}

/**
 * A text written once per language. Its own UZ / RU toggle sits beside the label, so only
 * the fields that really differ by language carry one.
 */
export function LocalizedTextField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  requireBoth,
  lang: outerLang,
  hideToggle,
}: Props) {
  const { t, lang: appLang } = useI18n()
  const [ownLang, setOwnLang] = useState<Lang>(appLang)
  const lang = outerLang ?? ownLang
  const missing = requireBoth ? LANGS.filter((l) => value[l].trim() === '') : []

  const shared = {
    label,
    placeholder,
    value: value[lang],
    error: missing.length > 0 ? t('error.bothLanguages') : undefined,
    labelEnd: hideToggle ? undefined : (
      <LangToggle value={lang} onChange={setOwnLang} missing={missing} />
    ),
  }

  return multiline ? (
    <TextAreaField {...shared} onChange={(e) => onChange(withLang(value, lang, e.target.value))} />
  ) : (
    <TextField
      {...shared}
      autoComplete="off"
      onChange={(e) => onChange(withLang(value, lang, e.target.value))}
    />
  )
}
