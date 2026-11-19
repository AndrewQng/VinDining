import { evaluateLoginFailure, getLockoutStatus } from '@/domain'
import type { LoginRequest } from '@/types'
import { nextMockId, saveMockDb } from '../db'
import { fail, ok, toPublicUser, type MockRouteDefinition } from '../types'

export const authRoutes: MockRouteDefinition[] = [
  {
    id: 1,
    method: 'POST',
    pattern: '/auth/login',
    access: 'Public',
    handler: ({ db, body, now }) => {
      const payload = (body ?? {}) as Partial<LoginRequest>
      const identifier = (payload.username ?? '').trim().toLowerCase()
      const password = payload.password ?? ''

      const staff = db.staffs.find(
        (s) =>
          s.username.toLowerCase() === identifier ||
          s.email.toLowerCase() === identifier
      )

      if (!staff) {
        return fail(401, 'Sai tên đăng nhập hoặc mật khẩu')
      }

      if (!staff.isActive) {
        return fail(403, 'Tài khoản đã bị khóa bởi quản lý')
      }

      const lockState = getLockoutStatus(staff.lockoutEnd, now)
      if (lockState.locked) {
        return fail(
          423,
          `Tài khoản đang tạm khóa. Vui lòng thử lại sau ${lockState.remainingMinutes} phút.`,
          {
            code: 'ACCOUNT_LOCKED',
            remainingMinutes: lockState.remainingMinutes,
          }
        )
      }

      if (staff.lockoutEnd && !lockState.locked) {
        staff.failedLoginCount = 0
        staff.lockoutEnd = null
      }

      if (staff.password !== password) {
        const failure = evaluateLoginFailure(staff.failedLoginCount, now)
        staff.failedLoginCount = failure.failedLoginCount
        staff.lockoutEnd = failure.lockoutEnd
        saveMockDb(db)

        if (failure.isLocked) {
          return fail(
            423,
            'Tài khoản đã bị tạm khóa 15 phút do nhập sai mật khẩu quá 5 lần.',
            { code: 'ACCOUNT_LOCKED', remainingMinutes: 15 }
          )
        }
        return fail(401, 'Sai tên đăng nhập hoặc mật khẩu')
      }

      staff.failedLoginCount = 0
      staff.lockoutEnd = null
      const token = nextMockId('jwt')
      const user = toPublicUser(staff)
      db.sessions[token] = user
      saveMockDb(db)

      return ok({
        token,
        expiresAtUtc: new Date(now.getTime() + 12 * 3_600_000).toISOString(),
        user,
      })
    },
  },
  {
    id: 2,
    method: 'GET',
    pattern: '/auth/me',
    access: ['Waitstaff', 'Expediter', 'Cashier', 'Manager'],
    handler: ({ user }) => {
      if (!user) return fail(401, 'Chưa đăng nhập')
      return ok(user)
    },
  },
  {
    id: 3,
    method: 'POST',
    pattern: '/auth/logout',
    access: ['Waitstaff', 'Expediter', 'Cashier', 'Manager'],
    handler: ({ db, token }) => {
      if (token && db.sessions[token]) {
        delete db.sessions[token]
        saveMockDb(db)
      }
      return ok({ success: true })
    },
  },
]
