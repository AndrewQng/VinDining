import type {
  AvailableSlotDto,
  AvailableSlotsQuery,
  CancelReservationRequest,
  CancelReservationResponse,
  CategoryDto,
  CreateReservationRequest,
  CreateReservationResponse,
  CurrentUserDto,
  FeedbackDto,
  LoginRequest,
  LoginResponse,
  ReservationDto,
  ServiceRequestDto,
  ServiceRequestType,
  SubmitFeedbackRequest,
  TableMenuResponse,
  TastingMenuDto,
  VnPayIpnRequest,
} from '@/types'
import { apiClient } from './client'

export { apiClient } from './client'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
    return data
  },
  me: async (): Promise<CurrentUserDto> => {
    const { data } = await apiClient.get<CurrentUserDto>('/auth/me')
    return data
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}

export const serviceCallApi = {
  getActive: async (): Promise<ServiceRequestDto[]> => {
    const { data } = await apiClient.get<ServiceRequestDto[]>(
      '/service-calls/active'
    )
    return data
  },
}

export const menuApi = {
  getCategories: async (): Promise<CategoryDto[]> => {
    const { data } = await apiClient.get<CategoryDto[]>('/menu/categories')
    return data
  },
  getTastingMenus: async (): Promise<TastingMenuDto[]> => {
    const { data } = await apiClient.get<TastingMenuDto[]>(
      '/menu/tasting-menus'
    )
    return data
  },
  getTableMenu: async (qrCode: string): Promise<TableMenuResponse> => {
    const { data } = await apiClient.get<TableMenuResponse>(
      `/menu/table/${encodeURIComponent(qrCode)}`
    )
    return data
  },
  callService: async (
    tableId: string,
    requestType: ServiceRequestType
  ): Promise<ServiceRequestDto> => {
    const { data } = await apiClient.post<ServiceRequestDto>(
      `/tables/${encodeURIComponent(tableId)}/call-service`,
      { requestType }
    )
    return data
  },
}

export const reservationApi = {
  getAvailableSlots: async (
    query: AvailableSlotsQuery
  ): Promise<AvailableSlotDto[]> => {
    const { data } = await apiClient.get<AvailableSlotDto[]>(
      '/reservations/available-slots',
      { params: query }
    )
    return data
  },
  create: async (
    payload: CreateReservationRequest
  ): Promise<CreateReservationResponse> => {
    const { data } = await apiClient.post<CreateReservationResponse>(
      '/reservations',
      payload
    )
    return data
  },
  getByCode: async (
    code: string,
    phone?: string
  ): Promise<ReservationDto> => {
    const { data } = await apiClient.get<ReservationDto>(
      `/reservations/${encodeURIComponent(code)}`,
      { params: phone !== undefined ? { phone } : undefined }
    )
    return data
  },
  processVnPayIpn: async (
    payload: VnPayIpnRequest
  ): Promise<{ success: boolean; reservation: ReservationDto }> => {
    const { data } = await apiClient.post<{
      success: boolean
      reservation: ReservationDto
    }>('/payments/vnpay-ipn', payload)
    return data
  },
  cancel: async (
    payload: CancelReservationRequest
  ): Promise<CancelReservationResponse> => {
    const { data } = await apiClient.post<CancelReservationResponse>(
      '/reservations/cancel',
      payload
    )
    return data
  },
}

export const feedbackApi = {
  submit: async (payload: SubmitFeedbackRequest): Promise<FeedbackDto> => {
    const { data } = await apiClient.post<FeedbackDto>('/feedbacks', payload)
    return data
  },
}
