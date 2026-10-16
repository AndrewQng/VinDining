import type { TableZone } from './table'

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow'

export type DiningShift = 'Lunch' | 'Dinner'

export interface Reservation {
  id: string
  guestName: string
  guestPhone: string
  guestEmail: string
  partySize: number
  reservationTime: string
  shift: DiningShift
  zone: TableZone
  tableId?: string | null
  tableNumber?: string | null
  status: ReservationStatus
  depositAmount: number
  depositStatus: 'Pending' | 'Paid' | 'Refunded' | 'Forfeited'
  specialRequests?: string | null
  createdAtUtc: string
}

export interface CreateReservationRequest {
  guestName: string
  guestPhone: string
  guestEmail: string
  partySize: number
  reservationDate: string
  reservationTime: string
  shift: DiningShift
  zone: TableZone
  specialRequests?: string
}

export interface AvailableTableDto {
  id: string
  tableNumber: string
  capacity: number
  zone: number | string
  zoneName: string
  status: number | string
}

export interface CreateReservationCommand {
  fullName: string
  phoneNumber: string
  email: string
  tableId: string
  reservationTime: string
  partySize: number
  note?: string
}

export interface CreateReservationResultDto {
  reservationId: string
  bookingCode: string
  tableNumber: string
  depositAmount: number
  paymentUrl: string
  expiresAt: string
}

export interface ConfirmDepositPaymentCommand {
  bookingCode: string
  transactionId: string
  paymentMethod?: number
}

export interface CancelReservationResultDto {
  bookingCode: string
  status: string
  isRefunded: boolean
  refundAmount: number
  message: string
}

export interface ReservationDetailDto {
  id: string
  bookingCode: string
  guestName: string
  guestPhone: string
  guestEmail: string
  tableId: string
  tableNumber: string
  tableZone: string
  reservationTime: string
  partySize: number
  status: string
  note?: string
  depositAmount?: number
  depositStatus?: string
  createdAt: string
}

