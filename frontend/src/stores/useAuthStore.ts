import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrentUserDto, StaffRole } from '@/types'

interface AuthState {
  token: string | null
  user: CurrentUserDto | null
  isAuthenticated: boolean
  justLoggedOut: boolean
  setAuth: (token: string, user: CurrentUserDto) => void
  logout: () => void
  updateUser: (user: Partial<CurrentUserDto>) => void
  hasRole: (role: StaffRole | StaffRole[]) => boolean
}

/** Persisted staff authentication store (401 responses clear this session). */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      justLoggedOut: false,

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true, justLoggedOut: false })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, justLoggedOut: true })
      },

      updateUser: (updated) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...updated } })
      },

      hasRole: (requiredRole) => {
        const role = get().user?.role
        if (!role) return false
        return Array.isArray(requiredRole)
          ? requiredRole.includes(role)
          : role === requiredRole
      },
    }),
    {
      name: 'vd-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

/** Returns the default workspace path for a given staff role. */
export function getRoleHomeRoute(role: StaffRole): string {
  const map: Record<StaffRole, string> = {
    Waitstaff: '/phuc-vu',
    Expediter: '/dieu-phoi',
    Cashier: '/thu-ngan',
    Manager: '/quan-ly',
  }
  return map[role]
}

/** Checks whether a staff role is permitted to enter a given pathname after login. */
export function isRouteAllowedForRole(pathname: string, role: StaffRole): boolean {
  if (role === 'Manager') {
    return (
      pathname.startsWith('/phuc-vu') ||
      pathname.startsWith('/dieu-phoi') ||
      pathname.startsWith('/thu-ngan') ||
      pathname.startsWith('/quan-ly')
    )
  }
  return pathname.startsWith(getRoleHomeRoute(role))
}
