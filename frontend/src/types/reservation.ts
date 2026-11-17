import type { TableStatus, TableZone } from './table'

/** Canonical reservation lifecycle statuses. */
export type ReservationStatus =
  | 'PendingDeposit'
  | 'Reserved'
  | 'Expired_Cancelled'
  | 'Cancelled_Refunded'
  | 'Cancelled_Forfeited'
  | 'RefundRejected'

/** Canonical deposit payment statuses. */
export type DepositStatus = 'Pending' | 'Paid' | 'Refunded' | 'Forfeited'

/** Payment methods supported by the VNPAY deposit gateway. */
export type DepositPaymentMethod = 'VietQR' | 'Card'

/** Guest contact entity matching the Guests ERD table. */
export interface GuestDto {
  id: string
  fullName: string
  phoneNumber: string
  email: string
}

/** Deposit record matching the Deposits ERD table. */
export interface DepositDto {
  id: string
  reservationId: string
  amount: number
  transactionId: string
  paymentMethod: DepositPaymentMethod
  status: DepositStatus
  paidAt: string | null
  refundAmount: number | null
  createdAt: string
}

/** Full reservation DTO returned by reservation lookup and list endpoints. */
export interface ReservationDto {
  id: string
  bookingCode: string
  guest: GuestDto
  tableId: string
  tableNumber: string
  zone: TableZone
  reservationTime: string
  partySize: number
  preOrderedTastingMenuId: string | null
  preOrderedTastingMenuName: string | null
  durationMinutes: number
  status: ReservationStatus
  note: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  holdExpiresAt: string | null
  reminderSentAt: string | null
  createdAt: string
  deposit: DepositDto | null
}

/** Payload for POST /api/reservations. */
export interface CreateReservationRequest {
  tableId: string
  reservationTime: string
  partySize: number
  preOrderedTastingMenuId: string | null
  fullName: string
  phoneNumber: string
  email: string
  note?: string | null
  paymentMethod?: DepositPaymentMethod
}

/** Response from POST /api/reservations with temporary 17-minute hold and payment URL. */
export interface CreateReservationResponse {
  reservation: ReservationDto
  depositAmount: number
  holdExpiresAt: string
  paymentUrl: string
}

/** Payload for POST /api/payments/vnpay-ipn. */
export interface VnPayIpnRequest {
  bookingCode: string
  transactionId: string
  paymentMethod: DepositPaymentMethod
  responseCode: '00' | '24' | '99'
}

/** Payload for POST /api/reservations/cancel. */
export interface CancelReservationRequest {
  bookingCode: string
  phoneNumber: string
  reason: string
  confirmForfeit?: boolean
}

/** Result returned by POST /api/reservations/cancel. */
export interface CancelReservationResponse {
  reservation: ReservationDto
  refunded: boolean
  refundAmount: number
}

/** Query filter for GET /api/reservations. */
export interface ReservationFilter {
  date?: string
  status?: ReservationStatus
  search?: string
}

/** Query params for GET /api/reservations/available-slots. */
export interface AvailableSlotsQuery {
  date: string
  partySize: number
  zone?: TableZone
}

/** Table entry inside an available slot floor-plan response. */
export interface SlotTableDto {
  id: string
  tableNumber: string
  capacity: number
  zone: TableZone
  status: TableStatus
  posX: number
  posY: number
  isSelectable: boolean
}

/** Available table slot returned by GET /api/reservations/available-slots. */
export interface AvailableSlotDto {
  time: string
  availableTables: {
    id: string
    tableNumber: string
    capacity: number
    zone: TableZone
    posX: number
    posY: number
  }[]
  zoneTables?: SlotTableDto[]
}
