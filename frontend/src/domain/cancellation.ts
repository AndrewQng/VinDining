import type { DepositStatus, ReservationStatus } from '@/types'
import { CANCELLATION_FULL_REFUND_HOURS } from './constants'
import { parseUtcTimestamp } from './datetime'

export interface CancellationPolicyEvaluation {
  hoursUntilReservation: number
  isEligibleForFullRefund: boolean
  refundAmount: number
  resultingReservationStatus: Extract<
    ReservationStatus,
    'Cancelled_Refunded' | 'Cancelled_Forfeited'
  >
  resultingDepositStatus: Extract<DepositStatus, 'Refunded' | 'Forfeited'>
}

function toTimestamp(value: Date | string): number {
  return parseUtcTimestamp(value)
}

/** Evaluates cancellation refund eligibility against the 4-hour cutoff rule. */
export function evaluateCancellationPolicy(
  reservationTime: Date | string,
  cancelledAt: Date | string,
  depositAmount: number
): CancellationPolicyEvaluation {
  const diffMs = toTimestamp(reservationTime) - toTimestamp(cancelledAt)
  const hoursUntilReservation = diffMs / 3_600_000
  const isEligibleForFullRefund = hoursUntilReservation >= CANCELLATION_FULL_REFUND_HOURS

  return {
    hoursUntilReservation,
    isEligibleForFullRefund,
    refundAmount: isEligibleForFullRefund ? Math.round(depositAmount) : 0,
    resultingReservationStatus: isEligibleForFullRefund
      ? 'Cancelled_Refunded'
      : 'Cancelled_Forfeited',
    resultingDepositStatus: isEligibleForFullRefund ? 'Refunded' : 'Forfeited',
  }
}
