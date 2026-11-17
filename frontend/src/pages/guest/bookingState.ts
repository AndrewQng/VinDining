import type {
  DepositPaymentMethod,
  ReservationDto,
  TableZone,
} from '@/types'

export type BookingStep =
  | 'time-zone'
  | 'table'
  | 'set-menu'
  | 'contact'
  | 'hold'
  | 'confirmed'
  | 'expired'

export const BOOKING_STEP_ORDER: readonly BookingStep[] = [
  'time-zone',
  'table',
  'set-menu',
  'contact',
  'hold',
  'confirmed',
]

export const BOOKING_TIMES = [
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
] as const

export interface BookingDraft {
  step: BookingStep
  date: string
  time: string
  partySize: number
  zone: TableZone
  tableId: string | null
  tableNumber: string | null
  tableCapacity: number | null
  preOrderedTastingMenuId: string | null
  fullName: string
  phoneNumber: string
  email: string
  note: string
  paymentMethod: DepositPaymentMethod
  holdReservation: ReservationDto | null
  confirmedReservation: ReservationDto | null
}

const DRAFT_STORAGE_KEY = 'vd-booking-draft'

/** Returns tomorrow's local YYYY-MM-DD date string so fresh reservations default >= 4h ahead. */
export function getDefaultBookingDate(now: Date = new Date()): string {
  const tomorrow = new Date(now.getTime() + 24 * 3_600_000)
  const y = tomorrow.getFullYear()
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const d = String(tomorrow.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function createInitialBookingDraft(overrides?: {
  setId?: string | null
  zone?: TableZone | null
}): BookingDraft {
  return {
    step: 'time-zone',
    date: getDefaultBookingDate(),
    time: '19:00',
    partySize: 4,
    zone: overrides?.zone ?? 'MainHall',
    tableId: null,
    tableNumber: null,
    tableCapacity: null,
    preOrderedTastingMenuId: overrides?.setId ?? null,
    fullName: '',
    phoneNumber: '',
    email: '',
    note: '',
    paymentMethod: 'VietQR',
    holdReservation: null,
    confirmedReservation: null,
  }
}

export function loadBookingDraft(overrides?: {
  setId?: string | null
  zone?: TableZone | null
}): BookingDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as BookingDraft
      if (parsed && parsed.step) {
        return {
          ...parsed,
          preOrderedTastingMenuId:
            overrides?.setId ?? parsed.preOrderedTastingMenuId,
          zone: overrides?.zone ?? parsed.zone,
        }
      }
    }
  } catch {
    // Ignore invalid storage
  }
  return createInitialBookingDraft(overrides)
}

export function saveBookingDraft(draft: BookingDraft): void {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Ignore storage errors
  }
}

export function clearBookingDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

/** Pure step transition helpers for G1 booking flow. */
export function getPreviousBookingStep(step: BookingStep): BookingStep | null {
  if (step === 'table') return 'time-zone'
  if (step === 'set-menu') return 'table'
  if (step === 'contact') return 'set-menu'
  if (step === 'hold') return 'contact'
  return null
}

export function canAdvanceFromStep(draft: BookingDraft): boolean {
  if (draft.step === 'time-zone') {
    return Boolean(draft.date && draft.time && draft.partySize >= 1)
  }
  if (draft.step === 'table') {
    return Boolean(draft.tableId)
  }
  if (draft.step === 'set-menu') {
    return true
  }
  if (draft.step === 'contact') {
    return Boolean(
      draft.fullName.trim() &&
        draft.phoneNumber.trim() &&
        draft.email.trim()
    )
  }
  return false
}

export function validateContactFields(input: {
  fullName: string
  phoneNumber: string
  email: string
}): Partial<Record<'fullName' | 'phoneNumber' | 'email', string>> {
  const errors: Partial<Record<'fullName' | 'phoneNumber' | 'email', string>> =
    {}
  if (input.fullName.trim().length < 2) {
    errors.fullName = 'Vui lòng nhập họ và tên'
  }
  const digits = input.phoneNumber.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 11) {
    errors.phoneNumber = 'Số điện thoại cần từ 9 đến 11 chữ số'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Địa chỉ email chưa hợp lệ'
  }
  return errors
}

export function buildReservationIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

export function formatBookingDateLabel(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
