import type { OrderDto } from './order'
import type { ReservationDto } from './reservation'

/** Canonical physical dining table statuses. */
export type TableStatus =
  | 'Available'
  | 'Locked'
  | 'Reserved'
  | 'Occupied'
  | 'PaymentPending'
  | 'Cleaning'

/** Canonical restaurant seating zones. */
export type TableZone = 'MainHall' | 'VIP' | 'Balcony'

/** Table summary DTO matching the Tables ERD entity. */
export interface TableDto {
  id: string
  tableNumber: string
  qrCode: string
  capacity: number
  zone: TableZone
  status: TableStatus
  posX: number
  posY: number
  isActive: boolean
  assignedStaffId: string | null
  assignedStaffName: string | null
  currentOrderId: string | null
  currentReservationCode: string | null
  guestCount: number | null
  holdExpiresAt: string | null
  checkoutRequestedAt?: string | null
}

/** Detailed table view DTO returned by GET /api/tables/{id}. */
export interface TableDetailDto {
  table: TableDto
  activeOrder: OrderDto | null
  activeReservation: ReservationDto | null
}

/** Payload for POST /api/tables/{id}/check-in. */
export interface CheckInRequest {
  reservationCode: string
}

/** Payload for POST /api/tables/{id}/walk-in. */
export interface WalkInRequest {
  guestCount: number
}

/** Payload for POST /api/tables/{sourceId}/transfer. */
export interface TransferTableRequest {
  targetTableId: string
}

/** Payload for PATCH /api/tables/{id}/status. */
export interface UpdateTableStatusRequest {
  status: TableStatus
}

/** Single table coordinate update item for PUT /api/manager/tables/layout. */
export interface TableLayoutPositionInput {
  tableId: string
  posX: number
  posY: number
  capacity?: number
  zone?: TableZone
  tableNumber?: string
}

/** Payload for PUT /api/manager/tables/layout. */
export interface UpdateFloorPlanLayoutRequest {
  positions: TableLayoutPositionInput[]
}

/** Payload for POST /api/manager/tables. */
export interface CreateTableRequest {
  tableNumber: string
  capacity: number
  zone: TableZone
  posX: number
  posY: number
}
