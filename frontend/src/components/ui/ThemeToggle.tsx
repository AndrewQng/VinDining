import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/useThemeStore'

export interface ThemeToggleProps {
  className?: string
}

/** Accessible light/dark theme toggle persisted to localStorage("vd-theme"). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-card text-ink-muted hover:text-ink hover:bg-card-hover transition-colors cursor-pointer',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  )
}
