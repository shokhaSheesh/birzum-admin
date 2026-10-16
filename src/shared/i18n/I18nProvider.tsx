import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nValue } from './context'
import { dictionaries, LANGS, type Lang } from './dictionaries'

const STORAGE_KEY = 'birzum.lang'

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (LANGS.includes(stored as Lang)) return stored as Lang
  } catch {
    // storage unavailable, fall through to the default
  }
  return 'uz'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next)
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          // storage unavailable, the choice lasts for this session only
        }
      },
      t: (key, params) =>
        dictionaries[lang][key].replace(/\{(\w+)\}/g, (match, name) => params?.[name] ?? match),
      tl: (text) => text[lang] || text.uz || text.ru,
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
