import apiClient from './client'
import type {
  CreateOrderCommand,
  CourseFiringRequest,
  RemakeItemRequest,
  CancelItemRequest,
} from '@/types'

export const orderApi = {
  createOrder: async (command: CreateOrderCommand): Promise<{ orderId: string }> => {
    const response = await apiClient.post<{ orderId: string }>('/order', command)
    return response.data
  },

  getOrder: async (orderId: string): Promise<{ orderId: string; status: string }> => {
    const response = await apiClient.get<{ orderId: string; status: string }>(`/order/${orderId}`)
    return response.data
  },

  fireCourse: async (
    orderId: string,
    request: CourseFiringRequest
  ): Promise<{ orderId: string; firedCount: number; message: string }> => {
    const response = await apiClient.post<{ orderId: string; firedCount: number; message: string }>(
      `/order/${orderId}/fire-course`,
      request
    )
    return response.data
  },

  serveItem: async (
    orderId: string,
    itemId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `/order/${orderId}/items/${itemId}/serve`
    )
    return response.data
  },

  remakeItem: async (
    orderId: string,
    itemId: string,
    request?: RemakeItemRequest
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `/order/${orderId}/items/${itemId}/remake`,
      request
    )
    return response.data
  },

  cancelItem: async (
    orderId: string,
    itemId: string,
    request?: CancelItemRequest
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `/order/${orderId}/items/${itemId}/cancel`,
      request
    )
    return response.data
  },
}

export default orderApi
