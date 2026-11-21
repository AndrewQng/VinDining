import type {
  OrderDto,
  OrderItemDto,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  ReservationDto,
  ReservationStatus,
  StaffRole,
  TableDto,
  TableStatus,
} from '@/types'

export function normalizeStaffRole(role: string): StaffRole {
  if (role === 'Admin') return 'Manager'
  if (
    role === 'Waitstaff' ||
    role === 'Expediter' ||
    role === 'Cashier' ||
    role === 'Manager'
  ) {
    return role
  }
  return 'Manager'
}

export function normalizeTableStatus(status: string): TableStatus {
  if (status === 'LockedForPayment') return 'Locked'
  return status as TableStatus
}

export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === 'Processing') return 'Active'
  if (status === 'Completed') return 'Paid'
  return status as OrderStatus
}

export function normalizeOrderItemStatus(status: string): OrderItemStatus {
  if (status === 'Hold') return 'OnHold'
  if (status === 'Preparing') return 'Cooking'
  return status as OrderItemStatus
}

export function normalizePaymentMethod(method: string): PaymentMethod {
  if (method === 'BankTransfer') return 'VietQR'
  return method as PaymentMethod
}

export function normalizeReservationStatus(
  raw: ReservationDto
): ReservationStatus {
  if (raw.guestStatus) return raw.guestStatus
  const status = raw.status as string
  if (status === 'Pending') return 'PendingDeposit'
  if (status === 'Confirmed') return 'Reserved'
  if (status === 'Completed') return 'CheckedIn'
  return raw.status
}

export function normalizeReservation(raw: ReservationDto): ReservationDto {
  if (!raw) return raw
  return {
    ...raw,
    status: normalizeReservationStatus(raw),
  }
}

export function normalizeTable(raw: TableDto): TableDto {
  if (!raw) return raw
  return {
    ...raw,
    status: normalizeTableStatus(raw.status),
  }
}

export function normalizeOrderItem(raw: OrderItemDto): OrderItemDto {
  if (!raw) return raw
  const isEmptyGuid = raw.menuItemId === '00000000-0000-0000-0000-000000000000'
  return {
    ...raw,
    menuItemId: isEmptyGuid ? null : raw.menuItemId,
    status: normalizeOrderItemStatus(raw.status),
  }
}

export function normalizeOrder(raw: OrderDto): OrderDto {
  if (!raw) return raw
  const normalizedItems = (raw.items ?? [])
    .map(normalizeOrderItem)
    .filter((i) => i.menuItemId !== null)
  return {
    ...raw,
    status: normalizeOrderStatus(raw.status),
    items: normalizedItems,
  }
}
