import { LOGIN_LOCKOUT_MINUTES, LOGIN_MAX_FAILED_ATTEMPTS } from './constants'

export interface LoginFailureResult {
  failedLoginCount: number
  isLocked: boolean
  lockoutEnd: string | null
}

export interface LockoutStatus {
  locked: boolean
  remainingMinutes: number
}

/** Increments consecutive login failure count and triggers a 15-minute lock on the 5th failure. */
export function evaluateLoginFailure(
  currentFailedCount: number,
  now: Date = new Date()
): LoginFailureResult {
  const failedLoginCount = currentFailedCount + 1
  if (failedLoginCount >= LOGIN_MAX_FAILED_ATTEMPTS) {
    const lockoutEnd = new Date(
      now.getTime() + LOGIN_LOCKOUT_MINUTES * 60_000
    ).toISOString()
    return {
      failedLoginCount,
      isLocked: true,
      lockoutEnd,
    }
  }
  return {
    failedLoginCount,
    isLocked: false,
    lockoutEnd: null,
  }
}

/** Checks whether an account lockout timestamp is still active and returns whole remaining minutes. */
export function getLockoutStatus(
  lockoutEnd: string | Date | null | undefined,
  now: Date = new Date()
): LockoutStatus {
  if (!lockoutEnd) {
    return { locked: false, remainingMinutes: 0 }
  }
  const endMs =
    lockoutEnd instanceof Date ? lockoutEnd.getTime() : Date.parse(lockoutEnd)
  const diffMs = endMs - now.getTime()
  if (diffMs <= 0) {
    return { locked: false, remainingMinutes: 0 }
  }
  return {
    locked: true,
    remainingMinutes: Math.max(1, Math.ceil(diffMs / 60_000)),
  }
}
