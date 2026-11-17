import { describe, expect, it } from 'vitest'
import {
  areAllItemsServed,
  buildBillLineItems,
  calculateDepositAmount,
  calculateInvoiceTotals,
  canFireCourse,
  computeHoldExpiresAt,
  computeKdsRowsPerPage,
  evaluateCancellationPolicy,
  evaluateLoginFailure,
  evaluateSla,
  fireCourseItems,
  formatDate,
  formatDateTime,
  formatInvoiceCode,
  formatMinutesSeconds,
  formatRelativeMinutes,
  formatSlotTime,
  formatVnd,
  formatVndDeduction,
  getAddedOrderItemStatus,
  getCourseAggregateStatus,
  getInitialOrderItemStatus,
  getLockoutStatus,
  getNextActivatableCourse,
  getOrderItemDisplayLabel,
  getRemainingHoldSeconds,
  groupKitchenTickets,
  hasAnyServedItem,
  isHoldExpired,
  isOrderLockedForTable,
  isTableUnavailableForSlot,
  markItemRemake,
  markItemServed,
  paginateKdsLanes,
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

describe('waitstaff course activation & payment lock helpers', () => {
  it('determines added item status based on whether course was already activated', () => {
    const existing = [
      { courseType: 'Appetizer' as const, status: 'Served' as const },
      { courseType: 'MainCourse' as const, status: 'Cooking' as const },
      { courseType: 'Dessert' as const, status: 'OnHold' as const },
    ]
    expect(getAddedOrderItemStatus(existing, 'Beverage')).toBe('Cooking')
    expect(getAddedOrderItemStatus(existing, 'MainCourse')).toBe('Cooking')
    expect(getAddedOrderItemStatus(existing, 'Dessert')).toBe('OnHold')

    expect(getNextActivatableCourse(existing)).toBe('Dessert')
    expect(getCourseAggregateStatus([existing[0]])).toBe('Served')
    expect(getCourseAggregateStatus([existing[1]])).toBe('Cooking')
    expect(getCourseAggregateStatus([existing[2]])).toBe('OnHold')

    expect(isOrderLockedForTable('PaymentPending')).toBe(true)
    expect(isOrderLockedForTable('Occupied')).toBe(false)
  })
})

describe('kitchen ticket grouping, max Prep SLA rule, urgency sort & KDS pagination', () => {
  it('groups course dishes, takes max Prep SLA from course start, and sorts most urgent first', () => {
    const now = new Date('2026-11-17T19:30:00.000Z')
    const minsAgo = (m: number) =>
      new Date(now.getTime() - m * 60_000).toISOString()

    const tickets = groupKitchenTickets(
      [
        {
          orderItemId: 'oi-1',
          orderId: 'ord-a',
          tableId: 'tbl-b05',
          tableNumber: 'B05',
          itemName: 'Gỏi tôm hùm',
          quantity: 2,
          courseType: 'Appetizer',
          status: 'Cooking',
          note: null,
          isRemake: false,
          remakeCount: 0,
          isPriority: false,
          prepTimeMinutes: 10,
          cookingStartedAt: minsAgo(9),
        },
        {
          orderItemId: 'oi-2',
          orderId: 'ord-a',
          tableId: 'tbl-b05',
          tableNumber: 'B05',
          itemName: 'Súp bào ngư',
          quantity: 2,
          courseType: 'Appetizer',
          status: 'Cooking',
          note: null,
          isRemake: false,
          remakeCount: 0,
          isPriority: false,
          prepTimeMinutes: 12,
          cookingStartedAt: minsAgo(9),
        },
        {
          orderItemId: 'oi-3',
          orderId: 'ord-b',
          tableId: 'tbl-b03',
          tableNumber: 'B03',
          itemName: 'Cá tuyết Miso',
          quantity: 2,
          courseType: 'MainCourse',
          status: 'Cooking',
          note: null,
          isRemake: false,
          remakeCount: 0,
          isPriority: false,
          prepTimeMinutes: 10,
          cookingStartedAt: minsAgo(11),
        },
      ],
      now
    )

    expect(tickets).toHaveLength(2)
    // B03 (11/10 = 1.10 overdue) ranks before B05 (9/12 = 0.75 normal; max of 10 and 12 = 12!)
    expect(tickets[0].tableNumber).toBe('B03')
    expect(tickets[0].slaStatus).toBe('overdue')
    expect(tickets[1].tableNumber).toBe('B05')
    expect(tickets[1].items).toHaveLength(2)
    expect(tickets[1].prepSlaMinutes).toBe(12)
    expect(tickets[1].slaStatus).toBe('normal')
    expect(formatMinutesSeconds(tickets[0].remainingSeconds)).toBe('01:00')
  })

  it('computes rows per height, repeats Làm lại across pages, and reports later-page counts', () => {
    expect(computeKdsRowsPerPage(1080)).toBe(3)
    expect(computeKdsRowsPerPage(720)).toBe(2)

    const now = new Date('2026-11-17T19:30:00.000Z')
    const makePending = (
      id: string,
      status: 'Cooking' | 'OnHold',
      isRemake = false
    ) => ({
      orderItemId: id,
      orderId: `ord-${id}`,
      tableId: `tbl-${id}`,
      tableNumber: id.toUpperCase(),
      itemName: 'Món thử',
      quantity: 1,
      courseType: 'MainCourse' as const,
      status,
      note: null,
      isRemake,
      remakeCount: isRemake ? 1 : 0,
      isPriority: false,
      prepTimeMinutes: 20,
      cookingStartedAt: status === 'Cooking' ? now.toISOString() : null,
    })

    const grouped = groupKitchenTickets(
      [
        makePending('r1', 'Cooking', true),
        ...Array.from({ length: 8 }, (_, idx) =>
          makePending(`c${idx + 1}`, 'Cooking', false)
        ),
        ...Array.from({ length: 4 }, (_, idx) =>
          makePending(`h${idx + 1}`, 'OnHold', false)
        ),
      ],
      now
    )

    const p1 = paginateKdsLanes(grouped, 1, 3)
    expect(p1.page).toBe(1)
    expect(p1.totalPages).toBe(2)
    expect(p1.remake).toHaveLength(1)
    expect(p1.cooking).toHaveLength(6)
    expect(p1.onHold).toHaveLength(3)
    expect(p1.cookingLaterCount).toBe(2)
    expect(p1.onHoldLaterCount).toBe(1)

    const p2 = paginateKdsLanes(grouped, 2, 3)
    expect(p2.page).toBe(2)
    expect(p2.remake).toHaveLength(1) // Làm lại repeated on page 2
    expect(p2.cooking).toHaveLength(2)
    expect(p2.onHold).toHaveLength(1)
    expect(p2.cookingLaterCount).toBe(0)
    expect(p2.onHoldLaterCount).toBe(0)
  })
})

describe('buildBillLineItems', () => {
  it('groups a fully served pre-ordered Set Menu into one summary line', () => {
    const lines = buildBillLineItems(
      [
        {
          id: 'oi-1',
          tastingMenuId: 'set-thuong-hang',
          itemName: 'Súp bào ngư',
          courseType: 'Appetizer',
          quantity: 4,
          unitPrice: 350_000,
          status: 'Served',
        },
        {
          id: 'oi-2',
          tastingMenuId: 'set-thuong-hang',
          itemName: 'Bò Wagyu A5',
          courseType: 'MainCourse',
          quantity: 4,
          unitPrice: 1_230_000,
          status: 'Served',
        },
        {
          id: 'oi-3',
          tastingMenuId: 'set-thuong-hang',
          itemName: 'Bánh Soufflé',
          courseType: 'Dessert',
          quantity: 4,
          unitPrice: 220_000,
          status: 'Served',
        },
      ],
      { 'set-thuong-hang': 'Set Menu Thượng Hạng' }
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      label: 'Set Menu Thượng Hạng',
      quantity: 4,
      unitPrice: 1_800_000,
      lineTotal: 7_200_000,
      isServed: true,
      isSetMenuGroup: true,
    })
  })

  it('splits a partially served Set Menu by allocated course prices and excludes unserved items', () => {
    const items = [
      {
        id: 'oi-1',
        tastingMenuId: 'set-thuong-hang',
        itemName: 'Súp bào ngư',
        courseType: 'Appetizer' as const,
        quantity: 4,
        unitPrice: 350_000,
        status: 'Served' as const,
      },
      {
        id: 'oi-2',
        tastingMenuId: 'set-thuong-hang',
        itemName: 'Bò Wagyu A5',
        courseType: 'MainCourse' as const,
        quantity: 4,
        unitPrice: 1_230_000,
        status: 'Served' as const,
      },
      {
        id: 'oi-3',
        tastingMenuId: 'set-thuong-hang',
        itemName: 'Bánh Soufflé',
        courseType: 'Dessert' as const,
        quantity: 4,
        unitPrice: 220_000,
        status: 'OnHold' as const,
      },
      {
        id: 'oi-4',
        tastingMenuId: null,
        itemName: 'Nước khoáng có ga',
        courseType: 'Appetizer' as const,
        quantity: 2,
        unitPrice: 120_000,
        status: 'Cooking' as const,
      },
    ]
    const lines = buildBillLineItems(items, {
      'set-thuong-hang': 'Set Menu Thượng Hạng',
    })

    expect(lines).toHaveLength(4)
    expect(lines[2]).toMatchObject({
      label: 'Bánh Soufflé',
      isServed: false,
      lineTotal: 0,
      unservedNote: 'Chưa phục vụ — không tính',
    })
    expect(lines[3]).toMatchObject({
      label: 'Nước khoáng có ga',
      isServed: false,
      lineTotal: 0,
      unservedNote: 'Chưa phục vụ — không tính',
    })
    const lineSum = lines.reduce((sum, l) => sum + l.lineTotal, 0)
    expect(lineSum).toBe(calculateInvoiceTotals(items, 0).subtotal)
  })
})

describe('formatInvoiceCode', () => {
  it('extracts last 6 uppercase alphanumeric characters from raw invoice IDs', () => {
    expect(formatInvoiceCode('inv-1794921839070-2')).toBe('390702')
    expect(formatInvoiceCode('inv-seed-1')).toBe('VSEED1')
    expect(formatInvoiceCode('abc')).toBe('ABC')
  })
})
