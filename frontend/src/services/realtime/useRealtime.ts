import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { realtimeClient } from './client'
import type {
  RealtimeEventName,
  RealtimeHandler,
  RealtimePayloadMap,
} from './types'

const EVENT_QUERY_KEYS: Record<RealtimeEventName, QueryKey[]> = {
  'table:status-changed': [['tables'], ['reservations']],
  'order:updated': [['orders'], ['tables'], ['kitchen']],
  'course:activated': [['orders'], ['kitchen']],
  'item:served': [['orders'], ['kitchen'], ['tables']],
  'item:remake-requested': [['orders'], ['kitchen']],
  'service-request:created': [['service-calls']],
  'service-request:completed': [['service-calls']],
  'checkout:requested': [['tables'], ['invoices']],
  'invoice:settled': [['tables'], ['invoices'], ['orders'], ['reports']],
  'sla:alert': [['kitchen'], ['orders']],
}

/**
 * Subscribes to a realtime event and invalidates related TanStack Query caches automatically.
 */
export function useRealtime<K extends RealtimeEventName>(
  event: K,
  handler?: RealtimeHandler<K>
): void {
  const queryClient = useQueryClient()
  const handlerRef = useRef<RealtimeHandler<K> | undefined>(handler)
  handlerRef.current = handler

  useEffect(() => {
    void realtimeClient.connect()
    const unsubscribe = realtimeClient.subscribe(event, (payload: RealtimePayloadMap[K]) => {
      for (const queryKey of EVENT_QUERY_KEYS[event]) {
        void queryClient.invalidateQueries({ queryKey })
      }
      handlerRef.current?.(payload)
    })

    return () => {
      unsubscribe()
    }
  }, [event, queryClient])
}
