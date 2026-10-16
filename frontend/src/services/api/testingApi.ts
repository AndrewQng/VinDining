import apiClient from './client'

export interface SeedDataResponse {
  message: string
  staff: {
    waitstaffId: string
    expediterId: string
  }
  tables: {
    tableVipId: string
    tableVipNumber: string
    tableMainId: string
    tableMainNumber: string
  }
  menuItems: {
    appetizerId: string
    mainCourseId: string
    dessertId: string
    beverageId: string
  }
  reservation: {
    reservationId: string
    depositAmount: number
  }
}

export interface TestingOverviewResponse {
  tables: Array<{
    id: string
    tableNumber: string
    zone: string
    status: string
  }>
  recentOrders: Array<{
    id: string
    tableNumber: string
    status: string
    openedAt: string
    closedAt?: string
    items: Array<{
      id: string
      itemName: string
      quantity: number
      unitPrice: number
      status: string
      isRush: boolean
      note?: string
    }>
    hasInvoice: boolean
    invoiceTotal: number
  }>
}

export const testingApi = {
  seedSampleData: async (): Promise<SeedDataResponse> => {
    const response = await apiClient.post<SeedDataResponse>('/testing/seed')
    return response.data
  },

  getOverview: async (): Promise<TestingOverviewResponse> => {
    const response = await apiClient.get<TestingOverviewResponse>('/testing/overview')
    return response.data
  },
}

export default testingApi
