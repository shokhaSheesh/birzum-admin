import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, THEMES, type Theme, type ThemeValue } from './context'

const STORAGE_KEY = 'birzum.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (THEMES.includes(stored as Theme)) return stored as Theme
  } catch {
    // storage unavailable, fall through to the default
  }
  return 'light'
}

/** Applies the chosen theme as `data-theme` on <html>, following the device when set to system. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      setTheme: (next) => {
        setThemeState(next)
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          // storage unavailable, the choice lasts for this session only
        }
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
