import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/services/api/orderApi'
import type {
  CreateOrderCommand,
  CourseFiringRequest,
  RemakeItemRequest,
  CancelItemRequest,
} from '@/types'

export const ORDER_KEYS = {
  all: ['orders'] as const,
  detail: (id: string) => [...ORDER_KEYS.all, 'detail', id] as const,
}

export function useOrder(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(orderId),
    queryFn: () => orderApi.getOrder(orderId),
    enabled: enabled && !!orderId,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (command: CreateOrderCommand) => orderApi.createOrder(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
    },
  })
}

export function useFireCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, request }: { orderId: string; request: CourseFiringRequest }) =>
      orderApi.fireCourse(orderId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
    },
  })
}

export function useServeItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      orderApi.serveItem(orderId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
    },
  })
}

export function useRemakeItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      request,
    }: {
      orderId: string
      itemId: string
      request?: RemakeItemRequest
    }) => orderApi.remakeItem(orderId, itemId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
    },
  })
}

export function useCancelItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      request,
    }: {
      orderId: string
      itemId: string
      request?: CancelItemRequest
    }) => orderApi.cancelItem(orderId, itemId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
    },
  })
}
