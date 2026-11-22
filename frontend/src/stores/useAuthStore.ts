import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CurrentUserDto, StaffRole } from '@/types'

const AUTH_STORAGE_KEY = 'vd-auth-storage'

if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore storage access errors
  }
}

/** Validates that a token is a real 3-segment JWT and has not expired. */
export function isValidJwtToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { exp?: number }
    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000)
      if (payload.exp <= nowSec) return false
    }
    return true
  } catch {
    return false
  }
}

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

/** Session-scoped staff authentication store (401 responses or invalid JWT clear this session). */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      justLoggedOut: false,

      setAuth: (token, user) => {
        if (!isValidJwtToken(token)) {
          set({ token: null, user: null, isAuthenticated: false, justLoggedOut: false })
          return
        }
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
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (!state.token || !isValidJwtToken(state.token) || !state.user)) {
          state.logout()
        }
      },
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
