import type {
  CourseType,
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  ReservationStatus,
  ServiceRequestStatus,
  ServiceRequestType,
  StaffRole,
  TableStatus,
  TableZone,
} from '@/types'

/** Vietnamese display labels for staff roles. */
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  Waitstaff: 'Phục vụ',
  Expediter: 'Điều phối',
  Cashier: 'Thu ngân',
  Manager: 'Quản lý',
}

/** Vietnamese display labels for physical table statuses. */
export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  Available: 'Trống',
  Locked: 'Đang giữ chỗ',
  Reserved: 'Đã đặt',
  Occupied: 'Đang phục vụ',
  PaymentPending: 'Chờ thanh toán',
  Cleaning: 'Đang dọn',
}

/** Vietnamese display labels for restaurant zones. */
export const TABLE_ZONE_LABELS: Record<TableZone, string> = {
  MainHall: 'Sảnh chính',
  VIP: 'VIP',
  Balcony: 'Ban công',
}

const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  OnHold: 'Chờ',
  Cooking: 'Đang nấu',
  Served: 'Đã ra món',
}

/** Resolves the Vietnamese label for an order item, showing "Làm lại" for remake cooking items. */
export function getOrderItemDisplayLabel(
  status: OrderItemStatus,
  isRemake = false
): string {
  if (status === 'Cooking' && isRemake) {
    return 'Làm lại'
  }
  return ORDER_ITEM_STATUS_LABELS[status]
}

/** Vietnamese display labels for order header statuses. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Active: 'Đang phục vụ',
  Paid: 'Đã thanh toán',
}

/** Vietnamese display labels for reservation lifecycle statuses. */
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PendingDeposit: 'Chờ đặt cọc',
  Reserved: 'Đã đặt',
  Expired_Cancelled: 'Hết hạn',
  Cancelled_Refunded: 'Đã hủy · đã hoàn cọc',
  Cancelled_Forfeited: 'Đã hủy · không hoàn cọc',
  RefundRejected: 'Bác bỏ hoàn cọc',
}

/** Vietnamese display labels for invoice payment methods. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ',
  VietQR: 'VietQR',
}

/** Vietnamese display labels for course types. */
export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  Appetizer: 'Khai vị',
  MainCourse: 'Món chính',
  Dessert: 'Tráng miệng',
  Beverage: 'Đồ uống',
}

/** Vietnamese display labels for QR E-Menu service requests. */
export const SERVICE_REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  CallStaff: 'Gọi phục vụ',
  RefillWater: 'Châm nước',
  ChangeUtensils: 'Đổi dụng cụ',
}

/** Vietnamese display labels for service request statuses. */
export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  Pending: 'Đang chờ',
  Completed: 'Đã xử lý',
}

/** Vietnamese display labels for menu item availability. */
export const MENU_ITEM_STATUS_LABELS: Record<MenuItemStatus, string> = {
  Available: 'Còn món',
  SoldOut: 'Tạm hết',
}
