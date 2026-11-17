import { realtimeClient } from '@/services/realtime/client'
import type {
  CheckInRequest,
  OrderDto,
  TransferTableRequest,
  UpdateTableStatusRequest,
  WalkInRequest,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import { fail, ok, type MockRouteDefinition } from '../types'
import { expandSetMenuOrderItems } from './orderHelpers'

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').trim()
}

export const tableRoutes: MockRouteDefinition[] = [
  {
    id: 13,
    method: 'GET',
    pattern: '/tables',
    access: ['Waitstaff', 'Expediter', 'Cashier', 'Manager'],
    handler: ({ db }) => ok(db.tables.filter((t) => t.isActive)),
  },
  {
    id: 14,
    method: 'GET',
    pattern: '/tables/:id',
    access: ['Waitstaff', 'Expediter', 'Cashier', 'Manager'],
    handler: ({ db, params }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      const activeOrder = table.currentOrderId
        ? db.orders.find((o) => o.id === table.currentOrderId) ?? null
        : null
      const activeReservation = table.currentReservationCode
        ? db.reservations.find(
            (r) => r.bookingCode === table.currentReservationCode
          ) ?? null
        : null
      return ok({ table, activeOrder, activeReservation })
    },
  },
  {
    id: 10,
    method: 'POST',
    pattern: '/tables/:id/check-in',
    access: ['Waitstaff', 'Cashier', 'Manager'],
    handler: ({ db, params, body, user, now }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      if (table.status !== 'Reserved') {
        return fail(409, 'Bàn không ở trạng thái Đã đặt để check-in')
      }

      const payload = body as CheckInRequest
      const queryRaw = payload.reservationCode.trim()
      const queryCode = queryRaw.toUpperCase()
      const queryPhone = normalizePhone(queryRaw)
      const matchingReserved = db.reservations.filter(
        (r) =>
          r.status === 'Reserved' &&
          (r.bookingCode.toUpperCase() === queryCode ||
            (queryPhone.length >= 6 &&
              normalizePhone(r.guest.phoneNumber) === queryPhone))
      )
      const reservation =
        matchingReserved.find((r) => r.tableId === table.id) ??
        matchingReserved[0]
      if (!reservation) {
        return fail(404, 'Không tìm thấy đơn đặt bàn hợp lệ khớp với mã hoặc số điện thoại')
      }

      const nowIso = now.toISOString()
      table.status = 'Occupied'
      table.assignedStaffId = user?.id ?? null
      table.assignedStaffName = user?.fullName ?? null
      table.guestCount = reservation.partySize
      table.currentReservationCode = reservation.bookingCode

      let createdOrder: OrderDto | null = null
      if (reservation.preOrderedTastingMenuId) {
        const orderId = nextMockId('ord')
        const { items } = expandSetMenuOrderItems(
          db,
          orderId,
          reservation.preOrderedTastingMenuId,
          reservation.partySize,
          nowIso
        )
        if (items && items.length > 0) {
          createdOrder = {
            id: orderId,
            tableId: table.id,
            tableNumber: table.tableNumber,
            reservationId: reservation.id,
            createById: user?.id ?? 'staff-waitstaff-1',
            createByName: user?.fullName ?? 'Trần Thị Mai',
            status: 'Active',
            guestCount: reservation.partySize,
            openedAt: nowIso,
            closedAt: null,
            items,
          }
          db.orders.push(createdOrder)
          table.currentOrderId = orderId
        }
      }

      saveMockDb(db)
      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: 'Occupied',
      })
      if (createdOrder) {
        realtimeClient.publish('order:updated', {
          orderId: createdOrder.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
        })
      }
      return ok({ table, order: createdOrder })
    },
  },
  {
    id: 11,
    method: 'POST',
    pattern: '/tables/:id/walk-in',
    access: ['Waitstaff', 'Cashier', 'Manager'],
    handler: ({ db, params, body, user }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      if (table.status !== 'Available') {
        return fail(409, 'Bàn không ở trạng thái Trống')
      }
      const { guestCount } = body as WalkInRequest
      if (!guestCount || guestCount < 1 || guestCount > table.capacity) {
        return fail(400, 'Số lượng khách không hợp lệ')
      }

      table.status = 'Occupied'
      table.assignedStaffId = user?.id ?? null
      table.assignedStaffName = user?.fullName ?? null
      table.guestCount = guestCount
      table.currentReservationCode = null
      saveMockDb(db)

      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: 'Occupied',
      })
      return ok(table)
    },
  },
  {
    id: 12,
    method: 'POST',
    pattern: '/tables/:sourceId/transfer',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db, params, body }) => {
      const source = db.tables.find(
        (t) => t.id === params.sourceId && t.isActive
      )
      const { targetTableId } = body as TransferTableRequest
      const target = db.tables.find((t) => t.id === targetTableId && t.isActive)

      if (!source || !target) return fail(404, 'Không tìm thấy bàn')
      if (source.status !== 'Occupied') {
        return fail(409, 'Chỉ có thể đổi từ bàn đang phục vụ')
      }
      if (target.status !== 'Available') {
        return fail(409, 'Bàn đích không còn trống')
      }
      if ((source.guestCount ?? 1) > target.capacity) {
        return fail(400, 'Sức chứa bàn đích không đủ cho số khách hiện tại')
      }

      target.status = 'Occupied'
      target.assignedStaffId = source.assignedStaffId
      target.assignedStaffName = source.assignedStaffName
      target.currentOrderId = source.currentOrderId
      target.currentReservationCode = source.currentReservationCode
      target.guestCount = source.guestCount

      if (source.currentOrderId) {
        const order = db.orders.find((o) => o.id === source.currentOrderId)
        if (order) {
          order.tableId = target.id
          order.tableNumber = target.tableNumber
        }
      }
      if (source.currentReservationCode) {
        const res = db.reservations.find(
          (r) => r.bookingCode === source.currentReservationCode
        )
        if (res) {
          res.tableId = target.id
          res.tableNumber = target.tableNumber
          res.zone = target.zone
        }
      }
      for (const req of db.serviceRequests) {
        if (req.tableId === source.id && req.status === 'Pending') {
          req.tableId = target.id
          req.tableNumber = target.tableNumber
        }
      }

      source.status = 'Cleaning'
      source.assignedStaffId = null
      source.assignedStaffName = null
      source.currentOrderId = null
      source.currentReservationCode = null
      source.guestCount = null

      saveMockDb(db)
      realtimeClient.publish('table:status-changed', {
        tableId: source.id,
        tableNumber: source.tableNumber,
        status: 'Cleaning',
      })
      realtimeClient.publish('table:status-changed', {
        tableId: target.id,
        tableNumber: target.tableNumber,
        status: 'Occupied',
      })
      return ok({ sourceTable: source, targetTable: target })
    },
  },
  {
    id: 15,
    method: 'PATCH',
    pattern: '/tables/:id/status',
    access: ['Waitstaff', 'Cashier', 'Manager'],
    handler: ({ db, params, body }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      const { status } = body as UpdateTableStatusRequest
      table.status = status
      if (status !== 'PaymentPending') {
        table.checkoutRequestedAt = null
      }
      if (status === 'Available') {
        table.assignedStaffId = null
        table.assignedStaffName = null
        table.currentOrderId = null
        table.currentReservationCode = null
        table.guestCount = null
        table.holdExpiresAt = null
      }
      saveMockDb(db)
      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status,
      })
      return ok(table)
    },
  },
]
