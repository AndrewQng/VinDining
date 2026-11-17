import type { CourseType } from './menu'

/** Canonical order header statuses. */
export type OrderStatus = 'Active' | 'Paid'

/** Canonical order item statuses (Remake is Cooking + isRemake === true). */
export type OrderItemStatus = 'OnHold' | 'Cooking' | 'Served'

/** Individual line item inside an Order. */
export interface OrderItemDto {
  id: string
  orderId: string
  menuItemId: string | null
  tastingMenuId: string | null
  itemName: string
  courseType: CourseType
  quantity: number
  unitPrice: number
  status: OrderItemStatus
  note: string | null
  isRemake: boolean
  remakeCount: number
  isPriority: boolean
  prepTimeMinutes: number
  cookingStartedAt: string | null
  servedAt: string | null
  servedById: string | null
}

/** Order DTO matching the Orders ERD table. */
export interface OrderDto {
  id: string
  tableId: string
  tableNumber: string
  reservationId: string | null
  createById: string
  createByName: string
  status: OrderStatus
  guestCount: number
  openedAt: string
  closedAt: string | null
  items: OrderItemDto[]
}

/** Line item input for creating an order or adding items. */
export interface OrderItemInput {
  menuItemId: string | null
  tastingMenuId?: string | null
  quantity: number
  note?: string | null
}

/** Payload for POST /api/orders. */
export interface CreateOrderRequest {
  tableId: string
  guestCount: number
  tastingMenuId?: string | null
  items: OrderItemInput[]
}

/** Payload for POST /api/orders/{id}/fire-course. */
export interface FireCourseRequest {
  courseType: CourseType
  isPriority?: boolean
}

/** Payload for POST /api/orders/{id}/items. */
export interface AddOrderItemsRequest {
  items: OrderItemInput[]
}

/** Optional reason payload for POST /api/orders/{id}/items/{itemId}/remake. */
export interface RemakeOrderItemRequest {
  reason?: string | null
}

/** Ticket DTO displayed on KDS Bếp and Pass (GET /api/orders/kitchen/pending). */
export interface KitchenPendingTicketDto {
  orderItemId: string
  orderId: string
  tableId: string
  tableNumber: string
  itemName: string
  quantity: number
  courseType: CourseType
  status: OrderItemStatus
  note: string | null
  isRemake: boolean
  remakeCount: number
  isPriority: boolean
  prepTimeMinutes: number
  cookingStartedAt: string | null
}
