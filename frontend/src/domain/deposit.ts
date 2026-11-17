import {
  NO_SET_DEPOSIT_PER_GUEST_VND,
  SET_MENU_DEPOSIT_RATE,
} from './constants'

export interface DepositCalculationInput {
  guestCount: number
  setMenuPricePerGuest?: number | null
  isWalkIn?: boolean
}

/** Calculates required deposit in integer VND (walk-ins: 0, Set Menu: 30%, a la carte: 500.000/guest). */
export function calculateDepositAmount({
  guestCount,
  setMenuPricePerGuest,
  isWalkIn = false,
}: DepositCalculationInput): number {
  if (isWalkIn || guestCount <= 0) {
    return 0
  }
  if (setMenuPricePerGuest != null && setMenuPricePerGuest > 0) {
    return Math.round(SET_MENU_DEPOSIT_RATE * setMenuPricePerGuest * guestCount)
  }
  return Math.round(NO_SET_DEPOSIT_PER_GUEST_VND * guestCount)
}
