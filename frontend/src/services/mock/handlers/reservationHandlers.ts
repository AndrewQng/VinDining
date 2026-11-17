import {
  calculateDepositAmount,
  computeHoldExpiresAt,
  evaluateCancellationPolicy,
  isHoldExpired,
} from '@/domain'
import { realtimeClient } from '@/services/realtime/client'
import type {
  CancelReservationRequest,
  CreateReservationRequest,
  ReservationDto,
  ReservationStatus,
  TableZone,
  VnPayIpnRequest,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import { fail, ok, type MockRouteDefinition } from '../types'

const SLOT_TIMES = ['18:00', '18:30', '19:00', '19:30', '20:00']

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').trim()
}

export const reservationRoutes: MockRouteDefinition[] = [
  {
    id: 9,
    method: 'GET',
    pattern: '/reservations/available-slots',
    access: 'Public',
    handler: ({ db, query }) => {
      const partySize = Number(query.get('partySize') || '2')
      const zone = query.get('zone') as TableZone | null
      const zoneTablesAll = db.tables.filter(
        (t) => t.isActive && (!zone || t.zone === zone)
      )
      const candidates = zoneTablesAll.filter(
        (t) => t.capacity >= partySize && t.status === 'Available'
      )

      const slots = SLOT_TIMES.map((time) => ({
        time,
        availableTables: candidates.map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          zone: t.zone,
          posX: t.posX,
          posY: t.posY,
        })),
        zoneTables: zoneTablesAll.map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          zone: t.zone,
          status: t.status,
          posX: t.posX,
          posY: t.posY,
          isSelectable: t.status === 'Available' && t.capacity >= partySize,
        })),
      }))
      return ok(slots)
    },
  },
  {
    id: 4,
    method: 'POST',
    pattern: '/reservations',
    access: 'Guest',
    handler: ({ db, body, now }) => {
      const input = body as CreateReservationRequest
      const table = db.tables.find((t) => t.id === input.tableId && t.isActive)
      if (!table) {
        return fail(404, 'Không tìm thấy bàn ăn')
      }
      if (table.status !== 'Available') {
        return fail(409, 'Bàn vừa được giữ hoặc không còn trống')
      }
      if (input.partySize < 1 || input.partySize > table.capacity) {
        return fail(400, 'Số lượng khách không phù hợp với sức chứa bàn')
      }

      const tastingMenu = input.preOrderedTastingMenuId
        ? db.tastingMenus.find(
            (m) => m.id === input.preOrderedTastingMenuId && m.isActive
          )
        : null
      if (input.preOrderedTastingMenuId && !tastingMenu) {
        return fail(404, 'Không tìm thấy Set Menu đã chọn')
      }

      const depositAmount = calculateDepositAmount({
        guestCount: input.partySize,
        setMenuPricePerGuest: tastingMenu?.price ?? null,
      })

      const holdExpiresAt = computeHoldExpiresAt(now).toISOString()
      const bookingCode = `VD-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const reservationId = nextMockId('res')
      const nowIso = now.toISOString()

      const reservation: ReservationDto = {
        id: reservationId,
        bookingCode,
        guest: {
          id: nextMockId('guest'),
          fullName: input.fullName.trim(),
          phoneNumber: input.phoneNumber.trim(),
          email: input.email.trim(),
        },
        tableId: table.id,
        tableNumber: table.tableNumber,
        zone: table.zone,
        reservationTime: input.reservationTime,
        partySize: input.partySize,
        preOrderedTastingMenuId: tastingMenu?.id ?? null,
        preOrderedTastingMenuName: tastingMenu?.name ?? null,
        durationMinutes: 120,
        status: 'PendingDeposit',
        note: input.note?.trim() || null,
        cancelledAt: null,
        cancelledReason: null,
        holdExpiresAt,
        reminderSentAt: null,
        createdAt: nowIso,
        deposit: {
          id: nextMockId('dep'),
          reservationId,
          amount: depositAmount,
          transactionId: `VNP-${bookingCode}`,
          paymentMethod: input.paymentMethod ?? 'VietQR',
          status: 'Pending',
          paidAt: null,
          refundAmount: null,
          createdAt: nowIso,
        },
      }

      table.status = 'Locked'
      table.currentReservationCode = bookingCode
      table.guestCount = input.partySize
      table.holdExpiresAt = holdExpiresAt

      db.reservations.unshift(reservation)
      saveMockDb(db)

      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: table.status,
      })

      return ok(
        {
          reservation,
          depositAmount,
          holdExpiresAt,
          paymentUrl: `/vnpay-mock?code=${encodeURIComponent(bookingCode)}`,
        },
        201
      )
    },
  },
  {
    id: 5,
    method: 'POST',
    pattern: '/payments/vnpay-ipn',
    access: 'Public',
    handler: ({ db, body, now }) => {
      const payload = body as VnPayIpnRequest
      const reservation = db.reservations.find(
        (r) => r.bookingCode.toUpperCase() === payload.bookingCode.toUpperCase()
      )
      if (!reservation) {
        return fail(404, 'Không tìm thấy đơn đặt bàn')
      }
      if (reservation.status !== 'PendingDeposit') {
        return fail(409, 'Đơn đặt bàn không ở trạng thái chờ đặt cọc')
      }
      if (isHoldExpired(reservation.holdExpiresAt, now)) {
        reservation.status = 'Expired_Cancelled'
        const tbl = db.tables.find((t) => t.id === reservation.tableId)
        if (tbl && tbl.status === 'Locked') {
          tbl.status = 'Available'
          tbl.currentReservationCode = null
          tbl.guestCount = null
          tbl.holdExpiresAt = null
        }
        saveMockDb(db)
        return fail(410, 'Phiên giữ chỗ 17 phút đã hết hạn')
      }

      const table = db.tables.find((t) => t.id === reservation.tableId)
      if (payload.responseCode === '00') {
        reservation.status = 'Reserved'
        reservation.holdExpiresAt = null
        if (reservation.deposit) {
          reservation.deposit.status = 'Paid'
          reservation.deposit.paymentMethod = payload.paymentMethod
          reservation.deposit.transactionId = payload.transactionId
          reservation.deposit.paidAt = now.toISOString()
        }
        if (table) {
          table.status = 'Reserved'
          table.holdExpiresAt = null
          realtimeClient.publish('table:status-changed', {
            tableId: table.id,
            tableNumber: table.tableNumber,
            status: 'Reserved',
          })
        }
        saveMockDb(db)
        return ok({ success: true, reservation })
      }

      reservation.status = 'Expired_Cancelled'
      reservation.holdExpiresAt = null
      if (table) {
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
      saveMockDb(db)
      return fail(400, 'Thanh toán tiền cọc không thành công')
    },
  },
  {
    id: 6,
    method: 'POST',
    pattern: '/reservations/cancel',
    access: 'Guest',
    handler: ({ db, body, now }) => {
      const payload = body as CancelReservationRequest
      const reservation = db.reservations.find(
        (r) =>
          r.bookingCode.toUpperCase() === payload.bookingCode.trim().toUpperCase()
      )
      if (!reservation) {
        return fail(404, 'Không tìm thấy đơn đặt bàn')
      }
      if (
        normalizePhone(reservation.guest.phoneNumber) !==
        normalizePhone(payload.phoneNumber)
      ) {
        return fail(403, 'Số điện thoại không khớp với đơn đặt bàn')
      }
      if (reservation.status !== 'Reserved') {
        return fail(409, 'Đơn đặt bàn không thể hủy ở trạng thái hiện tại')
      }

      const depositAmount = reservation.deposit?.amount ?? 0
      const policy = evaluateCancellationPolicy(
        reservation.reservationTime,
        now,
        depositAmount
      )

      if (!policy.isEligibleForFullRefund && !payload.confirmForfeit) {
        return fail(
          409,
          'Hủy dưới 4 tiếng trước giờ hẹn sẽ không được hoàn tiền cọc',
          { code: 'FORFEIT_CONFIRMATION_REQUIRED' }
        )
      }

      reservation.status = policy.resultingReservationStatus
      reservation.cancelledAt = now.toISOString()
      reservation.cancelledReason = payload.reason.trim()
      if (reservation.deposit) {
        reservation.deposit.status = policy.resultingDepositStatus
        reservation.deposit.refundAmount = policy.refundAmount
      }

      const table = db.tables.find((t) => t.id === reservation.tableId)
      if (table && table.currentReservationCode === reservation.bookingCode) {
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

      saveMockDb(db)
      return ok({
        reservation,
        refunded: policy.isEligibleForFullRefund,
        refundAmount: policy.refundAmount,
      })
    },
  },
  {
    id: 7,
    method: 'GET',
    pattern: '/reservations',
    access: ['Cashier', 'Manager'],
    handler: ({ db, query }) => {
      const status = query.get('status') as ReservationStatus | null
      const search = (query.get('search') || '').trim().toLowerCase()
      const filtered = db.reservations.filter((r) => {
        if (status && r.status !== status) return false
        if (search) {
          const hit =
            r.bookingCode.toLowerCase().includes(search) ||
            r.guest.fullName.toLowerCase().includes(search) ||
            normalizePhone(r.guest.phoneNumber).includes(normalizePhone(search))
          if (!hit) return false
        }
        return true
      })
      return ok(filtered)
    },
  },
  {
    id: 8,
    method: 'GET',
    pattern: '/reservations/:code',
    access: 'Public',
    handler: ({ db, params, query, user }) => {
      const code = params.code.trim().toUpperCase()
      const reservation = db.reservations.find(
        (r) => r.bookingCode.toUpperCase() === code
      )

      if (!user) {
        if (query.has('phone')) {
          const phone = query.get('phone') ?? ''
          if (
            !reservation ||
            !phone.trim() ||
            normalizePhone(phone) !== normalizePhone(reservation.guest.phoneNumber)
          ) {
            return fail(
              404,
              'Không tìm thấy thông tin đặt bàn khớp với mã và số điện thoại đã nhập'
            )
          }
          return ok(reservation)
        }
        if (!reservation || reservation.status !== 'PendingDeposit') {
          return fail(404, 'Không tìm thấy phiên giữ chỗ đang chờ thanh toán')
        }
        return ok(reservation)
      }

      if (!reservation) {
        return fail(404, 'Không tìm thấy mã đặt bàn')
      }
      return ok(reservation)
    },
  },
]
