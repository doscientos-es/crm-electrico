import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { applyTheme, getResolvedTheme, initializeTheme, saveTheme, type ThemePreference } from '../lib/theme'

type ThemeContextValue = {
  theme: ThemePreference
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>(() => initializeTheme())

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: getResolvedTheme(theme),
      setTheme,
      toggleTheme: () => setTheme((current) => (getResolvedTheme(current) === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}