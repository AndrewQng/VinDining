import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { STAFF_ROLE_LABELS } from '@/domain'
import { Button, Card } from '@/components/ui'
import { getRoleHomeRoute, useAuthStore } from '@/stores/useAuthStore'
import type { StaffRole } from '@/types'

export interface ProtectedRouteProps {
  allowedRoles?: StaffRole[]
}

/** Enforces staff authentication and RBAC matrix (Manager has access to all staff areas). */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const justLoggedOut = useAuthStore((s) => s.justLoggedOut)

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/dang-nhap"
        state={justLoggedOut ? undefined : { from: location }}
        replace
      />
    )
  }

  const isAllowed =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    user.role === 'Manager' ||
    allowedRoles.includes(user.role)

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-card border border-line flex items-center justify-center text-accent mx-auto">
            <ShieldAlert className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-ink">
              Không có quyền truy cập
            </h1>
            <p className="text-sm text-ink-muted">
              Vai trò {STAFF_ROLE_LABELS[user.role]} không được phép truy cập khu
              vực này.
            </p>
          </div>
          <Link to={getRoleHomeRoute(user.role)} className="inline-block">
            <Button>Quay lại màn hình chính</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return <Outlet />
}
