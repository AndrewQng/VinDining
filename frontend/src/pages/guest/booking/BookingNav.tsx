import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { BookingStep } from '../bookingState'

export interface BookingNavProps {
  step: BookingStep
  hasSelectedTable: boolean
  isSubmittingContact: boolean
  contactFormId: string
  onBack: () => void
  onNext: () => void
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
      return 'Giữ chỗ'
    case 'hold':
      return 'Thanh toán qua VNPAY'
    default:
      return 'Tiếp tục'
  }
}

/** Two-column booking navigation bar (1fr back, 2fr primary) placed directly below the summary card. */
export function BookingNav({
  step,
  hasSelectedTable,
  isSubmittingContact,
  contactFormId,
  onBack,
  onNext,
}: BookingNavProps) {
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
