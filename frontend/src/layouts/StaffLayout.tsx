import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  BarChart3,
  LogOut,
  Radio,
  User,
  Flame,
  CreditCard,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'

export function StaffLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasRole } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const staffNav = [
    {
      to: '/pos/tables',
      label: 'Sơ đồ Bàn',
      icon: LayoutGrid,
      show: true,
    },
    {
      to: '/kds',
      label: 'Bếp KDS',
      icon: Flame,
      show: hasRole(['Expediter', 'Manager', 'Admin', 'Waitstaff']),
    },
    {
      to: '/expediter',
      label: 'Quầy Pass',
      icon: ChefHat,
      show: hasRole(['Expediter', 'Manager', 'Admin']),
    },
    {
      to: '/cashier',
      label: 'Thu Ngân',
      icon: CreditCard,
      show: hasRole(['Manager', 'Admin', 'Waitstaff']),
    },
    {
      to: '/manager',
      label: 'Quản Trị',
      icon: BarChart3,
      show: hasRole(['Manager', 'Admin']),
    },
  ]

  const roleColorMap = {
    Waitstaff: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Expediter: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Manager: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  const roleBadgeStyle = user?.role ? roleColorMap[user.role] : 'bg-neutral-800 text-neutral-300'

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-100 flex flex-col">
      {/* Top Staff Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-surface/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Shift */}
          <div className="flex items-center gap-4">
            <Link to="/pos/tables" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-4 h-4 text-neutral-950" />
              </div>
              <span className="font-bold tracking-wider uppercase text-gold-400 text-sm hidden sm:inline">
                VinDining POS
              </span>
            </Link>

            {/* SignalR Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-3 h-3 animate-pulse" />
              <span className="hidden md:inline">SignalR Live</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {staffNav
              .filter((n) => n.show)
              .map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-dark-card'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                )
              })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-right">
              <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-neutral-300">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-neutral-200 leading-tight">
                  {user?.fullName || 'Nhân sự'}
                </p>
                <span
                  className={cn(
                    'inline-block text-[10px] font-mono px-1.5 py-0.2 rounded border',
                    roleBadgeStyle
                  )}
                >
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="cursor-pointer p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Staff View */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default StaffLayout
