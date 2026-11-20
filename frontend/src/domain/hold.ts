import { HOLD_DURATION_MINUTES } from './constants'
import { parseUtcTimestamp } from './datetime'

function toTimestamp(value: Date | string): number {
  return parseUtcTimestamp(value)
}

/** Computes the 17-minute temporary hold expiration timestamp from creation time. */
export function computeHoldExpiresAt(createdAt: Date | string): Date {
  return new Date(toTimestamp(createdAt) + HOLD_DURATION_MINUTES * 60_000)
}

/** Returns true when a temporary hold has reached or passed its 17-minute expiration. */
export function isHoldExpired(
  holdExpiresAt: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!holdExpiresAt) {
    return false
  }
  return now.getTime() >= toTimestamp(holdExpiresAt)
}

/** Returns whole remaining hold seconds, clamped to zero after expiry. */
export function getRemainingHoldSeconds(
  holdExpiresAt: Date | string | null | undefined,
  now: Date = new Date()
): number {
  if (!holdExpiresAt) {
    return 0
  }
  const diffMs = toTimestamp(holdExpiresAt) - now.getTime()
  return Math.max(0, Math.floor(diffMs / 1000))
}
