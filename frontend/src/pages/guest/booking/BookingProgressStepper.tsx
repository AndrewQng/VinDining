import { cn } from '@/lib/utils'
import type { BookingStep } from '../bookingState'

export interface StepItem {
  step: BookingStep
  label: string
}

export interface BookingProgressStepperProps {
  steps: readonly StepItem[]
  currentStep: BookingStep
  onSelectStep: (step: BookingStep) => void
}

/** Progress line stepper matching Figma: thin track + numberless dots on desktop, compact fill bar on mobile. */
export function BookingProgressStepper({
  steps,
  currentStep,
  onSelectStep,
}: BookingProgressStepperProps) {
  const isFinalized =
    currentStep === 'hold' ||
    currentStep === 'confirmed' ||
    currentStep === 'expired'
  const rawIdx = steps.findIndex((s) => s.step === currentStep)
  const activeIdx =
    rawIdx >= 0
      ? rawIdx
      : currentStep === 'expired'
        ? Math.max(0, steps.length - 2)
        : 0

  const desktopProgressPct =
    steps.length > 1 ? (activeIdx / (steps.length - 1)) * 100 : 0
  const mobileProgressPct =
    steps.length > 0 ? ((activeIdx + 1) / steps.length) * 100 : 0

  const currentLabel =
    currentStep === 'expired'
      ? 'Hết thời gian giữ chỗ'
      : (steps[activeIdx]?.label ?? '')

  return (
    <nav aria-label="Tiến trình đặt bàn">
      {/* Desktop: thin track with numberless dots and labels below */}
      <div className="hidden sm:block relative">
        <div
          aria-hidden="true"
          className="absolute top-[7px] left-[8.3333%] right-[8.3333%] h-0.5 bg-line"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${desktopProgressPct}%` }}
          />
        </div>

        <ol className="relative z-10 grid grid-cols-6">
          {steps.map((item, idx) => {
            const isCompleted =
              idx < activeIdx || currentStep === 'confirmed'
            const isActive = idx === activeIdx && currentStep !== 'confirmed'
            const canClick = isCompleted && !isFinalized

            const dotNode = (
              <span className="h-4 flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    'rounded-full transition-all duration-300 motion-reduce:transition-none',
                    isCompleted
                      ? 'w-2.5 h-2.5 bg-primary'
                      : isActive
                        ? 'w-3.5 h-3.5 bg-primary ring-4 ring-primary/25'
                        : 'w-2.5 h-2.5 border border-line-strong bg-surface'
                  )}
                />
              </span>
            )

            const labelNode = (
              <span
                className={cn(
                  'mt-2 text-xs text-center leading-snug px-1',
                  isActive
                    ? 'text-accent font-semibold'
                    : isCompleted
                      ? 'text-ink-muted font-medium group-hover:text-ink'
                      : 'text-ink-subtle font-medium'
                )}
              >
                {item.label}
              </span>
            )

            return (
              <li
                key={item.step}
                aria-current={isActive ? 'step' : undefined}
                className="flex flex-col items-center"
              >
                {canClick ? (
                  <button
                    type="button"
                    onClick={() => onSelectStep(item.step)}
                    aria-label={`Quay lại bước ${idx + 1}: ${item.label}`}
                    className="group flex flex-col items-center cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    {dotNode}
                    {labelNode}
                  </button>
                ) : (
                  <div className="flex flex-col items-center">
                    {dotNode}
                    {labelNode}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Mobile: label above one thin progress bar filling to the current step */}
      <div className="sm:hidden space-y-2">
        <p
          data-testid="booking-mobile-step-label"
          className="text-xs font-semibold text-accent"
        >
          Bước {activeIdx + 1}/{steps.length} · {currentLabel}
        </p>
        <div
          role="progressbar"
          aria-label="Tiến độ đặt bàn"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={activeIdx + 1}
          className="h-1.5 w-full rounded-full bg-line overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${mobileProgressPct}%` }}
          />
        </div>
      </div>
    </nav>
  )
}
