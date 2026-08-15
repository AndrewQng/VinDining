import { useEffect, useState } from 'react'
import { Database, Server, CheckCircle2, XCircle, UtensilsCrossed, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react'

interface HealthResponse {
  status: string
  timestampUtc: string
  databaseConnected: boolean
  databaseProvider: string
  framework: string
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5159/api'
      const res = await fetch(`${apiUrl}/health`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHealth(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Backend is offline or unreachable')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                VinDining
              </h1>
              <p className="text-xs text-neutral-400 tracking-widest uppercase">Fine Dining System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Clean Architecture
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Hạ Tầng Code & Kết Nối CSDL Sẵn Sàng
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-neutral-50">
            Kiến Trúc Nền Tảng <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">.NET 9 + React</span>
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Hệ thống quản lý và đặt bàn Fine Dining tuân thủ nguyên tắc SOLID, phân tầng Clean Architecture, xác thực Identity JWT và kết nối SQL Server.
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
          {/* Card 1: Backend API */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Server className="w-6 h-6" />
              </div>
              {loading ? (
                <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />
              ) : health ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <XCircle className="w-4 h-4" /> Offline
                </span>
              )}
            </div>
            <h3 className="font-semibold text-neutral-100 text-lg mb-1">Backend API</h3>
            <p className="text-xs text-neutral-400 mb-4">ASP.NET Core Web API (.NET 9) với MediatR & FluentValidation.</p>
            <div className="text-xs text-neutral-500 font-mono">
              Port: <span className="text-neutral-300">5159</span> | Swagger: <span className="text-neutral-300">/swagger</span>
            </div>
          </div>

          {/* Card 2: Database Connection */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Database className="w-6 h-6" />
              </div>
              {loading ? (
                <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />
              ) : health?.databaseConnected ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Migrated (SQL Server)
                </span>
              )}
            </div>
            <h3 className="font-semibold text-neutral-100 text-lg mb-1">SQL Server Database</h3>
            <p className="text-xs text-neutral-400 mb-4">Cơ sở dữ liệu <span className="text-amber-300 font-mono">VinDiningDb</span> đã được migrate các bảng Identity.</p>
            <div className="text-xs text-neutral-500 font-mono">
              Provider: <span className="text-neutral-300">SQL Server (EF Core 9)</span>
            </div>
          </div>

          {/* Card 3: Architecture & Security */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> SOLID
              </span>
            </div>
            <h3 className="font-semibold text-neutral-100 text-lg mb-1">Security & SOLID</h3>
            <p className="text-xs text-neutral-400 mb-4">JWT Bearer Auth, Refresh Token, Domain Exception & Validation Pipeline.</p>
            <div className="text-xs text-neutral-500 font-mono">
              Layers: <span className="text-neutral-300">Domain → App → Infra → API</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={checkHealth}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Kiểm tra kết nối Live API & Database
          </button>
        </div>

        {error && (
          <p className="text-center text-xs text-neutral-400 mt-3">
            Ghi chú: Khởi chạy Backend bằng lệnh <code className="text-amber-400 font-mono">dotnet run --project backend/src/API</code> để gọi API Live.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        VinDining Fine Dining Management System &bull; Môn Chuyên Đề Tổng Hợp &bull; .NET 9 & React TypeScript
      </footer>
    </div>
  )
}
