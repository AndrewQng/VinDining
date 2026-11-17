import { isHoldExpired } from './hold'
import type { ReservationStatus, TableStatus } from '@/types'

export interface SlotReservationLike {
  tableId: string
  reservationTime: string
  durationMinutes: number
  status: ReservationStatus
  holdExpiresAt: string | null
}

export interface SlotAvailabilityInput {
  tableId: string
  tableStatus: TableStatus
  slotStart: Date
  now: Date
  reservations: ReadonlyArray<SlotReservationLike>
  durationMinutes?: number
}

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isBlockingReservationStatus(
  res: SlotReservationLike,
  now: Date
): boolean {
  if (res.status === 'Reserved') return true
  if (res.status === 'PendingDeposit') {
    return !isHoldExpired(res.holdExpiresAt, now)
  }
  return false
}

/**
 * Determines whether a table is unavailable for a requested booking slot.
 * Blocks on overlapping active reservations (Reserved or unexpired PendingDeposit)
 * and, for slots starting today within 120 minutes of now, non-Available live status.
 */
export function isTableUnavailableForSlot({
  tableId,
  tableStatus,
  slotStart,
  now,
  reservations,
  durationMinutes = 120,
}: SlotAvailabilityInput): boolean {
  const slotStartMs = slotStart.getTime()
  const slotEndMs = slotStartMs + durationMinutes * 60_000

  const hasOverlap = reservations.some((res) => {
    if (res.tableId !== tableId) return false
    if (!isBlockingReservationStatus(res, now)) return false
    const resStartMs = Date.parse(res.reservationTime)
    const resDuration = res.durationMinutes > 0 ? res.durationMinutes : 120
    const resEndMs = resStartMs + resDuration * 60_000
    return slotStartMs < resEndMs && resStartMs < slotEndMs
  })

  if (hasOverlap) {
    return true
  }

  const isToday = getLocalDateKey(slotStart) === getLocalDateKey(now)
  const diffFromNowMinutes = (slotStartMs - now.getTime()) / 60_000
  if (isToday && diffFromNowMinutes <= 120) {
    return tableStatus !== 'Available'
  }

  return false
}
