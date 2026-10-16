import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reservationApi } from '@/services/api/reservationApi'
import type {
  CreateReservationCommand,
  ConfirmDepositPaymentCommand,
} from '@/types'

export const RESERVATION_KEYS = {
  all: ['reservations'] as const,
  availableTables: (params: { reservationTime: string; partySize: number; zone?: number }) =>
    [...RESERVATION_KEYS.all, 'available-tables', params] as const,
  detail: (code: string) => [...RESERVATION_KEYS.all, 'detail', code] as const,
}

export function useAvailableTables(params: {
  reservationTime: string
  partySize: number
  zone?: number
  enabled?: boolean
}) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: RESERVATION_KEYS.availableTables(queryParams),
    queryFn: () => reservationApi.getAvailableTables(queryParams),
    enabled: enabled && !!params.reservationTime && params.partySize > 0,
    staleTime: 1000 * 30, // 30s
  })
}

export function useReservationByCode(bookingCode: string, enabled = true) {
  return useQuery({
    queryKey: RESERVATION_KEYS.detail(bookingCode),
    queryFn: () => reservationApi.getReservationByCode(bookingCode),
    enabled: enabled && !!bookingCode,
    staleTime: 1000 * 60,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (command: CreateReservationCommand) => reservationApi.createReservation(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.all })
    },
  })
}

export function useConfirmDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (command: ConfirmDepositPaymentCommand) => reservationApi.confirmDeposit(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.detail(variables.bookingCode) })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingCode, reason }: { bookingCode: string; reason?: string }) =>
      reservationApi.cancelReservation(bookingCode, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.detail(variables.bookingCode) })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
