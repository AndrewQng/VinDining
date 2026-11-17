import { describe, expect, it } from 'vitest'
import {
  areAllItemsServed,
  calculateDepositAmount,
  calculateInvoiceTotals,
  canFireCourse,
  computeHoldExpiresAt,
  evaluateCancellationPolicy,
  evaluateLoginFailure,
  evaluateSla,
  fireCourseItems,
  formatDate,
  formatDateTime,
  formatRelativeMinutes,
  formatSlotTime,
  formatVnd,
  formatVndDeduction,
  getInitialOrderItemStatus,
  getLockoutStatus,
  getOrderItemDisplayLabel,
  getRemainingHoldSeconds,
  hasAnyServedItem,
  isHoldExpired,
  isTableUnavailableForSlot,
  markItemRemake,
  markItemServed,
  type FireableOrderItem,
} from './index'

describe('money formatter', () => {
  it('formats integer VND amounts with vi-VN grouping and trailing ₫', () => {
    expect(formatVnd(1_800_000)).toBe('1.800.000 ₫')
    expect(formatVnd(0)).toBe('0 ₫')
    expect(formatVnd(-0)).toBe('0 ₫')
    expect(formatVndDeduction(2_160_000)).toBe('−2.160.000 ₫')
  })
})

describe('deposit calculation', () => {
  it('reproduces all section 10 deposit examples exactly', () => {
    // Set Menu Thượng Hạng (1.800.000) x 4 guests = 2.160.000
    expect(
      calculateDepositAmount({ guestCount: 4, setMenuPricePerGuest: 1_800_000 })
    ).toBe(2_160_000)

    // Set Menu Hải Sản (1.250.000) x 4 guests = 1.500.000
    expect(
      calculateDepositAmount({ guestCount: 4, setMenuPricePerGuest: 1_250_000 })
    ).toBe(1_500_000)

    // No set menu, 4 guests = 2.000.000
    expect(calculateDepositAmount({ guestCount: 4 })).toBe(2_000_000)

    // No set menu, 2 guests = 1.000.000
    expect(calculateDepositAmount({ guestCount: 2 })).toBe(1_000_000)

    // Walk-in pays no deposit
    expect(
      calculateDepositAmount({
        guestCount: 4,
        setMenuPricePerGuest: 1_800_000,
        isWalkIn: true,
      })
    ).toBe(0)
  })
})

describe('invoice calculation', () => {
  it('reproduces B05 invoice totals exactly (7.200.000 -> 6.156.000)', () => {
    const result = calculateInvoiceTotals(
      [
        { quantity: 4, unitPrice: 350_000, status: 'Served' },
        { quantity: 4, unitPrice: 1_230_000, status: 'Served' },
        { quantity: 4, unitPrice: 220_000, status: 'Served' },
      ],
      2_160_000
    )

    expect(result).toEqual({
      subtotal: 7_200_000,
      serviceCharge: 360_000,
      vatAmount: 756_000,
      totalAmount: 8_316_000,
      deductedDeposit: 2_160_000,
      amountDue: 6_156_000,
    })
  })

  it('clamps B04 below-deposit invoice to 0 ₫ (minimum spend rule)', () => {
    const result = calculateInvoiceTotals(
      [{ quantity: 2, unitPrice: 120_000, status: 'Served' }],
      1_000_000
    )

    expect(result).toEqual({
      subtotal: 240_000,
      serviceCharge: 12_000,
      vatAmount: 25_200,
      totalAmount: 277_200,
      deductedDeposit: 1_000_000,
      amountDue: 0,
    })
  })

  it('ignores non-served items when computing subtotal', () => {
    const result = calculateInvoiceTotals(
      [
        { quantity: 1, unitPrice: 350_000, status: 'Served' },
        { quantity: 1, unitPrice: 1_250_000, status: 'Cooking' },
        { quantity: 1, unitPrice: 220_000, status: 'OnHold' },
      ],
      0
    )
    expect(result.subtotal).toBe(350_000)
  })
})

describe('hold expiry (17 minutes)', () => {
  it('stays active before 17 minutes and expires at 17 minutes', () => {
    const created = new Date('2026-11-06T12:00:00.000Z')
    const expiresAt = computeHoldExpiresAt(created)

    const beforeExpiry = new Date('2026-11-06T12:16:59.000Z')
    expect(isHoldExpired(expiresAt, beforeExpiry)).toBe(false)
    expect(getRemainingHoldSeconds(expiresAt, beforeExpiry)).toBe(1)

    const atExpiry = new Date('2026-11-06T12:17:00.000Z')
    expect(isHoldExpired(expiresAt, atExpiry)).toBe(true)
    expect(getRemainingHoldSeconds(expiresAt, atExpiry)).toBe(0)
  })
})

describe('cancellation policy (4h cutoff)', () => {
  const reservationTime = '2026-11-06T19:00:00.000Z'

  it('grants 100% refund at exactly 4h00 before reservation', () => {
    const cancelledAt = '2026-11-06T15:00:00.000Z'
    const res = evaluateCancellationPolicy(reservationTime, cancelledAt, 2_160_000)
    expect(res.hoursUntilReservation).toBe(4)
    expect(res.isEligibleForFullRefund).toBe(true)
    expect(res.refundAmount).toBe(2_160_000)
    expect(res.resultingReservationStatus).toBe('Cancelled_Refunded')
    expect(res.resultingDepositStatus).toBe('Refunded')
  })

  it('forfeits deposit at 3h59 before reservation', () => {
    const cancelledAt = '2026-11-06T15:01:00.000Z'
    const res = evaluateCancellationPolicy(reservationTime, cancelledAt, 2_160_000)
    expect(res.hoursUntilReservation).toBeLessThan(4)
    expect(res.isEligibleForFullRefund).toBe(false)
    expect(res.refundAmount).toBe(0)
    expect(res.resultingReservationStatus).toBe('Cancelled_Forfeited')
    expect(res.resultingDepositStatus).toBe('Forfeited')
  })
})

describe('course firing & item transitions', () => {
  it('starts Appetizer and Beverage in Cooking, MainCourse and Dessert OnHold', () => {
    expect(getInitialOrderItemStatus('Appetizer')).toBe('Cooking')
    expect(getInitialOrderItemStatus('Beverage')).toBe('Cooking')
    expect(getInitialOrderItemStatus('MainCourse')).toBe('OnHold')
    expect(getInitialOrderItemStatus('Dessert')).toBe('OnHold')
  })

  it('fires OnHold course, supports remake and serve transitions', () => {
    const initial: FireableOrderItem[] = [
      {
        courseType: 'Appetizer',
        status: 'Cooking',
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        cookingStartedAt: '2026-11-06T12:00:00.000Z',
        servedAt: null,
        servedById: null,
      },
      {
        courseType: 'MainCourse',
        status: 'OnHold',
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        cookingStartedAt: null,
        servedAt: null,
        servedById: null,
      },
    ]

    expect(hasAnyServedItem(initial)).toBe(false)
    expect(canFireCourse(initial, 'MainCourse')).toBe(true)
    expect(canFireCourse(initial, 'Appetizer')).toBe(false)

    const activated = fireCourseItems(
      initial,
      'MainCourse',
      '2026-11-06T12:15:00.000Z',
      true
    )
    expect(activated[1].status).toBe('Cooking')
    expect(activated[1].isPriority).toBe(true)

    const remade = markItemRemake(activated[0], '2026-11-06T12:16:00.000Z')
    expect(remade.status).toBe('Cooking')
    expect(remade.isRemake).toBe(true)
    expect(remade.remakeCount).toBe(1)
    expect(getOrderItemDisplayLabel(remade.status, remade.isRemake)).toBe('Làm lại')

    const served0 = markItemServed(remade, 'staff-exp', '2026-11-06T12:20:00.000Z')
    const served1 = markItemServed(activated[1], 'staff-exp', '2026-11-06T12:30:00.000Z')
    expect(hasAnyServedItem([served0, activated[1]])).toBe(true)
    expect(areAllItemsServed([served0, served1])).toBe(true)
  })
})

describe('SLA evaluation (80% warning, >100% overdue)', () => {
  const startedAt = new Date('2026-11-06T12:00:00.000Z')

  it('classifies 79% normal, 80% warning, 100%+ overdue', () => {
    // 1000 seconds SLA? Use 10 minutes = 600s
    const at79Pct = new Date(startedAt.getTime() + 474 * 1000) // 474 / 600 = 0.79
    expect(evaluateSla(startedAt, 10, at79Pct).status).toBe('normal')

    const at80Pct = new Date(startedAt.getTime() + 480 * 1000) // 480 / 600 = 0.80
    expect(evaluateSla(startedAt, 10, at80Pct).status).toBe('warning')

    const at100Pct = new Date(startedAt.getTime() + 600 * 1000) // 600 / 600 = 1.00
    expect(evaluateSla(startedAt, 10, at100Pct).status).toBe('warning')

    const past100Pct = new Date(startedAt.getTime() + 601 * 1000) // 601 / 600 > 1.00
    expect(evaluateSla(startedAt, 10, past100Pct).status).toBe('overdue')
  })
})

describe('login lock (5 failures -> 15 min lock)', () => {
  it('locks on the 5th consecutive failure and unlocks after 15 minutes', () => {
    const start = new Date('2026-11-06T10:00:00.000Z')

    // Failures 1..4 do not lock
    for (let count = 0; count < 4; count += 1) {
      const res = evaluateLoginFailure(count, start)
      expect(res.isLocked).toBe(false)
      expect(res.lockoutEnd).toBeNull()
    }

    // 5th failure locks for 15 minutes
    const fifth = evaluateLoginFailure(4, start)
    expect(fifth.failedLoginCount).toBe(5)
    expect(fifth.isLocked).toBe(true)
    expect(fifth.lockoutEnd).toBe('2026-11-06T10:15:00.000Z')

    // Still locked at 14m 10s
    const at14m10s = new Date('2026-11-06T10:14:10.000Z')
    expect(getLockoutStatus(fifth.lockoutEnd, at14m10s)).toEqual({
      locked: true,
      remainingMinutes: 1,
    })

    // Unlocks at exactly 15 minutes
    const at15m = new Date('2026-11-06T10:15:00.000Z')
    expect(getLockoutStatus(fifth.lockoutEnd, at15m)).toEqual({
      locked: false,
      remainingMinutes: 0,
    })
  })
})

describe('datetime formatters', () => {
  it('formats 24h slot time, Vietnamese date, combined dateTime, and relative minutes', () => {
    const sample = new Date(2026, 10, 18, 19, 0, 0) // Wed Nov 18 2026 19:00 local
    expect(formatSlotTime(sample)).toBe('19:00')
    expect(formatDate(sample)).toBe('Thứ Tư, 18/11/2026')
    expect(formatDateTime(sample)).toBe('19:00 · Thứ Tư, 18/11/2026')

    const now = new Date(2026, 10, 18, 19, 10, 0)
    expect(formatRelativeMinutes(new Date(2026, 10, 18, 19, 10, 0), now)).toBe(
      'vừa xong'
    )
    expect(formatRelativeMinutes(new Date(2026, 10, 18, 19, 5, 0), now)).toBe(
      '5 phút trước'
    )
  })
})

describe('slotAvailability overlap and live-status rules', () => {
  const now = new Date(2026, 10, 17, 17, 30, 0) // 17:30 today

  it('ignores non-Available live status for tomorrow, blocks only overlapping active bookings', () => {
    const tomorrow19 = new Date(2026, 10, 18, 19, 0, 0)
    const tomorrow20 = new Date(2026, 10, 18, 20, 0, 0)
    const tomorrow21 = new Date(2026, 10, 18, 21, 0, 0)

    // Busy tonight (Occupied) does NOT block tomorrow 19:00
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b03',
        tableStatus: 'Occupied',
        slotStart: tomorrow19,
        now,
        reservations: [],
      })
    ).toBe(false)

    // Overlapping Reserved booking at tomorrow 19:00 blocks 20:00 (19:00..21:00 vs 20:00..22:00)
    const activeRes = {
      tableId: 'tbl-b03',
      reservationTime: tomorrow19.toISOString(),
      durationMinutes: 120,
      status: 'Reserved' as const,
      holdExpiresAt: null,
    }
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b03',
        tableStatus: 'Occupied',
        slotStart: tomorrow20,
        now,
        reservations: [activeRes],
      })
    ).toBe(true)

    // Exact adjacent slot 21:00 (21:00..23:00) does NOT overlap 19:00..21:00
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b03',
        tableStatus: 'Occupied',
        slotStart: tomorrow21,
        now,
        reservations: [activeRes],
      })
    ).toBe(false)
  })

  it('ignores expired PendingDeposit holds and cancelled bookings', () => {
    const tomorrow19 = new Date(2026, 10, 18, 19, 0, 0)
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b06',
        tableStatus: 'Available',
        slotStart: tomorrow19,
        now,
        reservations: [
          {
            tableId: 'tbl-b06',
            reservationTime: tomorrow19.toISOString(),
            durationMinutes: 120,
            status: 'PendingDeposit',
            holdExpiresAt: new Date(now.getTime() - 1000).toISOString(),
          },
          {
            tableId: 'tbl-b06',
            reservationTime: tomorrow19.toISOString(),
            durationMinutes: 120,
            status: 'Cancelled_Refunded',
            holdExpiresAt: null,
          },
        ],
      })
    ).toBe(false)

    // Unexpired PendingDeposit hold DOES block
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b06',
        tableStatus: 'Available',
        slotStart: tomorrow19,
        now,
        reservations: [
          {
            tableId: 'tbl-b06',
            reservationTime: tomorrow19.toISOString(),
            durationMinutes: 120,
            status: 'PendingDeposit',
            holdExpiresAt: new Date(now.getTime() + 60_000).toISOString(),
          },
        ],
      })
    ).toBe(true)
  })

  it('blocks today slots within 120 min when live table status is not Available', () => {
    const today19 = new Date(2026, 10, 17, 19, 0, 0) // +90 min from 17:30
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b03',
        tableStatus: 'Occupied',
        slotStart: today19,
        now,
        reservations: [],
      })
    ).toBe(true)

    const today20 = new Date(2026, 10, 17, 20, 0, 0) // +150 min from 17:30 -> >120 min
    expect(
      isTableUnavailableForSlot({
        tableId: 'tbl-b03',
        tableStatus: 'Occupied',
        slotStart: today20,
        now,
        reservations: [],
      })
    ).toBe(false)
  })
})
