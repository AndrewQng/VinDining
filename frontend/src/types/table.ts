export type TableStatus = 'Available' | 'LockedForPayment' | 'Reserved' | 'Occupied' | 'Cleaning'

export type TableZone = 'MainHall' | 'VIP' | 'Balcony' | 'Terrace'

export interface Table {
  id: string
  tableNumber: string
  capacity: number
  zone: TableZone
  status: TableStatus
  currentOrderId?: string | null
  assignedWaitstaffId?: string | null
  assignedWaitstaffName?: string | null
  positionX?: number
  positionY?: number
  updatedAtUtc?: string
}

export interface FloorPlanFilter {
  zone?: TableZone | 'All'
  status?: TableStatus | 'All'
}
