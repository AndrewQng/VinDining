import { create } from 'zustand'

export type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'vd-theme'

function readInitialTheme(): ThemeMode {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'light' || attr === 'dark') {
      return attr
    }
  }
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage quota / private mode errors
  }
}

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

/** Theme store synced to <html data-theme> and localStorage key "vd-theme". */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyThemeToDom(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    applyThemeToDom(next)
    set({ theme: next })
  },
}))
