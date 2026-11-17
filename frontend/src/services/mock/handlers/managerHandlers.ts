import { realtimeClient } from '@/services/realtime/client'
import type {
  CreateStaffRequest,
  CreateTableRequest,
  ManualRefundRequest,
  ResetPasswordRequest,
  StaffRole,
  TableDto,
  TableZone,
  ToggleStaffStatusRequest,
  UpdateFloorPlanLayoutRequest,
  UpdateStaffRequest,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import type { MockStaffRecord } from '../seed'
import { fail, ok, type MockRouteDefinition } from '../types'

function sanitizeStaff(staff: MockStaffRecord) {
  const { password: _password, ...dto } = staff
  return dto
}

export const managerRoutes: MockRouteDefinition[] = [
  {
    id: 47,
    method: 'PUT',
    pattern: '/manager/tables/layout',
    access: ['Manager'],
    handler: ({ db, body }) => {
      const { positions } = body as UpdateFloorPlanLayoutRequest
      for (const pos of positions) {
        const table = db.tables.find((t) => t.id === pos.tableId)
        if (table) {
          table.posX = pos.posX
          table.posY = pos.posY
        }
      }
      saveMockDb(db)
      return ok(db.tables.filter((t) => t.isActive))
    },
  },
  {
    id: 48,
    method: 'POST',
    pattern: '/manager/tables',
    access: ['Manager'],
    handler: ({ db, body }) => {
      const input = body as CreateTableRequest
      const tableNumber = input.tableNumber.trim().toUpperCase()
      if (
        db.tables.some(
          (t) => t.isActive && t.tableNumber.toUpperCase() === tableNumber
        )
      ) {
        return fail(409, 'Số bàn đã tồn tại')
      }
      const table: TableDto = {
        id: nextMockId('tbl'),
        tableNumber,
        qrCode: `VD-QR-${tableNumber}`,
        capacity: input.capacity,
        zone: input.zone,
        status: 'Available',
        posX: input.posX,
        posY: input.posY,
        isActive: true,
        assignedStaffId: null,
        assignedStaffName: null,
        currentOrderId: null,
        currentReservationCode: null,
        guestCount: null,
        holdExpiresAt: null,
      }
      db.tables.push(table)
      saveMockDb(db)
      return ok(table, 201)
    },
  },
  {
    id: 49,
    method: 'DELETE',
    pattern: '/manager/tables/:id',
    access: ['Manager'],
    handler: ({ db, params }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      if (
        table.status === 'Occupied' ||
        table.status === 'Reserved' ||
        table.status === 'Locked' ||
        table.status === 'PaymentPending'
      ) {
        return fail(409, 'Không thể xóa bàn đang có khách hoặc đã đặt trước')
      }
      table.isActive = false
      saveMockDb(db)
      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: table.status,
      })
      return ok({ deleted: true })
    },
  },
  {
    id: 51,
    method: 'GET',
    pattern: '/manager/refunds',
    access: ['Manager'],
    handler: ({ db }) => {
      const list = db.reservations
        .filter(
          (r) =>
            r.status === 'Cancelled_Forfeited' ||
            r.status === 'Cancelled_Refunded' ||
            r.status === 'RefundRejected'
        )
        .map((r) => {
          const cancelledMs = r.cancelledAt ? Date.parse(r.cancelledAt) : Date.now()
          const hours =
            (Date.parse(r.reservationTime) - cancelledMs) / 3_600_000
          const log = db.auditLogs.find(
            (a) => a.entityName === 'Reservation' && a.entityId === r.id
          )
          return {
            reservation: r,
            hoursBeforeReservation: Math.max(0, Number(hours.toFixed(1))),
            requestedAt: r.cancelledAt ?? r.createdAt,
            auditReason: log?.reason ?? null,
          }
        })
      return ok(list)
    },
  },
  {
    id: 50,
    method: 'POST',
    pattern: '/manager/reservations/:id/manual-refund',
    access: ['Manager'],
    handler: ({ db, params, body, user, now }) => {
      const reservation = db.reservations.find((r) => r.id === params.id)
      if (!reservation) return fail(404, 'Không tìm thấy đơn đặt bàn')
      const { approved, reason } = body as ManualRefundRequest
      if (!reason || !reason.trim()) {
        return fail(400, 'Vui lòng nhập lý do xử lý hoàn cọc')
      }

      if (approved) {
        reservation.status = 'Cancelled_Refunded'
        if (reservation.deposit) {
          reservation.deposit.status = 'Refunded'
          reservation.deposit.refundAmount = reservation.deposit.amount
        }
      } else {
        reservation.status = 'RefundRejected'
      }

      db.auditLogs.unshift({
        id: nextMockId('audit'),
        staffId: user?.id ?? 'staff-manager-1',
        action: approved ? 'ManualRefundApproved' : 'ManualRefundRejected',
        entityName: 'Reservation',
        entityId: reservation.id,
        reason: reason.trim(),
        createdAt: now.toISOString(),
      })
      saveMockDb(db)
      return ok(reservation)
    },
  },
  {
    id: 56,
    method: 'GET',
    pattern: '/manager/staff',
    access: ['Manager'],
    handler: ({ db, query }) => {
      const role = query.get('role') as StaffRole | null
      const search = (query.get('search') || '').trim().toLowerCase()
      const list = db.staffs
        .filter((s) => {
          if (role && s.role !== role) return false
          if (search) {
            const hit =
              s.fullName.toLowerCase().includes(search) ||
              s.email.toLowerCase().includes(search) ||
              s.username.toLowerCase().includes(search)
            if (!hit) return false
          }
          return true
        })
        .map(sanitizeStaff)
      return ok(list)
    },
  },
  {
    id: 57,
    method: 'GET',
    pattern: '/manager/staff/:id',
    access: ['Manager'],
    handler: ({ db, params }) => {
      const staff = db.staffs.find((s) => s.id === params.id)
      if (!staff) return fail(404, 'Không tìm thấy nhân viên')
      return ok(sanitizeStaff(staff))
    },
  },
  {
    id: 52,
    method: 'POST',
    pattern: '/manager/staff',
    access: ['Manager'],
    handler: ({ db, body, now }) => {
      const input = body as CreateStaffRequest
      const email = input.email.trim().toLowerCase()
      const username = input.username.trim().toLowerCase()
      if (db.staffs.some((s) => s.email.toLowerCase() === email)) {
        return fail(409, 'Email đã được sử dụng cho tài khoản khác')
      }
      if (db.staffs.some((s) => s.username.toLowerCase() === username)) {
        return fail(409, 'Tên đăng nhập đã tồn tại')
      }

      const staff: MockStaffRecord = {
        id: nextMockId('staff'),
        fullName: input.fullName.trim(),
        phoneNumber: input.phoneNumber.trim(),
        username,
        email,
        role: input.role,
        isActive: true,
        failedLoginCount: 0,
        lockoutEnd: null,
        createdAt: now.toISOString(),
        password: input.initialPassword ?? 'VinDining@2026',
      }
      db.staffs.push(staff)
      saveMockDb(db)
      return ok(sanitizeStaff(staff), 201)
    },
  },
  {
    id: 53,
    method: 'PUT',
    pattern: '/manager/staff/:id',
    access: ['Manager'],
    handler: ({ db, params, body }) => {
      const staff = db.staffs.find((s) => s.id === params.id)
      if (!staff) return fail(404, 'Không tìm thấy nhân viên')
      const input = body as UpdateStaffRequest
      const email = input.email.trim().toLowerCase()
      if (
        db.staffs.some(
          (s) => s.id !== staff.id && s.email.toLowerCase() === email
        )
      ) {
        return fail(409, 'Email đã được sử dụng cho tài khoản khác')
      }
      staff.fullName = input.fullName.trim()
      staff.phoneNumber = input.phoneNumber.trim()
      staff.email = email
      staff.role = input.role
      saveMockDb(db)
      return ok(sanitizeStaff(staff))
    },
  },
  {
    id: 54,
    method: 'POST',
    pattern: '/manager/staff/:id/reset-password',
    access: ['Manager'],
    handler: ({ db, params, body }) => {
      const staff = db.staffs.find((s) => s.id === params.id)
      if (!staff) return fail(404, 'Không tìm thấy nhân viên')
      const { newPassword } = body as ResetPasswordRequest
      if (!newPassword || newPassword.length < 6) {
        return fail(400, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      }
      staff.password = newPassword
      staff.failedLoginCount = 0
      staff.lockoutEnd = null
      saveMockDb(db)
      return ok({ success: true })
    },
  },
  {
    id: 55,
    method: 'PATCH',
    pattern: '/manager/staff/:id/status',
    access: ['Manager'],
    handler: ({ db, params, body }) => {
      const staff = db.staffs.find((s) => s.id === params.id)
      if (!staff) return fail(404, 'Không tìm thấy nhân viên')
      const { isActive } = body as ToggleStaffStatusRequest
      staff.isActive = isActive
      if (isActive) {
        staff.failedLoginCount = 0
        staff.lockoutEnd = null
      }
      saveMockDb(db)
      return ok(sanitizeStaff(staff))
    },
  },
  {
    id: 58,
    method: 'GET',
    pattern: '/manager/reports/dashboard',
    access: ['Manager'],
    handler: ({ db, query }) => {
      const zone = query.get('zone') as TableZone | null
      const tablesInScope = db.tables.filter(
        (t) => t.isActive && (!zone || t.zone === zone)
      )
      const tableIds = new Set(tablesInScope.map((t) => t.id))

      const paidInvoices = db.invoices.filter(
        (inv) => inv.isPaid && tableIds.has(inv.tableId)
      )
      const totalRevenue = paidInvoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      )

      const activeOccupied = tablesInScope.filter(
        (t) => t.status === 'Occupied' || t.status === 'PaymentPending'
      )
      const occupancyRate =
        tablesInScope.length > 0
          ? Number(((activeOccupied.length / tablesInScope.length) * 100).toFixed(1))
          : 0

      const reservationsInScope = db.reservations.filter((r) =>
        zone ? r.zone === zone : true
      )
      const cancelledCount = reservationsInScope.filter(
        (r) =>
          r.status === 'Cancelled_Forfeited' ||
          r.status === 'Cancelled_Refunded' ||
          r.status === 'RefundRejected'
      ).length
      const cancellationRate =
        reservationsInScope.length > 0
          ? Number(
              ((cancelledCount / reservationsInScope.length) * 100).toFixed(1)
            )
          : 0

      const totalGuests =
        activeOccupied.reduce((sum, t) => sum + (t.guestCount ?? 0), 0) +
        paidInvoices.length * 4

      const itemTotals = new Map<
        string,
        { menuItemId: string; name: string; quantitySold: number; revenue: number }
      >()
      for (const order of db.orders) {
        if (!tableIds.has(order.tableId)) continue
        for (const item of order.items) {
          if (item.status !== 'Served' || !item.menuItemId) continue
          const existing = itemTotals.get(item.menuItemId)
          if (existing) {
            existing.quantitySold += item.quantity
            existing.revenue += item.quantity * item.unitPrice
          } else {
            itemTotals.set(item.menuItemId, {
              menuItemId: item.menuItemId,
              name: item.itemName,
              quantitySold: item.quantity,
              revenue: item.quantity * item.unitPrice,
            })
          }
        }
      }

      const zones: TableZone[] = zone ? [zone] : ['MainHall', 'VIP', 'Balcony']
      const revenueByZone = zones.map((z) => {
        const zTableIds = new Set(
          db.tables.filter((t) => t.isActive && t.zone === z).map((t) => t.id)
        )
        const zInvoices = db.invoices.filter(
          (inv) => inv.isPaid && zTableIds.has(inv.tableId)
        )
        const zRes = db.reservations.filter((r) => r.zone === z)
        return {
          zone: z,
          revenue: zInvoices.reduce((s, inv) => s + inv.totalAmount, 0),
          guestCount: zRes.reduce((s, r) => s + r.partySize, 0),
          reservationCount: zRes.length,
        }
      })

      return ok({
        totalRevenue,
        totalGuests,
        occupancyRate,
        cancellationRate,
        bestSellers: Array.from(itemTotals.values()).sort(
          (a, b) => b.quantitySold - a.quantitySold
        ),
        revenueByZone,
      })
    },
  },
  {
    id: 59,
    method: 'GET',
    pattern: '/manager/reports/export',
    access: ['Manager'],
    handler: ({ query, now }) => {
      const format = query.get('format') === 'pdf' ? 'pdf' : 'excel'
      return ok({
        fileName: `vindining-bao-cao-${now.toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
        format,
        generatedAt: now.toISOString(),
      })
    },
  },
]
