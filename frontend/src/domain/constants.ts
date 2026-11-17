/** Business constants sourced from the VinDining analysis report and prototype rules. */
export const HOLD_DURATION_MINUTES = 17
export const CANCELLATION_FULL_REFUND_HOURS = 4
export const SERVICE_CHARGE_RATE = 0.05
export const VAT_RATE = 0.1
export const SET_MENU_DEPOSIT_RATE = 0.3
export const NO_SET_DEPOSIT_PER_GUEST_VND = 500_000
export const SLA_WARNING_RATIO = 0.8
export const LOGIN_MAX_FAILED_ATTEMPTS = 5
export const LOGIN_LOCKOUT_MINUTES = 15

export const WORKER_INTERVALS_MS = {
  expiryScan: 60_000,
  surveyScan: 300_000,
  reminderScan: 900_000,
  slaScan: 15_000,
} as const
