import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button, Drawer, ThemeToggle, Wordmark } from '@/components/ui'

const GUEST_NAV_ITEMS = [
  { label: 'Set Menu', to: '/#set-menu' },
  { label: 'Không gian', to: '/#khong-gian' },
  { label: 'Thực đơn', to: '/#thuc-don' },
  { label: 'Tra cứu đặt bàn', to: '/tra-cuu' },
]

/** Public website layout with editorial header, mobile drawer, and minimal footer. */
export function GuestLayout() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" aria-label="VinDining trang chủ">
            <Wordmark size="md" />
          </Link>

          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-6"
          >
            {GUEST_NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-ink-muted hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button
              size="sm"
              className="rounded-full px-4"
              onClick={() => navigate('/dat-ban')}
            >
              Đặt bàn
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-card text-ink-muted hover:text-ink cursor-pointer"
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Wordmark size="sm" />
            <p className="text-xs text-ink-subtle">© VinDining</p>
          </div>
          <nav
            aria-label="Liên kết chân trang"
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {GUEST_NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="VinDining"
        placement="right"
      >
        <div className="flex flex-col gap-2">
          {GUEST_NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-card-hover transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-line">
            <Button
              fullWidth
              className="rounded-full"
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/dat-ban')
              }}
            >
              Đặt bàn
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
