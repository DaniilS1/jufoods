'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'jufoods' | 'neutral'

interface ThemeContextValue {
  theme: Theme
  setTheme: (value: Theme) => void
  toggleTheme: () => void
  isMounted: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const DEFAULT_THEME: Theme = 'neutral'
const STORAGE_KEY = 'jufoods-theme'
const THEME_CLASSNAMES: Record<Theme, string> = {
  jufoods: 'theme-jufoods',
  neutral: 'theme-neutral',
}

function isValidTheme(value: unknown): value is Theme {
  return value === 'jufoods' || value === 'neutral'
}

function applyThemeClass(theme: Theme) {
  if (typeof window === 'undefined') {
    return
  }

  const root = window.document.documentElement

  Object.values(THEME_CLASSNAMES).forEach((name) => {
    root.classList.remove(name)
  })

  root.classList.add(THEME_CLASSNAMES[theme])
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedTheme = window.localStorage.getItem(storageKey)
    const initialTheme = isValidTheme(storedTheme) ? storedTheme : defaultTheme

    setThemeState(initialTheme)
    applyThemeClass(initialTheme)
    setIsMounted(true)
  }, [defaultTheme, storageKey])

  const persistAndApplyTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme)

      if (typeof window === 'undefined') {
        return
      }

      window.localStorage.setItem(storageKey, nextTheme)
      applyThemeClass(nextTheme)
    },
    [storageKey],
  )

  const toggleTheme = useCallback(() => {
    persistAndApplyTheme(theme === 'jufoods' ? 'neutral' : 'jufoods')
  }, [persistAndApplyTheme, theme])

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: persistAndApplyTheme,
      toggleTheme,
      isMounted,
    }),
    [isMounted, persistAndApplyTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

