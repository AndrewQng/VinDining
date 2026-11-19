/** Standard error payload returned by backend and mock API routes. */
export interface ApiErrorResponse {
  message: string
  code?: string
  remainingMinutes?: number
}
