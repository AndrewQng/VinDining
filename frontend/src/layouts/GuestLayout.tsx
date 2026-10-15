import { Link, Outlet, useLocation } from 'react-router-dom'
import { UtensilsCrossed, CalendarDays, BookOpen, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GuestLayout() {
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Trang chủ', icon: UtensilsCrossed },
    { to: '/reserve', label: 'Đặt bàn & Cọc', icon: CalendarDays },
    { to: '/menu', label: 'Thực đơn E-Menu', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-100 flex flex-col selection:bg-gold-500 selection:text-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-gold-200 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                VinDining
              </span>
              <p className="text-[10px] text-neutral-400 tracking-[0.25em] uppercase font-medium">Fine Dining Restaurant</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-gold-500/10 text-gold-300 border border-gold-500/20 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-dark-card'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Staff Login Portal Button */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-gold-300 bg-dark-card hover:bg-dark-card-hover border border-dark-border transition-all duration-200"
            >
              <LogIn className="w-4 h-4 text-gold-400" />
              <span>Cổng Nhân sự</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-surface/60 py-8 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 VinDining Fine Dining Management System &bull; Hệ thống Quản lý và Đặt bàn Nhà hàng Cao cấp</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Clean Architecture</span>
            <span>&bull;</span>
            <span>.NET 9 + React 19</span>
            <span>&bull;</span>
            <span>SignalR Real-time</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default GuestLayout
