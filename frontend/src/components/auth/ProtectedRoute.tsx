import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import type { StaffRole } from '@/types/auth'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: StaffRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user, hasRole } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-100 mb-2">Quyền truy cập bị giới hạn</h2>
        <p className="text-neutral-400 text-sm max-w-md mb-6">
          Tài khoản vai trò <span className="text-amber-400 font-semibold">{user.role}</span> không có thẩm quyền truy cập phân hệ này.
        </p>
        <Navigate to="/pos/tables" replace />
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
