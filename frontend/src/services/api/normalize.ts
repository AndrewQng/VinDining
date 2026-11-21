import { allocateSetMenuUnitPrices } from '@/domain/invoice'
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
  const normalizedItems = (raw.items ?? []).map(normalizeOrderItem)
  const headers = normalizedItems.filter(
    (i) => i.menuItemId === null && i.tastingMenuId !== null && i.unitPrice > 0
  )
  if (headers.length === 0) {
    return {
      ...raw,
      status: normalizeOrderStatus(raw.status),
      items: normalizedItems,
    }
  }

  const headerPriceBySet = new Map<string, number>()
  for (const h of headers) {
    if (h.tastingMenuId) headerPriceBySet.set(h.tastingMenuId, h.unitPrice)
  }

  const dishItems = normalizedItems.filter((i) => i.menuItemId !== null)
  for (const [setMenuId, setPrice] of headerPriceBySet.entries()) {
    const children = dishItems.filter(
      (i) => i.tastingMenuId === setMenuId && i.unitPrice === 0
    )
    if (children.length > 0) {
      const allocated = allocateSetMenuUnitPrices(
        setPrice,
        children.map(() => 1)
      )
      children.forEach((child, idx) => {
        child.unitPrice = allocated[idx] ?? 0
      })
    }
  }

  return {
    ...raw,
    status: normalizeOrderStatus(raw.status),
    items: dishItems,
  }
}
