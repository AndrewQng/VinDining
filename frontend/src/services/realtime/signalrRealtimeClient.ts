import * as signalR from '@microsoft/signalr'
import type {
  RealtimeClient,
  RealtimeEventName,
  RealtimeHandler,
  RealtimePayloadMap,
} from './types'

type HubName = 'FloorPlanHub' | 'KitchenHub' | 'ServingHub'

const EVENT_HUB_MAP: Record<RealtimeEventName, HubName> = {
  'table:status-changed': 'FloorPlanHub',
  'checkout:requested': 'FloorPlanHub',
  'invoice:settled': 'FloorPlanHub',
  'order:updated': 'KitchenHub',
  'course:activated': 'KitchenHub',
  'item:remake-requested': 'KitchenHub',
  'sla:alert': 'KitchenHub',
  'item:served': 'ServingHub',
  'service-request:created': 'ServingHub',
  'service-request:completed': 'ServingHub',
  'menu:updated': 'FloorPlanHub',
}

/** SignalR realtime transport connecting to FloorPlanHub, KitchenHub, and ServingHub. */
export function createSignalRRealtimeClient(
  getAccessToken: () => string | null
): RealtimeClient {
  const baseUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5159/hubs'
  const hubs = new Map<HubName, signalR.HubConnection>()

  const getHub = (name: HubName): signalR.HubConnection => {
    const existing = hubs.get(name)
    if (existing) return existing

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/${name}`, {
        accessTokenFactory: () => getAccessToken() || '',
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    hubs.set(name, connection)
    return connection
  }

  return {
    async connect(): Promise<void> {
      const names: HubName[] = ['FloorPlanHub', 'KitchenHub', 'ServingHub']
      await Promise.all(
        names.map(async (name) => {
          const hub = getHub(name)
          if (hub.state === signalR.HubConnectionState.Disconnected) {
            try {
              await hub.start()
            } catch {
              // Automatic reconnect handles transient failures
            }
          }
        })
      )
    },

    async disconnect(): Promise<void> {
      await Promise.all(
        Array.from(hubs.values()).map((hub) =>
          hub.state !== signalR.HubConnectionState.Disconnected
            ? hub.stop()
            : Promise.resolve()
        )
      )
    },

    subscribe<K extends RealtimeEventName>(
      event: K,
      handler: RealtimeHandler<K>
    ): () => void {
      const hub = getHub(EVENT_HUB_MAP[event])
      const listener = (payload: RealtimePayloadMap[K]) => handler(payload)
      hub.on(event, listener)
      return () => {
        hub.off(event, listener)
      }
    },

    publish(): void {
      // Server-originated events in SignalR mode are pushed by the backend.
    },
  }
}
