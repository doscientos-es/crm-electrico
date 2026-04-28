export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_KEY = 'crm-electrico-theme-v1'

function isBrowser() {
  return typeof window !== 'undefined'
}

function getSystemTheme() {
  if (!isBrowser()) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getResolvedTheme(theme: ThemePreference) {
  return theme === 'system' ? getSystemTheme() : theme
}

export function readStoredTheme(): ThemePreference {
  if (!isBrowser()) return 'system'

  const stored = window.localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

export function applyTheme(theme: ThemePreference) {
  if (!isBrowser()) return

  const resolvedTheme = getResolvedTheme(theme)
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.style.colorScheme = resolvedTheme
}

export function saveTheme(theme: ThemePreference) {
  if (!isBrowser()) return

  window.localStorage.setItem(THEME_KEY, theme)
}

export function initializeTheme() {
  const theme = readStoredTheme()
  applyTheme(theme)
  return theme
}