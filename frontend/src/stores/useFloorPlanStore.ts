import { create } from 'zustand'
import type { Table, TableStatus, TableZone } from '@/types/table'

interface FloorPlanState {
  tables: Table[]
  selectedZone: TableZone | 'All'
  selectedStatus: TableStatus | 'All'
  selectedTableId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setTables: (tables: Table[]) => void
  updateTableStatus: (tableId: string, status: TableStatus, currentOrderId?: string | null) => void
  setSelectedZone: (zone: TableZone | 'All') => void
  setSelectedStatus: (status: TableStatus | 'All') => void
  setSelectedTableId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFloorPlanStore = create<FloorPlanState>((set) => ({
  tables: [],
  selectedZone: 'All',
  selectedStatus: 'All',
  selectedTableId: null,
  isLoading: false,
  error: null,

  setTables: (tables) => set({ tables }),

  updateTableStatus: (tableId, status, currentOrderId) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status,
              currentOrderId: currentOrderId !== undefined ? currentOrderId : t.currentOrderId,
              updatedAtUtc: new Date().toISOString(),
            }
          : t
      ),
    })),

  setSelectedZone: (zone) => set({ selectedZone: zone }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSelectedTableId: (id) => set({ selectedTableId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
