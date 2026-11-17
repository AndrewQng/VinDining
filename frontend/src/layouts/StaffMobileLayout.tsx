import { useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, LayoutGrid, LogOut } from 'lucide-react'
import { STAFF_ROLE_LABELS } from '@/domain'
import { Button, ThemeToggle } from '@/components/ui'
import { cn } from '@/lib/utils'
import { authApi, serviceCallApi } from '@/services/api'
import { useRealtime } from '@/services/realtime'
import { useAuthStore } from '@/stores/useAuthStore'

/** Waitstaff smartphone shell with top bar, staff identity strip, and bottom navigation. */
export function StaffMobileLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const { data: activeCalls = [], refetch } = useQuery({
    queryKey: ['service-calls', 'active'],
    queryFn: () => serviceCallApi.getActive(),
    enabled: Boolean(user),
  })

  useRealtime('service-request:created', () => {
    void refetch()
  })
  useRealtime('service-request:completed', () => {
    void refetch()
  })

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      navigate('/dang-nhap', { replace: true, state: null })
      logout()
    }
  }, [logout, navigate])

  const roleLabel = user ? STAFF_ROLE_LABELS[user.role] : 'Phục vụ'

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col max-w-md mx-auto border-x border-line">
      <header className="sticky top-0 z-30 bg-surface border-b border-line px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-serif text-lg font-semibold text-accent">
            VinDining
          </span>
          <div className="flex items-center gap-2">
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
        </div>
        {user && (
          <div className="px-3 py-1.5 rounded-lg bg-card border border-line text-xs font-medium text-accent">
            {user.fullName} · {roleLabel}
          </div>
        )}
      </header>

      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Điều hướng phục vụ"
        className="fixed bottom-0 inset-x-0 z-30 max-w-md mx-auto bg-surface border-t border-line px-3 py-2 flex items-center justify-around gap-2"
      >
        <NavLink
          to="/phuc-vu"
          end
          className={({ isActive }) =>
            cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors',
              isActive
                ? 'bg-card border-primary/60 text-accent'
                : 'border-transparent text-ink-muted hover:text-ink'
            )
          }
        >
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          <span>Sơ đồ bàn</span>
        </NavLink>

        <NavLink
          to="/phuc-vu/thong-bao"
          className={({ isActive }) =>
            cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors',
              isActive
                ? 'bg-card border-primary/60 text-accent'
                : 'border-transparent text-ink-muted hover:text-ink'
            )
          }
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          <span>Thông báo</span>
          {activeCalls.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-danger text-on-danger text-[10px] font-semibold tabular-nums">
              {activeCalls.length}
            </span>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
