import { useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, LayoutGrid, LogOut } from 'lucide-react'
import { SERVICE_REQUEST_TYPE_LABELS, STAFF_ROLE_LABELS } from '@/domain'
import { Button, ThemeToggle } from '@/components/ui'
import { cn } from '@/lib/utils'
import { authApi, serviceCallApi, tableApi } from '@/services/api'
import { useRealtime } from '@/services/realtime'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToastStore } from '@/stores/useToastStore'
import { useWaitstaffNotificationsStore } from '@/stores/useWaitstaffNotificationsStore'

/** Waitstaff smartphone shell with top bar, staff identity strip, realtime notifications, and bottom navigation. */
export function StaffMobileLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const pushToast = useToastStore((s) => s.push)
  const alerts = useWaitstaffNotificationsStore((s) => s.alerts)
  const pushAlert = useWaitstaffNotificationsStore((s) => s.pushAlert)

  const { data: activeCalls = [], refetch: refetchCalls } = useQuery({
    queryKey: ['service-calls', 'active'],
    queryFn: () => serviceCallApi.getActive(),
    enabled: Boolean(user),
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAll(),
    enabled: Boolean(user),
  })

  const resolveTableNumber = useCallback(
    (tableId: string) =>
      tables.find((t) => t.id === tableId)?.tableNumber ?? tableId,
    [tables]
  )

  useRealtime('service-request:created', (payload) => {
    void refetchCalls()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(200)
    }
    pushToast({
      variant: 'warning',
      title: `Bàn ${payload.tableNumber} · Yêu cầu mới`,
      description: SERVICE_REQUEST_TYPE_LABELS[payload.requestType],
    })
  })

  useRealtime('service-request:completed', () => {
    void refetchCalls()
  })

  useRealtime('item:served', (payload) => {
    const tableNumber = resolveTableNumber(payload.tableId)
    pushAlert({
      kind: 'pass-ready',
      tableId: payload.tableId,
      tableNumber,
      itemName: payload.itemName,
    })
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(200)
    }
    pushToast({
      variant: 'success',
      title: `Quầy Pass · Bàn ${tableNumber}`,
      description: `${payload.itemName} đã sẵn sàng tại quầy Pass.`,
    })
    void queryClient.invalidateQueries({ queryKey: ['table', payload.tableId] })
    void queryClient.invalidateQueries({ queryKey: ['order', payload.tableId] })
  })

  useRealtime('item:remake-requested', (payload) => {
    const tableNumber = resolveTableNumber(payload.tableId)
    pushAlert({
      kind: 'remake',
      tableId: payload.tableId,
      tableNumber,
      itemName: payload.itemName,
    })
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(200)
    }
    pushToast({
      variant: 'warning',
      title: `Quầy Pass · Làm lại món`,
      description: `Bàn ${tableNumber} · ${payload.itemName} đang được làm lại.`,
    })
    void queryClient.invalidateQueries({ queryKey: ['table', payload.tableId] })
    void queryClient.invalidateQueries({ queryKey: ['order', payload.tableId] })
  })

  useRealtime('table:status-changed', (payload) => {
    void queryClient.invalidateQueries({ queryKey: ['tables'] })
    void queryClient.invalidateQueries({ queryKey: ['table', payload.tableId] })
  })

  useRealtime('order:updated', (payload) => {
    void queryClient.invalidateQueries({ queryKey: ['tables'] })
    void queryClient.invalidateQueries({ queryKey: ['table', payload.tableId] })
    void queryClient.invalidateQueries({ queryKey: ['order', payload.tableId] })
  })

  useRealtime('course:activated', (payload) => {
    void queryClient.invalidateQueries({ queryKey: ['table', payload.tableId] })
    void queryClient.invalidateQueries({ queryKey: ['order', payload.tableId] })
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
  const unreadCount =
    activeCalls.length + alerts.filter((a) => !a.acknowledged).length

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col max-w-md mx-auto border-x border-line">
      <header className="sticky top-0 z-30 bg-surface border-b border-line px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-serif text-lg font-semibold text-accent">
            VinDining
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle className="w-11 h-11" />
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[44px]"
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
              'flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors',
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
              'flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors',
              isActive
                ? 'bg-card border-primary/60 text-accent'
                : 'border-transparent text-ink-muted hover:text-ink'
            )
          }
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <span
              data-testid="waitstaff-unread-badge"
              className="px-1.5 py-0.5 rounded-full bg-danger text-on-danger text-[10px] font-semibold tabular-nums"
            >
              {unreadCount}
            </span>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
