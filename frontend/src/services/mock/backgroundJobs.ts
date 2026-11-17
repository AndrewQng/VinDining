import { WORKER_INTERVALS_MS, evaluateSla, isHoldExpired } from '@/domain'
import { realtimeClient } from '@/services/realtime/client'
import { getMockDb, saveMockDb } from './db'

/** Releases expired 17-minute holds (PendingDeposit -> Expired_Cancelled, Locked -> Available). */
export function runExpiryScan(now: Date = new Date()): number {
  const db = getMockDb()
  let released = 0

  for (const res of db.reservations) {
    if (res.status !== 'PendingDeposit') continue
    if (!isHoldExpired(res.holdExpiresAt, now)) continue

    res.status = 'Expired_Cancelled'
    res.holdExpiresAt = null
    if (res.deposit && res.deposit.status === 'Pending') {
      res.deposit.status = 'Forfeited'
    }

    const table = db.tables.find((t) => t.id === res.tableId)
    if (table && table.status === 'Locked') {
      table.status = 'Available'
      table.currentReservationCode = null
      table.guestCount = null
      table.holdExpiresAt = null
      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: 'Available',
      })
    }
    released += 1
  }

  if (released > 0) {
    saveMockDb(db)
  }
  return released
}

/** Marks paid invoices as having had their CSAT survey link sent. */
export function runSurveyScan(now: Date = new Date()): number {
  const db = getMockDb()
  let marked = 0
  const nowIso = now.toISOString()

  for (const inv of db.invoices) {
    if (inv.isPaid && !inv.surveySentAt) {
      inv.surveySentAt = nowIso
      marked += 1
    }
  }

  if (marked > 0) {
    saveMockDb(db)
  }
  return marked
}

/** Marks Reserved bookings within 2 hours as having received a reminder. */
export function runReminderScan(now: Date = new Date()): number {
  const db = getMockDb()
  let reminded = 0
  const twoHoursMs = 2 * 3_600_000
  const nowIso = now.toISOString()

  for (const res of db.reservations) {
    if (res.status !== 'Reserved' || res.reminderSentAt) continue
    const diffMs = Date.parse(res.reservationTime) - now.getTime()
    if (diffMs > 0 && diffMs <= twoHoursMs) {
      res.reminderSentAt = nowIso
      reminded += 1
    }
  }

  if (reminded > 0) {
    saveMockDb(db)
  }
  return reminded
}

/** Evaluates active Cooking items against Prep SLA and emits sla:alert if needed. */
export function runSlaScan(now: Date = new Date()): {
  warningCount: number
  overdueCount: number
} {
  const db = getMockDb()
  let warningCount = 0
  let overdueCount = 0

  for (const order of db.orders) {
    if (order.status !== 'Active') continue
    for (const item of order.items) {
      if (item.status !== 'Cooking' || item.prepTimeMinutes <= 0) continue
      const sla = evaluateSla(item.cookingStartedAt, item.prepTimeMinutes, now)
      if (sla.status === 'overdue') overdueCount += 1
      else if (sla.status === 'warning') warningCount += 1
    }
  }

  if (warningCount > 0 || overdueCount > 0) {
    realtimeClient.publish('sla:alert', { warningCount, overdueCount })
  }
  return { warningCount, overdueCount }
}

let timerHandles: number[] = []

/** Starts the 4 simulated background workers in browser mock mode. */
export function startMockBackgroundJobs(): () => void {
  stopMockBackgroundJobs()
  if (typeof window === 'undefined') {
    return () => {}
  }

  runExpiryScan()
  runSlaScan()

  timerHandles = [
    window.setInterval(() => runExpiryScan(), WORKER_INTERVALS_MS.expiryScan),
    window.setInterval(() => runSurveyScan(), WORKER_INTERVALS_MS.surveyScan),
    window.setInterval(() => runReminderScan(), WORKER_INTERVALS_MS.reminderScan),
    window.setInterval(() => runSlaScan(), WORKER_INTERVALS_MS.slaScan),
  ]

  return stopMockBackgroundJobs
}

/** Stops all running mock background worker intervals. */
export function stopMockBackgroundJobs(): void {
  if (typeof window === 'undefined') return
  for (const id of timerHandles) {
    window.clearInterval(id)
  }
  timerHandles = []
}
