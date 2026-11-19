import type { ReservationDto, ReservationStatus } from './reservation'

/** Exceptional manual refund request item for Manager review. */
export interface RefundRequestDto {
  reservation: ReservationDto
  hoursBeforeReservation: number
  requestedAt: string
  auditReason: string | null
  processedAt?: string | null
}

/** Payload for POST /api/manager/reservations/{id}/manual-refund. */
export interface ManualRefundRequest {
  approved: boolean
  reason: string
}

/** Query filter for GET /api/manager/refunds. */
export interface RefundFilter {
  status?: ReservationStatus
}
