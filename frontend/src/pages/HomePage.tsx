import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  BookOpen,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Zap,
} from 'lucide-react'
import { apiClient } from '@/services/api/client'

interface HealthData {
  status: string
  timestampUtc: string
  databaseConnected: boolean
  databaseProvider: string
  framework: string
}

export function HomePage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/health')
      setHealth(res.data)
    } catch {
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gold-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-300 border border-gold-500/20 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nền tảng Quản trị & Trải nghiệm Ẩm thực Fine Dining</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-100 mb-6">
            Đỉnh Cao Trải Nghiệm{' '}
            <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600 bg-clip-text text-transparent">
              VinDining
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-neutral-400 text-sm sm:text-lg leading-relaxed mb-10">
            Hệ thống đặt bàn trực quan, thực đơn điện tử chuẩn Taste Course, điều phối chế biến KDS không chạm và thanh toán tích hợp cấn trừ tiền cọc theo tiêu chuẩn Fine Dining cao cấp.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/reserve"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-neutral-950 font-bold text-sm shadow-lg shadow-gold-500/20 transition-all duration-200 group"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Đặt Bàn Ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/menu"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-card hover:bg-dark-card-hover border border-dark-border text-neutral-200 hover:text-gold-300 font-semibold text-sm transition-all duration-200"
            >
              <BookOpen className="w-4 h-4 text-gold-400" />
              <span>Xem Thực Đơn E-Menu</span>
            </Link>

            <Link
              to="/pos/tables"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-surface hover:bg-dark-card border border-gold-500/30 text-gold-400 hover:text-gold-300 font-semibold text-sm transition-all duration-200"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Sơ Đồ Bàn POS</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature & Tech Pillar Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-dark-border bg-dark-surface/70 p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-100 text-base mb-2">Real-time SignalR Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Cập nhật tức thời trạng thái bàn, nhịp điều phối Course Firing từ quầy phục vụ xuống KDS Bếp và quầy Pass.
            </p>
          </div>

          <div className="rounded-2xl border border-dark-border bg-dark-surface/70 p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-100 text-base mb-2">Clean Architecture .NET 9</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Mô hình phân tầng nghiêm ngặt kết hợp CQRS MediatR, FluentValidation pipeline và EF Core 9 Code-First.
            </p>
          </div>

          <div className="rounded-2xl border border-dark-border bg-dark-surface/70 p-6 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-100 text-base mb-2">Staff RBAC & Cấn Trừ Cọc</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Phân quyền chặt chẽ 4 vai trò nhân sự, bảo toàn dữ liệu tài chính với cơ chế tự động cấn trừ tiền cọc khi xuất hóa đơn.
            </p>
          </div>
        </div>

        {/* Live Backend Health Checker Card */}
        <div className="mt-8 rounded-2xl border border-dark-border bg-dark-surface/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {loading ? (
              <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />
            ) : health ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <p className="text-xs font-semibold text-neutral-200">
                Trạng thái Backend API:{' '}
                <span className={health ? 'text-emerald-400' : 'text-amber-400'}>
                  {loading ? 'Đang kiểm tra...' : health ? 'Sẵn sàng hoạt động (Healthy)' : 'Chưa kết nối (Offline)'}
                </span>
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                Port API: 5159 &bull; Framework: {health?.framework || 'ASP.NET Core .NET 9'} &bull; DB: {health?.databaseProvider || 'SQL Server'}
              </p>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={loading}
            className="cursor-pointer px-4 py-2 rounded-xl text-xs font-medium bg-dark-card hover:bg-dark-card-hover border border-dark-border text-neutral-300 hover:text-gold-300 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới kết nối</span>
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage
