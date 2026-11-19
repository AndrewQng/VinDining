import { useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { STAFF_ROLE_LABELS } from '@/domain'
import { Button, ThemeToggle } from '@/components/ui'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'

/** Expediter tablet landscape shell for the Kitchen Pass station. */
export function StaffTabletLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      navigate('/dang-nhap', { replace: true, state: null })
      logout()
    }
  }, [logout, navigate])

  const roleLabel = user ? STAFF_ROLE_LABELS[user.role] : 'Điều phối'

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="sticky top-0 z-30 bg-surface border-b border-line px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-lg font-semibold text-accent">
            VinDining
          </span>
          <span className="text-line-strong" aria-hidden="true">
            |
          </span>
          <p className="text-sm font-medium text-ink truncate">
            Quầy Pass{user ? ` · ${user.fullName} · ${roleLabel}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle />
          <Button
            variant="secondary"
            size="sm"
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </header>

      <main className="flex-1 p-5 sm:p-6 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
