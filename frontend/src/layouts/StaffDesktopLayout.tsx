import { useCallback, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CheckCircle2,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Receipt,
  RotateCcw,
  Users,
  Utensils,
} from 'lucide-react'
import { STAFF_ROLE_LABELS } from '@/domain'
import { Button, Drawer, ThemeToggle, Wordmark } from '@/components/ui'
import { cn } from '@/lib/utils'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'

export interface StaffDesktopLayoutProps {
  area: 'cashier' | 'manager'
}

interface NavEntry {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const CASHIER_NAV: NavEntry[] = [
  {
    to: '/thu-ngan',
    label: 'Hàng chờ thanh toán',
    icon: <Receipt className="w-4 h-4" />,
    end: true,
  },
  {
    to: '/thu-ngan/check-in',
    label: 'Check-in khách',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  {
    to: '/thu-ngan/hoa-don',
    label: 'Hóa đơn hôm nay',
    icon: <FileText className="w-4 h-4" />,
  },
]

const MANAGER_NAV: NavEntry[] = [
  {
    to: '/quan-ly',
    label: 'Thực đơn',
    icon: <Utensils className="w-4 h-4" />,
    end: true,
  },
  {
    to: '/quan-ly/so-do-ban',
    label: 'Sơ đồ bàn',
    icon: <LayoutGrid className="w-4 h-4" />,
  },
  {
    to: '/quan-ly/hoan-coc',
    label: 'Duyệt hoàn cọc',
    icon: <RotateCcw className="w-4 h-4" />,
  },
  {
    to: '/quan-ly/tai-khoan',
    label: 'Tài khoản nhân viên',
    icon: <Users className="w-4 h-4" />,
  },
  {
    to: '/quan-ly/bao-cao',
    label: 'Báo cáo',
    icon: <BarChart3 className="w-4 h-4" />,
  },
]

/** Desktop workspace shell with sidebar navigation for Cashier and Manager areas. */
export function StaffDesktopLayout({ area }: StaffDesktopLayoutProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = area === 'cashier' ? CASHIER_NAV : MANAGER_NAV
  const subtitle =
    area === 'cashier' ? 'HỆ THỐNG THU NGÂN' : 'HỆ THỐNG QUẢN LÝ'
  const roleLabel = user ? STAFF_ROLE_LABELS[user.role] : ''

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      navigate('/dang-nhap', { replace: true, state: null })
      logout()
    }
  }, [logout, navigate])

  const navList = (onNavigate?: () => void) => (
    <nav aria-label="Điều hướng phân hệ" className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              isActive
                ? 'bg-card border-primary/60 text-accent'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-card-hover'
            )
          }
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-surface border-r border-line p-5">
        <div className="space-y-6">
          <Wordmark subtitle={subtitle} size="md" />
          {navList()}
        </div>

        <div className="rounded-xl bg-card border border-line p-3.5 space-y-3">
          {user && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-ink-muted">{roleLabel}</p>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 bg-surface border-b border-line px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-card text-ink-muted hover:text-ink cursor-pointer"
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted truncate">
              {subtitle}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {user && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-card border border-line text-xs text-ink-muted">
                {roleLabel} · {user.fullName}
              </span>
            )}
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              icon={<LogOut className="w-3.5 h-3.5" />}
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={subtitle}
        placement="left"
      >
        {navList(() => setDrawerOpen(false))}
      </Drawer>
    </div>
  )
}
