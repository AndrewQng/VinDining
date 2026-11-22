import { useAuthStore } from '@/stores/useAuthStore'
import { createSignalRRealtimeClient } from './signalrRealtimeClient'
import type { RealtimeClient } from './types'

function readStoredToken(): string | null {
  return useAuthStore.getState().token
}

export const realtimeClient: RealtimeClient =
  createSignalRRealtimeClient(readStoredToken)
