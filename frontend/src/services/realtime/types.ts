import type { CourseType, ServiceRequestType, TableStatus } from '@/types'

/** All realtime event names broadcast across VinDining hubs and tabs. */
export type RealtimeEventName =
  | 'table:status-changed'
  | 'order:updated'
  | 'course:activated'
  | 'item:served'
  | 'item:remake-requested'
  | 'service-request:created'
  | 'service-request:completed'
  | 'checkout:requested'
  | 'invoice:settled'
  | 'sla:alert'
  | 'menu:updated'

/** Strongly typed event payloads keyed by RealtimeEventName. */
export interface RealtimePayloadMap {
  'table:status-changed': { tableId: string; tableNumber: string; status: TableStatus }
  'order:updated': { orderId: string; tableId: string; tableNumber: string }
  'course:activated': { orderId: string; tableId: string; courseType: CourseType; isPriority: boolean }
  'item:served': { orderId: string; orderItemId: string; tableId: string; itemName: string }
  'item:remake-requested': {
    orderId: string
    orderItemId: string
    tableId: string
    itemName: string
  }
  'service-request:created': {
    requestId: string
    tableId: string
    tableNumber: string
    requestType: ServiceRequestType
  }
  'service-request:completed': { requestId: string; tableId: string }
  'checkout:requested': { tableId: string; tableNumber: string }
  'invoice:settled': { invoiceId: string; tableId: string; tableNumber: string }
  'sla:alert': { overdueCount: number; warningCount: number }
  'menu:updated': { entity: 'item' | 'tasting-menu' }
}

export type RealtimeHandler<K extends RealtimeEventName> = (
  payload: RealtimePayloadMap[K]
) => void

/** Unified realtime transport contract implemented by both SignalR and Mock BroadcastChannel. */
export interface RealtimeClient {
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribe<K extends RealtimeEventName>(
    event: K,
    handler: RealtimeHandler<K>
  ): () => void
  publish<K extends RealtimeEventName>(
    event: K,
    payload: RealtimePayloadMap[K]
  ): void
}
