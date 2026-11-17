import { formatVnd, formatVndDeduction } from '@/domain'
import { cn } from '@/lib/utils'

export interface MoneyProps {
  amount: number
  deduction?: boolean
  tone?: 'default' | 'accent' | 'muted' | 'danger'
  className?: string
}

const TONE_CLASS = {
  default: 'text-ink',
  accent: 'text-accent',
  muted: 'text-ink-muted',
  danger: 'text-danger',
} as const

/** Single canonical money display using integer VND formatting (1.800.000 ₫). */
export function Money({
  amount,
  deduction = false,
  tone = 'default',
  className,
}: MoneyProps) {
  return (
    <span className={cn('tabular-nums font-medium', TONE_CLASS[tone], className)}>
      {deduction ? formatVndDeduction(amount) : formatVnd(amount)}
    </span>
  )
}
