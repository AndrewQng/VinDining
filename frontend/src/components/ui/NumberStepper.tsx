import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NumberStepperProps {
  value: number
  onChange: (nextValue: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  disabled?: boolean
  className?: string
}

/** Accessible numeric stepper for guest counts and dish quantities. */
export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  label,
  disabled = false,
  className,
}: NumberStepperProps) {
  const canDecrease = !disabled && value - step >= min
  const canIncrease = !disabled && value + step <= max

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-line bg-card',
        className
      )}
      role="group"
      aria-label={label ?? 'Điều chỉnh số lượng'}
    >
      <button
        type="button"
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Giảm"
        className="w-9 h-9 inline-flex items-center justify-center text-ink hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg cursor-pointer"
      >
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <span
        className="min-w-9 px-2 text-center text-sm font-semibold tabular-nums text-ink"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label="Tăng"
        className="w-9 h-9 inline-flex items-center justify-center text-ink hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg cursor-pointer"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
