import apiClient from './client'
import type {
  AvailableTableDto,
  CreateReservationCommand,
  CreateReservationResultDto,
  ConfirmDepositPaymentCommand,
  CancelReservationResultDto,
  ReservationDetailDto,
} from '@/types'

export const reservationApi = {
  getAvailableTables: async (params: {
    reservationTime: string
    partySize: number
    zone?: number
  }): Promise<AvailableTableDto[]> => {
    const response = await apiClient.get<AvailableTableDto[]>('/reservation/available-tables', {
      params,
    })
    return response.data
  },

  createReservation: async (
    command: CreateReservationCommand
  ): Promise<CreateReservationResultDto> => {
    const response = await apiClient.post<CreateReservationResultDto>('/reservation', command)
    return response.data
  },

  getReservationByCode: async (bookingCode: string): Promise<ReservationDetailDto> => {
    const response = await apiClient.get<ReservationDetailDto>(`/reservation/${bookingCode}`)
    return response.data
  },

  confirmDeposit: async (command: ConfirmDepositPaymentCommand): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/reservation/confirm-deposit',
      command
    )
    return response.data
  },

  cancelReservation: async (
    bookingCode: string,
    reason?: string
  ): Promise<CancelReservationResultDto> => {
    const response = await apiClient.patch<CancelReservationResultDto>(
      `/reservation/${bookingCode}/cancel`,
      { reason }
    )
    return response.data
  },
}

export default reservationApi
