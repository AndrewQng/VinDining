import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, User, UtensilsCrossed, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import type { StaffRole, UserProfile } from '@/types/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [username, setUsername] = useState('waiter1')
  const [password, setPassword] = useState('Password123!')
  const [role, setRole] = useState<StaffRole>('Waitstaff')
  const [loading, setLoading] = useState(false)

  const demoAccounts: { role: StaffRole; label: string; desc: string; user: string }[] = [
    { role: 'Waitstaff', label: 'Phục Vụ Bàn', desc: 'Đón khách, Order, Course Firing', user: 'waiter1' },
    { role: 'Expediter', label: 'Điều Phối Quầy Pass', desc: 'Kiểm đồ, xác nhận ra món', user: 'chef1' },
    { role: 'Manager', label: 'Quản Lý Nhà Hàng', desc: 'Báo cáo doanh thu, duyệt hoàn cọc', user: 'manager1' },
    { role: 'Admin', label: 'Quản Trị Hệ Thống', desc: 'Cấu hình nhân sự, tài khoản', user: 'admin1' },
  ]

  const handleSelectDemo = (selectedRole: StaffRole, demoUser: string) => {
    setRole(selectedRole)
    setUsername(demoUser)
    setPassword('Password123!')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Demo authentication session
    const mockUser: UserProfile = {
      id: `usr_${Date.now()}`,
      username,
      fullName:
        role === 'Waitstaff'
          ? 'Nguyễn Văn Phục Vụ'
          : role === 'Expediter'
          ? 'Trần Bếp Điều Phối'
          : role === 'Manager'
          ? 'Lê Quản Lý Nhà Hàng'
          : 'Hệ Thống Quản Trị',
      email: `${username}@vindining.vn`,
      role,
    }

    setTimeout(() => {
      setAuth('mock-jwt-token-fine-dining', 'mock-refresh-token', mockUser)
      setLoading(false)

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else if (role === 'Expediter') {
        navigate('/expediter', { replace: true })
      } else if (role === 'Manager' || role === 'Admin') {
        navigate('/manager', { replace: true })
      } else {
        navigate('/pos/tables', { replace: true })
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-100 flex flex-col justify-center items-center px-4 py-12 relative selection:bg-gold-500 selection:text-neutral-950">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center shadow-xl shadow-gold-500/20 mx-auto mb-4">
            <UtensilsCrossed className="w-7 h-7 text-neutral-950" />
          </div>
          <h2 className="text-2xl font-black tracking-wider uppercase text-neutral-100">Cổng Nhân Sự VinDining</h2>
          <p className="text-xs text-neutral-400 mt-1">Đăng nhập tài khoản nội bộ theo phân quyền chức vụ</p>
        </div>

        {/* Quick Role Select Demo Cards */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>Chọn nhanh vai trò ca trực</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemo(acc.role, acc.user)}
                className={`cursor-pointer p-3 rounded-xl border text-left transition-all duration-150 ${
                  role === acc.role
                    ? 'border-gold-500/50 bg-gold-500/10 text-gold-300 shadow-sm'
                    : 'border-dark-border bg-dark-surface/60 hover:bg-dark-card text-neutral-300'
                }`}
              >
                <p className="text-xs font-bold leading-tight">{acc.label}</p>
                <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{acc.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-dark-border bg-dark-surface/90 backdrop-blur-md p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-10 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-10 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-950 font-bold text-sm shadow-lg shadow-gold-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Đang xác thực...' : `Vào Ca Trực (${role})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="cursor-pointer text-xs text-neutral-400 hover:text-gold-300 transition-colors"
          >
            &larr; Quay lại trang chủ Thực khách
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
