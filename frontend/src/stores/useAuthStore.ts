import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, StaffRole } from '@/types/auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: UserProfile | null
  isAuthenticated: boolean

  // Actions
  setAuth: (token: string, refreshToken: string, user: UserProfile) => void
  logout: () => void
  updateUser: (user: Partial<UserProfile>) => void

  // Role check helpers
  hasRole: (role: StaffRole | StaffRole[]) => boolean
  isWaitstaff: () => boolean
  isExpediter: () => boolean
  isManager: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string, refreshToken: string, user: UserProfile) => {
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        })
      },

      updateUser: (updatedFields: Partial<UserProfile>) => {
        const currentUser = get().user
        if (!currentUser) return
        set({
          user: { ...currentUser, ...updatedFields },
        })
      },

      hasRole: (requiredRole: StaffRole | StaffRole[]) => {
        const userRole = get().user?.role
        if (!userRole) return false
        if (Array.isArray(requiredRole)) {
          return requiredRole.includes(userRole)
        }
        return userRole === requiredRole
      },

      isWaitstaff: () => get().user?.role === 'Waitstaff',
      isExpediter: () => get().user?.role === 'Expediter',
      isManager: () => get().user?.role === 'Manager',
      isAdmin: () => get().user?.role === 'Admin',
    }),
    {
      name: 'vindining-auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
