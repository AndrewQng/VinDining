import {
  buildDashboardReportMetrics,
  canModifyStaffAccount,
  getReportPeriodWindow,
  validateFloorPlanLayout,
} from '@/domain'
import { realtimeClient } from '@/services/realtime/client'
import type {
  CreateStaffRequest,
  CreateTableRequest,
  ManualRefundRequest,
  ReportPeriod,
  ResetPasswordRequest,
  StaffRole,
  TableDto,
  TableZone,
  ToggleStaffStatusRequest,
  UpdateFloorPlanLayoutRequest,
  UpdateStaffRequest,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import { getHistorical120DayData } from '../historicalSeed'
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
      const check = validateFloorPlanLayout(positions)
      if (!check.valid) {
        return fail(
          400,
          Object.values(check.errors)[0] ?? 'Cấu hình bàn không hợp lệ'
        )
      }
      for (const pos of positions) {
        const table = db.tables.find((t) => t.id === pos.tableId)
        if (!table) continue
        table.posX = Math.round(pos.posX)
        table.posY = Math.round(pos.posY)
        if (pos.capacity !== undefined) table.capacity = pos.capacity
        if (pos.zone !== undefined) table.zone = pos.zone
        if (pos.tableNumber !== undefined && pos.tableNumber.trim()) {
          table.tableNumber = pos.tableNumber.trim().toUpperCase()
        }
      }
      saveMockDb(db)
      const first = db.tables.find((t) => t.isActive)
      if (first) {
        realtimeClient.publish('table:status-changed', {
          tableId: first.id,
          tableNumber: first.tableNumber,
          status: first.status,
        })
      }
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
      if (!tableNumber) {
        return fail(400, 'Vui lòng nhập số hiệu bàn')
      }
      if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 20) {
        return fail(400, 'Số ghế phải từ 1 đến 20')
      }
      if (
        db.tables.some(
          (t) => t.isActive && t.tableNumber.toUpperCase() === tableNumber
        )
      ) {
        return fail(409, 'Số hiệu bàn đã tồn tại')
      }
      const table: TableDto = {
        id: nextMockId('tbl'),
        tableNumber,
        qrCode: `VD-QR-${tableNumber}`,
        capacity: input.capacity,
        zone: input.zone,
        status: 'Available',
        posX: Math.round(input.posX),
        posY: Math.round(input.posY),
        isActive: true,
        assignedStaffId: null,
        assignedStaffName: null,
        currentOrderId: null,
        currentReservationCode: null,
        guestCount: null,
        holdExpiresAt: null,
        checkoutRequestedAt: null,
      }
      db.tables.push(table)
      saveMockDb(db)
      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: table.status,
      })
      return ok(table, 201)
    },
  },
  {
    id: 49,
    method: 'DELETE',
    pattern: '/manager/tables/:id',
    access: ['Manager'],
    handler: ({ db, params, now }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')

      const hasFutureReservation = db.reservations.some(
        (r) =>
          r.tableId === table.id &&
          (r.status === 'Reserved' || r.status === 'PendingDeposit') &&
          Date.parse(r.reservationTime) > now.getTime()
      )

      if (
        table.status === 'Occupied' ||
        table.status === 'Reserved' ||
        table.status === 'Locked' ||
        table.status === 'PaymentPending' ||
        hasFutureReservation
      ) {
        return fail(
          409,
          'Bàn đang có khách hoặc đã đặt trước. Vui lòng chuyển khách trước khi xóa.'
        )
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
    handler: ({ db, now }) => {
      const exceptionAuditByReservation = new Map<
        string,
        (typeof db.auditLogs)[number]
      >()
      for (const entry of db.auditLogs) {
        if (
          entry.entityName === 'Reservation' &&
          (entry.action === 'ManualRefundApproved' ||
            entry.action === 'ManualRefundRejected') &&
          !exceptionAuditByReservation.has(entry.entityId)
        ) {
          exceptionAuditByReservation.set(entry.entityId, entry)
        }
      }

      const list = db.reservations
        .filter((r) => {
          if (r.status === 'Cancelled_Forfeited') return true
          return exceptionAuditByReservation.has(r.id)
        })
        .map((r) => {
          const cancelledMs = r.cancelledAt
            ? Date.parse(r.cancelledAt)
            : now.getTime()
          const hours =
            (Date.parse(r.reservationTime) - cancelledMs) / 3_600_000
          const log = exceptionAuditByReservation.get(r.id)
          const decisionAction =
            log?.action === 'ManualRefundApproved' ||
            log?.action === 'ManualRefundRejected'
              ? log.action
              : null
          return {
            reservation: r,
            hoursBeforeReservation: Math.max(0, Number(hours.toFixed(1))),
            requestedAt: r.cancelledAt ?? r.createdAt,
            auditReason: log?.reason ?? null,
            processedAt: log?.createdAt ?? null,
            decisionAction,
          }
        })
        .sort(
          (a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt)
        )
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
      if (!input.fullName.trim() || !email || !username) {
        return fail(400, 'Vui lòng điền đầy đủ họ tên, email và tên đăng nhập')
      }
      if (db.staffs.some((s) => s.email.toLowerCase() === email)) {
        return fail(409, 'Email đã được sử dụng cho tài khoản khác')
      }
      if (db.staffs.some((s) => s.username.toLowerCase() === username)) {
        return fail(409, 'Tên đăng nhập đã tồn tại')
      }

      const temporaryPassword =
        input.initialPassword?.trim() || 'VinDining@2026'

      const staff: MockStaffRecord = {
        id: nextMockId('staff'),
        fullName: input.fullName.trim(),
        phoneNumber: (input.phoneNumber ?? '').trim(),
        username,
        email,
        role: input.role,
        isActive: true,
        failedLoginCount: 0,
        lockoutEnd: null,
        createdAt: now.toISOString(),
        password: temporaryPassword,
      }
      db.staffs.push(staff)
      saveMockDb(db)
      return ok({ ...sanitizeStaff(staff), temporaryPassword }, 201)
    },
  },
  {
    id: 53,
    method: 'PUT',
    pattern: '/manager/staff/:id',
    access: ['Manager'],
    handler: ({ db, params, body, user }) => {
      const staff = db.staffs.find((s) => s.id === params.id)
      if (!staff) return fail(404, 'Không tìm thấy nhân viên')
      const input = body as UpdateStaffRequest

      const selfGuard = canModifyStaffAccount({
        actorId: user?.id,
        targetId: staff.id,
        nextRole: input.role,
      })
      if (!selfGuard.allowed) {
        return fail(409, selfGuard.reason ?? 'Không thể sửa phân quyền bản thân')
      }

      const email = input.email.trim().toLowerCase()
      if (
        db.staffs.some(
          (s) => s.id !== staff.id && s.email.toLowerCase() === email
        )
      ) {
        return fail(409, 'Email đã được sử dụng cho tài khoản khác')
      }
      staff.fullName = input.fullName.trim()
      staff.phoneNumber = (input.phoneNumber ?? '').trim()
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
      const { newPassword } = (body ?? {}) as ResetPasswordRequest
      const temporaryPassword = newPassword?.trim() || 'VinDining@2026'
      if (temporaryPassword.length < 6) {
        return fail(400, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      }
      staff.password = temporaryPassword
      staff.failedLoginCount = 0
      staff.lockoutEnd = null
      saveMockDb(db)
      return ok({ success: true, temporaryPassword })
    },
  },
  {
    id: 55,
    method: 'PATCH',
    pattern: '/manager/staff/:id/status',
    access: ['Manager'],
    handler: ({ db, params, body, user }) => {
      const staff = db.staffs.find((s) => s.id === params.id)
      if (!staff) return fail(404, 'Không tìm thấy nhân viên')
      const { isActive } = body as ToggleStaffStatusRequest

      const selfGuard = canModifyStaffAccount({
        actorId: user?.id,
        targetId: staff.id,
        nextIsActive: isActive,
      })
      if (!selfGuard.allowed) {
        return fail(409, selfGuard.reason ?? 'Không thể khóa tài khoản đang đăng nhập')
      }

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
    handler: ({ db, query, now }) => {
      const periodParam = (query.get('period') ?? 'month') as ReportPeriod
      const period: ReportPeriod = ['day', 'week', 'month', 'quarter'].includes(
        periodParam
      )
        ? periodParam
        : 'month'
      const zoneParam = query.get('zone') as TableZone | null
      const zone =
        zoneParam && ['MainHall', 'VIP', 'Balcony'].includes(zoneParam)
          ? zoneParam
          : undefined

      const defaultWin = getReportPeriodWindow(period, 0, now)
      const fromParam = query.get('from')
      const toParam = query.get('to')
      const from = fromParam ? new Date(fromParam) : defaultWin.from
      const to = toParam ? new Date(toParam) : defaultWin.to
      const periodLabel = query.get('label') || defaultWin.label

      const history = getHistorical120DayData(now)
      return ok(
        buildDashboardReportMetrics({
          period,
          from,
          to,
          periodLabel,
          zone,
          tables: db.tables,
          invoices: [...history.invoices, ...db.invoices],
          orders: [...history.orders, ...db.orders],
          reservations: [...history.reservations, ...db.reservations],
          feedbacks: [...history.feedbacks, ...db.feedbacks],
          now,
        })
      )
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
