import {
  canFireCourse,
  fireCourseItems,
  getAddedOrderItemStatus,
  getInitialOrderItemStatus,
  markItemRemake,
  markItemServed,
} from '@/domain'
import { realtimeClient } from '@/services/realtime/client'
import type {
  AddOrderItemsRequest,
  CreateOrderRequest,
  FireCourseRequest,
  KitchenPendingTicketDto,
  OrderDto,
  OrderItemDto,
  OrderItemInput,
  PassHistoryItemDto,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import type { MockDatabase } from '../seed'
import { fail, ok, type MockRouteDefinition } from '../types'
import { expandSetMenuOrderItems } from './orderHelpers'

function buildOrderItemsFromInput(
  db: MockDatabase,
  orderId: string,
  inputs: OrderItemInput[],
  nowIso: string,
  existingItems?: OrderItemDto[]
): { items?: OrderItemDto[]; error?: string } {
  const built: OrderItemDto[] = []
  for (const input of inputs) {
    if (!input.menuItemId) continue
    const menuItem = db.menuItems.find((m) => m.id === input.menuItemId)
    if (!menuItem) {
      return { error: 'Không tìm thấy món ăn trong thực đơn' }
    }
    if (menuItem.status === 'SoldOut') {
      return { error: `Món "${menuItem.name}" hiện đang tạm hết` }
    }
    const status = existingItems
      ? getAddedOrderItemStatus(existingItems, menuItem.courseType)
      : getInitialOrderItemStatus(menuItem.courseType)
    built.push({
      id: nextMockId('oi'),
      orderId,
      menuItemId: menuItem.id,
      tastingMenuId: input.tastingMenuId ?? null,
      itemName: menuItem.name,
      courseType: menuItem.courseType,
      quantity: input.quantity,
      unitPrice: menuItem.price,
      status,
      note: input.note?.trim() || null,
      isRemake: false,
      remakeCount: 0,
      isPriority: false,
      prepTimeMinutes: menuItem.prepTimeMinutes,
      cookingStartedAt: status === 'Cooking' ? nowIso : null,
      servedAt: null,
      servedById: null,
    })
  }
  return { items: built }
}

export const orderRoutes: MockRouteDefinition[] = [
  {
    id: 23,
    method: 'GET',
    pattern: '/orders/kitchen/pending',
    access: 'KdsOrExpediter',
    handler: ({ db }) => {
      const tickets: KitchenPendingTicketDto[] = []
      for (const order of db.orders) {
        if (order.status !== 'Active') continue
        for (const item of order.items) {
          if (item.status === 'Served') continue
          tickets.push({
            orderItemId: item.id,
            orderId: order.id,
            tableId: order.tableId,
            tableNumber: order.tableNumber,
            itemName: item.itemName,
            quantity: item.quantity,
            courseType: item.courseType,
            status: item.status,
            note: item.note,
            isRemake: item.isRemake,
            remakeCount: item.remakeCount,
            isPriority: item.isPriority,
            prepTimeMinutes: item.prepTimeMinutes,
            cookingStartedAt: item.cookingStartedAt,
          })
        }
      }
      return ok(tickets)
    },
  },
  {
    id: 21,
    method: 'GET',
    pattern: '/orders/table/:tableId',
    access: ['Waitstaff', 'Cashier', 'Manager'],
    handler: ({ db, params }) => {
      const order = db.orders.find(
        (o) => o.tableId === params.tableId && o.status === 'Active'
      )
      if (!order) return fail(404, 'Bàn chưa có order đang hoạt động')
      return ok(order)
    },
  },
  {
    id: 22,
    method: 'GET',
    pattern: '/orders/:id',
    access: ['Waitstaff', 'Cashier', 'Manager'],
    handler: ({ db, params }) => {
      const order = db.orders.find((o) => o.id === params.id)
      if (!order) return fail(404, 'Không tìm thấy order')
      return ok(order)
    },
  },
  {
    id: 16,
    method: 'POST',
    pattern: '/orders',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db, body, user, now }) => {
      const input = body as CreateOrderRequest
      const table = db.tables.find((t) => t.id === input.tableId && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      if (table.status !== 'Occupied') {
        return fail(409, 'Chỉ có thể tạo Order cho bàn đang phục vụ')
      }
      if (table.currentOrderId) {
        return fail(409, 'Bàn đã có đơn order đang hoạt động')
      }

      const nowIso = now.toISOString()
      const orderId = nextMockId('ord')
      const items: OrderItemDto[] = []

      if (input.tastingMenuId) {
        const setRes = expandSetMenuOrderItems(
          db,
          orderId,
          input.tastingMenuId,
          input.guestCount,
          nowIso
        )
        if (setRes.error || !setRes.items) {
          return fail(400, setRes.error ?? 'Set Menu không hợp lệ')
        }
        items.push(...setRes.items)
      }

      const { items: alaCarteItems, error } = buildOrderItemsFromInput(
        db,
        orderId,
        input.items,
        nowIso
      )
      if (error || !alaCarteItems) {
        return fail(400, error ?? 'Danh sách món không hợp lệ')
      }
      items.push(...alaCarteItems)
      if (items.length === 0) {
        return fail(400, 'Vui lòng chọn ít nhất 1 món hoặc Set Menu')
      }

      const order: OrderDto = {
        id: orderId,
        tableId: table.id,
        tableNumber: table.tableNumber,
        reservationId: null,
        createById: user?.id ?? 'staff-waitstaff-1',
        createByName: user?.fullName ?? 'Trần Thị Mai',
        status: 'Active',
        guestCount: input.guestCount,
        openedAt: nowIso,
        closedAt: null,
        items,
      }

      db.orders.push(order)
      table.currentOrderId = orderId
      table.guestCount = input.guestCount
      saveMockDb(db)

      realtimeClient.publish('order:updated', {
        orderId: order.id,
        tableId: table.id,
        tableNumber: table.tableNumber,
      })
      return ok(order, 201)
    },
  },
  {
    id: 17,
    method: 'POST',
    pattern: '/orders/:id/fire-course',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db, params, body, now }) => {
      const order = db.orders.find((o) => o.id === params.id)
      if (!order) return fail(404, 'Không tìm thấy order')
      const table = db.tables.find((t) => t.id === order.tableId)
      if (table?.status === 'PaymentPending') {
        return fail(409, 'Bàn đang chờ thanh toán, không thể kích hoạt món')
      }

      const { courseType, isPriority = false } = body as FireCourseRequest
      if (!canFireCourse(order.items, courseType)) {
        return fail(400, 'Không có món đang chờ trong Course này')
      }

      order.items = fireCourseItems(
        order.items,
        courseType,
        now.toISOString(),
        isPriority
      )
      saveMockDb(db)

      realtimeClient.publish('course:activated', {
        orderId: order.id,
        tableId: order.tableId,
        courseType,
        isPriority,
      })
      return ok(order)
    },
  },
  {
    id: 18,
    method: 'POST',
    pattern: '/orders/:id/items',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db, params, body, now }) => {
      const order = db.orders.find((o) => o.id === params.id)
      if (!order) return fail(404, 'Không tìm thấy order')
      const table = db.tables.find((t) => t.id === order.tableId)
      if (table?.status === 'PaymentPending') {
        return fail(409, 'Bàn đang chờ thanh toán, không thể gọi thêm món')
      }

      const { items: inputs } = body as AddOrderItemsRequest
      const { items: added, error } = buildOrderItemsFromInput(
        db,
        order.id,
        inputs,
        now.toISOString(),
        order.items
      )
      if (error || !added || added.length === 0) {
        return fail(400, error ?? 'Vui lòng chọn ít nhất 1 món để gọi thêm')
      }

      order.items.push(...added)
      saveMockDb(db)

      realtimeClient.publish('order:updated', {
        orderId: order.id,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
      })
      return ok(order)
    },
  },
  {
    id: 19,
    method: 'PATCH',
    pattern: '/orders/:id/items/:itemId/serve',
    access: ['Expediter', 'Manager'],
    handler: ({ db, params, user, now }) => {
      const order = db.orders.find((o) => o.id === params.id)
      if (!order) return fail(404, 'Không tìm thấy order')
      const idx = order.items.findIndex((i) => i.id === params.itemId)
      if (idx === -1) return fail(404, 'Không tìm thấy món trong đơn')

      try {
        order.items[idx] = markItemServed(
          order.items[idx],
          user?.id ?? 'staff-expediter-1',
          now.toISOString()
        )
      } catch (err) {
        return fail(409, (err as Error).message)
      }

      saveMockDb(db)
      realtimeClient.publish('item:served', {
        orderId: order.id,
        orderItemId: order.items[idx].id,
        tableId: order.tableId,
        itemName: order.items[idx].itemName,
      })
      return ok(order.items[idx])
    },
  },
  {
    id: 20,
    method: 'POST',
    pattern: '/orders/:id/items/:itemId/remake',
    access: ['Expediter', 'Manager'],
    handler: ({ db, params, now }) => {
      const order = db.orders.find((o) => o.id === params.id)
      if (!order) return fail(404, 'Không tìm thấy order')
      const idx = order.items.findIndex((i) => i.id === params.itemId)
      if (idx === -1) return fail(404, 'Không tìm thấy món trong đơn')

      try {
        order.items[idx] = markItemRemake(order.items[idx], now.toISOString())
      } catch (err) {
        return fail(409, (err as Error).message)
      }

      saveMockDb(db)
      realtimeClient.publish('item:remake-requested', {
        orderId: order.id,
        orderItemId: order.items[idx].id,
        tableId: order.tableId,
        itemName: order.items[idx].itemName,
      })
      return ok(order.items[idx])
    },
  },
]

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

/** Pass history extension route beyond docs/api.md (OPEN_QUESTIONS #16). */
export const extraOrderRoutes: MockRouteDefinition[] = [
  {
    id: 102,
    method: 'GET',
    pattern: '/orders/pass/history',
    access: ['Expediter', 'Manager'],
    handler: ({ db, query, now }) => {
      const tableFilter = (query.get('tableNumber') || '').trim().toUpperCase()
      const history: PassHistoryItemDto[] = []

      for (const order of db.orders) {
        if (tableFilter && order.tableNumber.toUpperCase() !== tableFilter) {
          continue
        }
        for (const item of order.items) {
          if (item.status !== 'Served' || !item.servedAt) continue
          if (!isSameLocalDay(item.servedAt, now)) continue
          const confirmer = item.servedById
            ? db.staffs.find((s) => s.id === item.servedById)?.fullName
            : undefined
          history.push({
            orderItemId: item.id,
            orderId: order.id,
            tableId: order.tableId,
            tableNumber: order.tableNumber,
            itemName: item.itemName,
            quantity: item.quantity,
            courseType: item.courseType,
            note: item.note,
            remakeCount: item.remakeCount,
            servedAt: item.servedAt,
            servedById: item.servedById,
            servedByName: confirmer ?? 'Lê Minh Quân',
          })
        }
      }

      history.sort((a, b) => Date.parse(b.servedAt) - Date.parse(a.servedAt))
      return ok(history)
    },
  },
]
