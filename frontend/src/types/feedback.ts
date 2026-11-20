import type { TableZone } from './table'

/** Guest CSAT feedback DTO matching the Feedbacks ERD table. */
export interface FeedbackDto {
  id: string
  reservationId: string | null
  invoiceId: string | null
  guestName: string | null
  tableNumber: string | null
  zone?: TableZone | null
  foodRating: number
  ambienceRating: number
  serviceRating: number
  comment: string | null
  createdAt: string
}

/** Response from GET /api/feedbacks/validate/{token}. */
export interface FeedbackTokenValidationDto {
  valid: boolean
  invoiceId: string
  tableNumber?: string | null
}

/** Payload for POST /api/feedbacks. */
export interface SubmitFeedbackRequest {
  token: string
  foodRating: number
  ambienceRating: number
  serviceRating: number
  comment?: string | null
}

/** Query filter for GET /api/manager/feedbacks. */
export interface FeedbackFilter {
  minRating?: number
  from?: string
  to?: string
}
