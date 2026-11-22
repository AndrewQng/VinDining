import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { BookingStep } from '../bookingState'

export interface BookingNavProps {
  step: BookingStep
  hasSelectedTable: boolean
  isSubmittingContact: boolean
  isCancellingHold?: boolean
  contactFormId: string
  onBack: () => void
  onNext: () => void
  onCancelHold?: () => void
}

function getPrimaryLabel(step: BookingStep): string {
  switch (step) {
    case 'time-zone':
      return 'Xem bàn trống'
    case 'table':
      return 'Tiếp tục'
    case 'set-menu':
      return 'Tiếp tục'
    case 'contact':
      return 'Giữ chỗ & đặt cọc'
    default:
      return 'Tiếp tục'
  }
}

/** Two-column booking navigation bar (1fr back, 2fr primary) placed directly below the summary card. */
export function BookingNav({
  step,
  hasSelectedTable,
  isSubmittingContact,
  isCancellingHold = false,
  contactFormId,
  onBack,
  onNext,
  onCancelHold,
}: BookingNavProps) {
  if (step === 'hold') {
    return (
      <div data-testid="booking-nav" className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="danger"
          className="w-full"
          loading={isCancellingHold}
          data-testid="booking-nav-cancel-hold"
          onClick={onCancelHold}
        >
          Hủy giao dịch
        </Button>
      </div>
    )
  }

  const showBack = step !== 'time-zone'
  const primaryLabel = getPrimaryLabel(step)

  return (
    <div
      data-testid="booking-nav"
      className={cn(
        'grid gap-3',
        showBack ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : 'grid-cols-1'
      )}
    >
      {showBack && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          data-testid="booking-nav-back"
          onClick={onBack}
        >
          Quay lại
        </Button>
      )}

      {step === 'contact' ? (
        <Button
          key="next-contact"
          type="submit"
          form={contactFormId}
          loading={isSubmittingContact}
          className="w-full"
          data-testid="booking-nav-next"
        >
          {primaryLabel}
        </Button>
      ) : (
        <Button
          key={`next-${step}`}
          type="button"
          className="w-full"
          disabled={step === 'table' && !hasSelectedTable}
          data-testid="booking-nav-next"
          onClick={onNext}
        >
          {primaryLabel}
        </Button>
      )}
    </div>
  )
}
