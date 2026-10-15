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
