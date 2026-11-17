import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CountdownProps {
  targetIso?: string
  initialSeconds?: number
  tone?: 'neutral' | 'warning' | 'danger'
  showIcon?: boolean
  onExpire?: () => void
  className?: string
}

function computeRemaining(targetIso?: string, initialSeconds?: number): number {
  if (targetIso) {
    return Math.max(0, Math.floor((Date.parse(targetIso) - Date.now()) / 1000))
  }
  return Math.max(0, initialSeconds ?? 0)
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}

const TONE_CLASS = {
  neutral: 'text-ink-muted',
  warning: 'text-accent',
  danger: 'text-danger',
} as const

/** Live 1-second countdown display in MM:SS or HH:MM:SS with tabular numerals. */
export function Countdown({
  targetIso,
  initialSeconds,
  tone = 'neutral',
  showIcon = true,
  onExpire,
  className,
}: CountdownProps) {
  const [seconds, setSeconds] = useState(() =>
    computeRemaining(targetIso, initialSeconds)
  )

  useEffect(() => {
    setSeconds(computeRemaining(targetIso, initialSeconds))
    const id = window.setInterval(() => {
      setSeconds((prev) => {
        const next = targetIso
          ? computeRemaining(targetIso)
          : Math.max(0, prev - 1)
        if (next === 0 && prev > 0) {
          onExpire?.()
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [targetIso, initialSeconds, onExpire])

  const effectiveTone = seconds === 0 ? 'danger' : tone

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums',
        TONE_CLASS[effectiveTone],
        className
      )}
    >
      {showIcon && <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />}
      <span>{formatDuration(seconds)}</span>
    </span>
  )
}
