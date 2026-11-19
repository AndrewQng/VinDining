import { isMockMode } from '@/lib/utils'
import { createMockRealtimeClient } from './mockRealtimeClient'
import { createSignalRRealtimeClient } from './signalrRealtimeClient'
import type { RealtimeClient } from './types'

const AUTH_STORAGE_KEY = 'vd-auth-storage'

function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } }
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

export const realtimeClient: RealtimeClient =
  isMockMode() || Boolean(import.meta.env.VITEST)
    ? createMockRealtimeClient()
    : createSignalRRealtimeClient(readStoredToken)
