import { Check } from 'lucide-react'
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

/** Progress line stepper with clickable completed dots, desktop labels, and compact mobile summary. */
export function BookingProgressStepper({
  steps,
  currentStep,
  onSelectStep,
}: BookingProgressStepperProps) {
  const isFinalized = currentStep === 'confirmed' || currentStep === 'expired'
  const rawIdx = steps.findIndex((s) => s.step === currentStep)
  const activeIdx =
    rawIdx >= 0
      ? rawIdx
      : currentStep === 'expired'
        ? Math.max(0, steps.length - 2)
        : 0

  const progressPct =
    steps.length > 1 ? (activeIdx / (steps.length - 1)) * 100 : 0

  const currentLabel =
    currentStep === 'expired'
      ? 'Hết thời gian giữ chỗ'
      : (steps[activeIdx]?.label ?? '')

  return (
    <nav aria-label="Tiến trình đặt bàn" className="space-y-3">
      <div className="relative">
        {/* Background & animated fill track spanning center of step 1 to center of step N */}
        <div
          aria-hidden="true"
          className="absolute top-3.5 sm:top-4 left-[8.3333%] right-[8.3333%] h-0.5 bg-line"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="relative z-10 grid grid-cols-6">
          {steps.map((item, idx) => {
            const isCompleted =
              idx < activeIdx || currentStep === 'confirmed'
            const isActive = idx === activeIdx && currentStep !== 'confirmed'
            const canClick = isCompleted && !isFinalized

            const dotNode = (
              <span
                className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors motion-reduce:transition-none',
                  isCompleted
                    ? 'bg-primary border-primary text-on-primary'
                    : isActive
                      ? 'bg-surface border-primary text-accent ring-4 ring-primary/20'
                      : 'bg-surface border-line-strong text-ink-subtle'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  idx + 1
                )}
              </span>
            )

            const labelNode = (
              <span
                className={cn(
                  'hidden sm:block mt-2 text-xs font-medium text-center leading-snug px-1',
                  isActive
                    ? 'text-accent font-semibold'
                    : isCompleted
                      ? 'text-ink'
                      : 'text-ink-subtle'
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

      {/* Compact mobile current step label */}
      <p
        data-testid="booking-mobile-step-label"
        className="sm:hidden text-center text-xs font-semibold text-accent"
      >
        Bước {activeIdx + 1}/{steps.length} · {currentLabel}
      </p>
    </nav>
  )
}
