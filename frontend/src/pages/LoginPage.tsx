import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react'
import { STAFF_ROLE_LABELS } from '@/domain'
import { Button, Card, Input, ThemeToggle, Wordmark } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isMockMode } from '@/lib/utils'
import { authApi } from '@/services/api'
import { DEMO_STAFF_ACCOUNTS, resetMockDb } from '@/services/mock'
import {
  getRoleHomeRoute,
  isRouteAllowedForRole,
  useAuthStore,
} from '@/stores/useAuthStore'
import { useThemeArea } from '@/stores/useThemeStore'
import { toast } from '@/stores/useToastStore'
import type { ApiErrorResponse } from '@/types'

/** S1 — Shared staff login page with lockout feedback and mock demo account helper. */
export function LoginPage() {
  useThemeArea('staff')
  useDocumentTitle('Đăng nhập')
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const mockEnabled = isMockMode()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lockedMinutes, setLockedMinutes] = useState<number | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLockedMinutes(null)
    setLoading(true)

    try {
      const response = await authApi.login({ username, password })
      setAuth(response.token, response.user)

      const fromPath = (location.state as { from?: { pathname?: string } })?.from
        ?.pathname
      const target =
        fromPath && isRouteAllowedForRole(fromPath, response.user.role)
          ? fromPath
          : getRoleHomeRoute(response.user.role)
      navigate(target, { replace: true })
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err)) {
        const status = err.response?.status
        const data = err.response?.data
        if (status === 423 || data?.code === 'ACCOUNT_LOCKED') {
          const mins = data?.remainingMinutes ?? 15
          setLockedMinutes(mins)
          setErrorMessage(
            `Tài khoản đang tạm khóa. Vui lòng thử lại sau ${mins} phút.`
          )
        } else {
          setErrorMessage(data?.message ?? 'Sai tên đăng nhập hoặc mật khẩu')
        }
      } else {
        setErrorMessage('Không thể kết nối máy chủ')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDemo = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername)
    setPassword(demoPassword)
    setErrorMessage(null)
    setLockedMinutes(null)
  }

  const handleResetDemo = () => {
    resetMockDb()
    setErrorMessage(null)
    setLockedMinutes(null)
    toast.success('Đã khôi phục dữ liệu demo')
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Quay lại trang chủ</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto my-8 space-y-4">
        <Card padding="lg" className="space-y-6 shadow-xl">
          <div className="text-center space-y-1.5">
            <Wordmark size="lg" className="items-center" />
            <h1 className="text-sm font-medium text-ink-muted">
              Đăng nhập hệ thống nội bộ
            </h1>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-danger/50 bg-danger/10 px-3.5 py-2.5 flex items-start gap-2.5 text-sm text-danger"
            >
              <AlertCircle
                className="w-4 h-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <p className="font-medium">{errorMessage}</p>
                {lockedMinutes !== null && (
                  <p className="text-xs text-ink-muted">
                    Thời gian khóa còn lại: {lockedMinutes} phút.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên đăng nhập / Email"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              leftIcon={<Lock className="w-4 h-4" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="p-1 text-ink-muted hover:text-ink cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              }
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </form>
        </Card>

        {mockEnabled && (
          <Card padding="sm" className="space-y-2.5">
            <p className="text-xs font-semibold text-accent">Tài khoản demo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_STAFF_ACCOUNTS.map((acc) => {
                const selected = username === acc.username
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() =>
                      handleSelectDemo(acc.username, acc.password)
                    }
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                      selected
                        ? 'border-primary bg-card-hover text-accent'
                        : 'border-line bg-card text-ink hover:bg-card-hover'
                    }`}
                  >
                    <span className="block font-medium">{acc.fullName}</span>
                    <span className="block text-ink-muted mt-0.5">
                      {STAFF_ROLE_LABELS[acc.role]} · {acc.username}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      <footer className="max-w-md w-full mx-auto pb-2 text-center space-y-2">
        {mockEnabled && (
          <button
            type="button"
            onClick={handleResetDemo}
            className="text-xs text-ink-muted hover:text-accent underline underline-offset-4 cursor-pointer"
          >
            Khôi phục dữ liệu demo
          </button>
        )}
        <p className="text-xs text-ink-subtle">© VinDining</p>
      </footer>
    </div>
  )
}
