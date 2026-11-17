import {
  areAllItemsServed,
  calculateInvoiceTotals,
  hasAnyServedItem,
} from '@/domain'
import { realtimeClient } from '@/services/realtime/client'
import type {
  InvoiceDto,
  InvoicePreviewDto,
  PaymentMethod,
  SettleInvoiceRequest,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import type { MockDatabase } from '../seed'
import { fail, ok, type MockRouteDefinition } from '../types'

function buildInvoicePreview(
  db: MockDatabase,
  tableId: string
): { preview?: InvoicePreviewDto; error?: { status: number; message: string } } {
  const table = db.tables.find((t) => t.id === tableId && t.isActive)
  if (!table) return { error: { status: 404, message: 'Không tìm thấy bàn' } }

  const order = db.orders.find(
    (o) => o.id === table.currentOrderId && o.status === 'Active'
  )
  if (!order) {
    return {
      error: { status: 404, message: 'Bàn chưa có đơn gọi món đang hoạt động' },
    }
  }

  const reservation = order.reservationId
    ? db.reservations.find((r) => r.id === order.reservationId)
    : table.currentReservationCode
      ? db.reservations.find(
          (r) => r.bookingCode === table.currentReservationCode
        )
      : null

  const depositAmount =
    reservation?.deposit?.status === 'Paid' ? reservation.deposit.amount : 0

  const totals = calculateInvoiceTotals(order.items, depositAmount)
  const hasUnservedItems = !areAllItemsServed(order.items)

  return {
    preview: {
      tableId: table.id,
      tableNumber: table.tableNumber,
      orderId: order.id,
      guestCount: order.guestCount,
      items: order.items,
      ...totals,
      vietQrPayload: `VIETQR|VINDINING|${table.tableNumber}|${totals.amountDue}`,
      hasUnservedItems,
    },
  }
}

export const invoiceRoutes: MockRouteDefinition[] = [
  {
    id: 24,
    method: 'POST',
    pattern: '/tables/:tableId/request-checkout',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db, params }) => {
      const table = db.tables.find(
        (t) => t.id === params.tableId && t.isActive
      )
      if (!table) return fail(404, 'Không tìm thấy bàn')
      if (table.status !== 'Occupied') {
        return fail(409, 'Bàn không ở trạng thái Đang phục vụ')
      }
      const order = db.orders.find((o) => o.id === table.currentOrderId)
      if (!order || !hasAnyServedItem(order.items)) {
        return fail(409, 'Bàn ăn chưa có món nào được phục vụ')
      }

      table.status = 'PaymentPending'
      saveMockDb(db)

      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: 'PaymentPending',
      })
      realtimeClient.publish('checkout:requested', {
        tableId: table.id,
        tableNumber: table.tableNumber,
      })
      return ok(table)
    },
  },
  {
    id: 25,
    method: 'GET',
    pattern: '/invoices/preview/:tableId',
    access: ['Cashier', 'Manager'],
    handler: ({ db, params }) => {
      const { preview, error } = buildInvoicePreview(db, params.tableId)
      if (error || !preview) {
        return fail(error?.status ?? 400, error?.message ?? 'Lỗi tạm tính')
      }
      return ok(preview)
    },
  },
  {
    id: 26,
    method: 'POST',
    pattern: '/invoices/:tableId/print-preview',
    access: ['Cashier', 'Manager'],
    handler: ({ db, params, now }) => {
      const { preview, error } = buildInvoicePreview(db, params.tableId)
      if (error || !preview) {
        return fail(error?.status ?? 400, error?.message ?? 'Lỗi in tạm tính')
      }
      return ok({ printedAt: now.toISOString(), preview })
    },
  },
  {
    id: 27,
    method: 'POST',
    pattern: '/invoices/:tableId/settle',
    access: ['Cashier', 'Manager'],
    handler: ({ db, params, body, user, now }) => {
      const { preview, error } = buildInvoicePreview(db, params.tableId)
      if (error || !preview) {
        return fail(error?.status ?? 400, error?.message ?? 'Không thể quyết toán')
      }
      if (preview.hasUnservedItems) {
        return fail(409, 'Còn món chưa phục vụ xong, không thể xuất hóa đơn')
      }

      const { paymentMethod } = body as SettleInvoiceRequest
      const table = db.tables.find((t) => t.id === params.tableId)!
      const order = db.orders.find((o) => o.id === preview.orderId)!
      const nowIso = now.toISOString()

      const invoice: InvoiceDto = {
        id: nextMockId('inv'),
        orderId: order.id,
        tableId: table.id,
        tableNumber: table.tableNumber,
        settleById: user?.id ?? 'staff-cashier-1',
        settleByName: user?.fullName ?? 'Phạm Thu Hà',
        subtotal: preview.subtotal,
        serviceCharge: preview.serviceCharge,
        vatAmount: preview.vatAmount,
        deductedDeposit: preview.deductedDeposit,
        totalAmount: preview.totalAmount,
        amountDue: preview.amountDue,
        paymentMethod,
        isPaid: true,
        surveyToken: `survey-${table.tableNumber.toLowerCase()}-${Date.now()}`,
        surveySentAt: null,
        createdAt: nowIso,
      }

      order.status = 'Paid'
      order.closedAt = nowIso
      table.status = 'Cleaning'
      table.assignedStaffId = null
      table.assignedStaffName = null
      table.currentOrderId = null
      table.currentReservationCode = null
      table.guestCount = null

      db.invoices.unshift(invoice)
      saveMockDb(db)

      realtimeClient.publish('invoice:settled', {
        invoiceId: invoice.id,
        tableId: table.id,
        tableNumber: table.tableNumber,
      })
      realtimeClient.publish('table:status-changed', {
        tableId: table.id,
        tableNumber: table.tableNumber,
        status: 'Cleaning',
      })
      return ok(invoice, 201)
    },
  },
  {
    id: 29,
    method: 'GET',
    pattern: '/invoices',
    access: ['Cashier', 'Manager'],
    handler: ({ db, query }) => {
      const method = query.get('paymentMethod') as PaymentMethod | null
      const filtered = db.invoices.filter((inv) =>
        method ? inv.paymentMethod === method : true
      )
      return ok(filtered)
    },
  },
  {
    id: 28,
    method: 'GET',
    pattern: '/invoices/:id',
    access: ['Cashier', 'Manager'],
    handler: ({ db, params }) => {
      const invoice = db.invoices.find((inv) => inv.id === params.id)
      if (!invoice) return fail(404, 'Không tìm thấy hóa đơn')
      return ok(invoice)
    },
  },
]
