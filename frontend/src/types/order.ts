import type { CourseType } from './menu'

export type OrderStatus = 'Active' | 'Completed' | 'Cancelled'

export type OrderItemStatus =
  | 'Pending'
  | 'Fired'
  | 'Cooking'
  | 'Ready'
  | 'Served'
  | 'Cancelled'
  | 'Remake'

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  menuItemName: string
  unitPrice: number
  quantity: number
  courseType: CourseType
  status: OrderItemStatus
  specialInstructions?: string | null
  firedAtUtc?: string | null
  readyAtUtc?: string | null
  servedAtUtc?: string | null
  remakeReason?: string | null
}

export interface Order {
  id: string
  tableId: string
  tableNumber: string
  guestCount: number
  status: OrderStatus
  waitstaffId?: string
  waitstaffName?: string
  items: OrderItem[]
  subtotal: number
  serviceCharge: number // 5%
  vat: number // 10%
  depositDeducted: number
  totalAmount: number
  createdAtUtc: string
  updatedAtUtc?: string
}

export interface CreateOrderItemDto {
  menuItemId: string
  quantity: number
  note?: string
}

export interface CreateOrderCommand {
  tableId: string
  reservationId?: string
  staffId?: string
  items: CreateOrderItemDto[]
}

export interface CourseFiringRequest {
  courseType: number // 0 = Appetizer, 1 = MainCourse, 2 = Dessert, 3 = Beverage
  isPriority?: boolean
}

export interface RemakeItemRequest {
  reason?: string
}

export interface CancelItemRequest {
  reason?: string
}

