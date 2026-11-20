import { SLA_WARNING_RATIO } from './constants'
import { parseUtcTimestamp } from './datetime'

export type SlaState = 'normal' | 'warning' | 'overdue'

export interface SlaEvaluation {
  status: SlaState
  elapsedSeconds: number
  slaSeconds: number
  ratio: number
}

/** Evaluates kitchen Prep SLA state: normal (< 80%), warning (80%..100%), overdue (> 100%). */
export function evaluateSla(
  cookingStartedAt: Date | string | null | undefined,
  prepTimeMinutes: number,
  now: Date = new Date()
): SlaEvaluation {
  const slaSeconds = Math.max(0, Math.round(prepTimeMinutes * 60))
  if (!cookingStartedAt || slaSeconds <= 0) {
    return { status: 'normal', elapsedSeconds: 0, slaSeconds, ratio: 0 }
  }

  const startedMs = parseUtcTimestamp(cookingStartedAt)
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedMs) / 1000))
  const ratio = elapsedSeconds / slaSeconds

  let status: SlaState = 'normal'
  if (ratio > 1) {
    status = 'overdue'
  } else if (ratio >= SLA_WARNING_RATIO) {
    status = 'warning'
  }

  return { status, elapsedSeconds, slaSeconds, ratio }
}
