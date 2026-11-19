/** Guest CSAT feedback DTO matching the Feedbacks ERD table. */
export interface FeedbackDto {
  id: string
  reservationId: string | null
  invoiceId: string | null
  guestName: string | null
  tableNumber: string | null
  foodRating: number
  ambienceRating: number
  serviceRating: number
  comment: string | null
  createdAt: string
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
