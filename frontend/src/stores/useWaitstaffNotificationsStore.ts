import { create } from 'zustand'
import type { ServiceRequestDto } from '@/types'

export interface WaitstaffFeedAlert {
  id: string
  kind: 'pass-ready' | 'remake'
  tableId: string
  tableNumber: string
  itemName: string
  createdAt: string
  acknowledged: boolean
}

interface WaitstaffNotificationsState {
  alerts: WaitstaffFeedAlert[]
  completedRequests: ServiceRequestDto[]
  pushAlert: (
    alert: Omit<WaitstaffFeedAlert, 'id' | 'createdAt' | 'acknowledged'>
  ) => void
  acknowledgeAlert: (id: string) => void
  recordCompletedRequest: (req: ServiceRequestDto) => void
  resetNotifications: () => void
}

/** Tracks realtime Pass/Remake notifications and recently completed service calls for Waitstaff W9. */
export const useWaitstaffNotificationsStore =
  create<WaitstaffNotificationsState>((set) => ({
    alerts: [],
    completedRequests: [],
    pushAlert: (alert) =>
      set((state) => ({
        alerts: [
          {
            ...alert,
            id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: new Date().toISOString(),
            acknowledged: false,
          },
          ...state.alerts,
        ].slice(0, 20),
      })),
    acknowledgeAlert: (id) =>
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, acknowledged: true } : a
        ),
      })),
    recordCompletedRequest: (req) =>
      set((state) => ({
        completedRequests: [
          req,
          ...state.completedRequests.filter((r) => r.id !== req.id),
        ].slice(0, 10),
      })),
    resetNotifications: () => set({ alerts: [], completedRequests: [] }),
  }))
