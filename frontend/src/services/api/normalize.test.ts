import { AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import type { OrderDto, ReservationDto, TableDto } from '@/types'
import {
  apiClient,
  isApiResponseEnvelope,
  normalizeLockoutErrorData,
  type BackendErrorEnvelope,
} from './client'
import {
  normalizeOrder,
  normalizeOrderItem,
  normalizeOrderItemStatus,
  normalizeOrderStatus,
  normalizePaymentMethod,
  normalizeReservation,
  normalizeReservationStatus,
  normalizeStaffRole,
  normalizeTable,
  normalizeTableStatus,
} from './normalize'

describe('API client envelope & 423 lockout helpers', () => {
  it('detects backend ApiResponseEnvelope payloads and leaves raw payloads untouched', () => {
    expect(
      isApiResponseEnvelope({
        success: true,
        statusCode: 200,
        data: { id: '1' },
        timestamp: '2026-11-21T10:00:00Z',
      })
    ).toBe(true)

    expect(isApiResponseEnvelope({ id: '1', bookingCode: 'VD-7K3Q' })).toBe(
      false
    )
    expect(isApiResponseEnvelope(null)).toBe(false)
    expect(isApiResponseEnvelope('ok')).toBe(false)
  })

  it('normalizes 423 lockout payload with lockedUntil ISO timestamp and defaults', () => {
    const nowMs = Date.parse('2026-11-21T10:00:00.000Z')
    const withLockedUntil: BackendErrorEnvelope = {
      message: 'Tài khoản tạm khóa',
      errors: {
        lockedUntil: ['2026-11-21T10:12:30.000Z'],
      },
    }
    const normalized = normalizeLockoutErrorData(withLockedUntil, nowMs)
    expect(normalized.code).toBe('ACCOUNT_LOCKED')
    expect(normalized.remainingMinutes).toBe(13)

    const withoutLockedUntil: BackendErrorEnvelope = {
      message: 'Tài khoản tạm khóa',
    }
    const defaulted = normalizeLockoutErrorData(withoutLockedUntil, nowMs)
    expect(defaulted.code).toBe('ACCOUNT_LOCKED')
    expect(defaulted.remainingMinutes).toBe(15)
  })

  it('unwraps ApiResponseEnvelope and enriches 423 errors through apiClient interceptors', async () => {
    const prevAdapter = apiClient.defaults.adapter
    try {
      apiClient.defaults.adapter = async (config) => {
        if (config.url === '/test-envelope') {
          return {
            status: 200,
            statusText: 'OK',
            headers: new AxiosHeaders(),
            config,
            data: {
              success: true,
              statusCode: 200,
              data: { ok: true, count: 4 },
              timestamp: '2026-11-21T10:00:00Z',
            },
          }
        }
        return Promise.reject({
          isAxiosError: true,
          config,
          response: {
            status: 423,
            statusText: 'Locked',
            headers: new AxiosHeaders(),
            config,
            data: {
              message: 'Tài khoản đang bị khóa',
              errors: {
                lockedUntil: [new Date(Date.now() + 9 * 60_000).toISOString()],
              },
            },
          },
        })
      }

      const okRes = await apiClient.get<{ ok: boolean; count: number }>(
        '/test-envelope'
      )
      expect(okRes.data).toEqual({ ok: true, count: 4 })

      await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
        response: {
          status: 423,
          data: {
            code: 'ACCOUNT_LOCKED',
            remainingMinutes: 9,
          },
        },
      })
    } finally {
      apiClient.defaults.adapter = prevAdapter
    }
  })
})

describe('Live backend enum & DTO normalizers', () => {
  it('maps backend enum names to canonical frontend values', () => {
    expect(normalizeTableStatus('LockedForPayment')).toBe('Locked')
    expect(normalizeTableStatus('Available')).toBe('Available')

    expect(normalizeOrderStatus('Processing')).toBe('Active')
    expect(normalizeOrderStatus('Completed')).toBe('Paid')

    expect(normalizeOrderItemStatus('Hold')).toBe('OnHold')
    expect(normalizeOrderItemStatus('Preparing')).toBe('Cooking')
    expect(normalizeOrderItemStatus('Served')).toBe('Served')

    expect(normalizePaymentMethod('BankTransfer')).toBe('VietQR')
    expect(normalizePaymentMethod('Cash')).toBe('Cash')
    expect(normalizePaymentMethod('Card')).toBe('Card')

    expect(normalizeStaffRole('Admin')).toBe('Manager')
    expect(normalizeStaffRole('Waitstaff')).toBe('Waitstaff')
    expect(normalizeStaffRole('Expediter')).toBe('Expediter')
    expect(normalizeStaffRole('Cashier')).toBe('Cashier')
    expect(normalizeStaffRole('Manager')).toBe('Manager')
  })

  it('normalizes table DTOs including LockedForPayment -> Locked', () => {
    const rawTable = {
      id: '11111111-1111-1111-1111-111111111111',
      tableNumber: 'B07',
      qrCode: 'VD-QR-B07',
      capacity: 6,
      zone: 'MainHall',
      status: 'LockedForPayment' as unknown as TableDto['status'],
      posX: 355,
      posY: 280,
      isActive: true,
      assignedStaffId: null,
      assignedStaffName: null,
      currentOrderId: null,
      currentReservationCode: 'VD-9H1L',
      guestCount: 6,
      holdExpiresAt: '2026-11-21T12:17:00Z',
    } satisfies TableDto

    expect(normalizeTable(rawTable).status).toBe('Locked')
  })

  it('prefers backend guestStatus across all 7 reservation statuses including CheckedIn', () => {
    const baseReservation: ReservationDto = {
      id: 'res-1',
      bookingCode: 'VD-7K3Q',
      guest: {
        id: 'guest-1',
        fullName: 'Nguyễn Văn An',
        phoneNumber: '0901 234 567',
        email: 'an.nguyen@email.com',
      },
      tableId: 'tbl-b05',
      tableNumber: 'B05',
      zone: 'MainHall',
      reservationTime: '2026-11-21T12:00:00Z',
      partySize: 4,
      preOrderedTastingMenuId: null,
      preOrderedTastingMenuName: null,
      durationMinutes: 120,
      status: 'Reserved',
      note: null,
      cancelledAt: null,
      cancelledReason: null,
      holdExpiresAt: null,
      reminderSentAt: null,
      createdAt: '2026-11-21T09:00:00Z',
      deposit: null,
    }

    const cases: Array<{
      backendStatus: string
      guestStatus: ReservationDto['guestStatus']
    }> = [
      { backendStatus: 'Pending', guestStatus: 'PendingDeposit' },
      { backendStatus: 'Confirmed', guestStatus: 'Reserved' },
      { backendStatus: 'Completed', guestStatus: 'CheckedIn' },
      { backendStatus: 'Cancelled', guestStatus: 'Expired_Cancelled' },
      { backendStatus: 'Cancelled', guestStatus: 'Cancelled_Refunded' },
      { backendStatus: 'Cancelled', guestStatus: 'Cancelled_Forfeited' },
      { backendStatus: 'Cancelled', guestStatus: 'RefundRejected' },
    ]

    for (const c of cases) {
      const dto = {
        ...baseReservation,
        status: c.backendStatus as unknown as ReservationDto['status'],
        guestStatus: c.guestStatus,
      }
      expect(normalizeReservationStatus(dto)).toBe(c.guestStatus)
      expect(normalizeReservation(dto).status).toBe(c.guestStatus)
    }

    // Mock fallback when guestStatus is absent
    expect(
      normalizeReservationStatus({
        ...baseReservation,
        status: 'Completed' as unknown as ReservationDto['status'],
      })
    ).toBe('CheckedIn')
  })

  it('normalizes order item empty GUIDs and backend order/item statuses', () => {
    const normalizedItem = normalizeOrderItem({
      id: 'oi-1',
      orderId: 'ord-1',
      menuItemId: '00000000-0000-0000-0000-000000000000',
      tastingMenuId: 'set-1',
      itemName: 'Set Menu Thượng Hạng',
      courseType: 'Appetizer',
      quantity: 4,
      unitPrice: 1_800_000,
      status: 'Hold' as unknown as 'OnHold',
      note: null,
      isRemake: false,
      remakeCount: 0,
      isPriority: false,
      prepTimeMinutes: 0,
      cookingStartedAt: null,
      servedAt: null,
      servedById: null,
    })
    expect(normalizedItem.menuItemId).toBeNull()
    expect(normalizedItem.status).toBe('OnHold')

    const rawOrder: OrderDto = {
      id: 'ord-1',
      tableId: 'tbl-b05',
      tableNumber: 'B05',
      reservationId: 'res-1',
      createById: 'staff-1',
      createByName: 'Trần Thị Mai',
      status: 'Processing' as unknown as OrderDto['status'],
      guestCount: 4,
      openedAt: '2026-11-21T12:00:00Z',
      closedAt: null,
      items: [
        {
          id: 'oi-dish-1',
          orderId: 'ord-1',
          menuItemId: 'item-sup-bao-ngu',
          tastingMenuId: 'set-thuong-hang',
          itemName: 'Súp bào ngư thượng hạng',
          courseType: 'Appetizer',
          quantity: 4,
          unitPrice: 350_000,
          status: 'Preparing' as unknown as 'Cooking',
          note: null,
          isRemake: false,
          remakeCount: 0,
          isPriority: false,
          prepTimeMinutes: 12,
          cookingStartedAt: '2026-11-21T12:00:00Z',
          servedAt: null,
          servedById: null,
        },
      ],
    }

    const normalized = normalizeOrder(rawOrder)
    expect(normalized.status).toBe('Active')
    expect(normalized.items[0].status).toBe('Cooking')
  })
})
