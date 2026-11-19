import type {
  RealtimeClient,
  RealtimeEventName,
  RealtimeHandler,
  RealtimePayloadMap,
} from './types'

interface BroadcastEnvelope {
  event: RealtimeEventName
  payload: RealtimePayloadMap[RealtimeEventName]
}

/** Cross-tab + in-tab realtime transport backed by BroadcastChannel('vd-realtime'). */
export function createMockRealtimeClient(): RealtimeClient {
  const listeners = new Map<RealtimeEventName, Set<(payload: unknown) => void>>()
  let channel: BroadcastChannel | null = null

  const dispatchLocal = <K extends RealtimeEventName>(
    event: K,
    payload: RealtimePayloadMap[K]
  ): void => {
    const handlers = listeners.get(event)
    if (!handlers) return
    handlers.forEach((handler) => handler(payload))
  }

  const ensureChannel = (): BroadcastChannel | null => {
    if (channel) return channel
    if (typeof BroadcastChannel === 'undefined') return null
    channel = new BroadcastChannel('vd-realtime')
    channel.onmessage = (msg: MessageEvent<BroadcastEnvelope>) => {
      if (msg.data?.event) {
        dispatchLocal(msg.data.event, msg.data.payload)
      }
    }
    return channel
  }

  return {
    async connect(): Promise<void> {
      ensureChannel()
    },

    async disconnect(): Promise<void> {
      if (channel) {
        channel.close()
        channel = null
      }
    },

    subscribe<K extends RealtimeEventName>(
      event: K,
      handler: RealtimeHandler<K>
    ): () => void {
      ensureChannel()
      let set = listeners.get(event)
      if (!set) {
        set = new Set()
        listeners.set(event, set)
      }
      const wrapped = handler as (payload: unknown) => void
      set.add(wrapped)
      return () => {
        set?.delete(wrapped)
      }
    },

    publish<K extends RealtimeEventName>(
      event: K,
      payload: RealtimePayloadMap[K]
    ): void {
      dispatchLocal(event, payload)
      const ch = ensureChannel()
      ch?.postMessage({ event, payload } satisfies BroadcastEnvelope)
    },
  }
}
