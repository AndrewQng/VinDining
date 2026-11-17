import type {
  AddOrderItemsRequest,
  AvailableSlotDto,
  AvailableSlotsQuery,
  CancelReservationRequest,
  CancelReservationResponse,
  CategoryDto,
  CheckInRequest,
  CreateOrderRequest,
  CreateReservationRequest,
  CreateReservationResponse,
  CurrentUserDto,
  FeedbackDto,
  FireCourseRequest,
  KitchenPendingTicketDto,
  LoginRequest,
  LoginResponse,
  MenuItemDto,
  OrderDto,
  OrderItemDto,
  ReservationDto,
  ReservationStatus,
  ServiceRequestDto,
  ServiceRequestType,
  SubmitFeedbackRequest,
  TableDetailDto,
  TableDto,
  TableMenuResponse,
  TableStatus,
  TastingMenuDto,
  TransferTableRequest,
  VnPayIpnRequest,
  WalkInRequest,
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
  complete: async (id: string): Promise<ServiceRequestDto> => {
    const { data } = await apiClient.patch<ServiceRequestDto>(
      `/service-calls/${encodeURIComponent(id)}/complete`
    )
    return data
  },
}

export const menuApi = {
  getCategories: async (): Promise<CategoryDto[]> => {
    const { data } = await apiClient.get<CategoryDto[]>('/menu/categories')
    return data
  },
  getItems: async (params?: { categoryId?: string }): Promise<MenuItemDto[]> => {
    const categories = await menuApi.getCategories()
    const all = categories.flatMap((c) => c.items ?? [])
    return params?.categoryId
      ? all.filter((item) => item.categoryId === params.categoryId)
      : all
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
  search: async (params?: {
    status?: ReservationStatus
    search?: string
  }): Promise<ReservationDto[]> => {
    const { data } = await apiClient.get<ReservationDto[]>('/reservations', {
      params,
    })
    return data
  },
}

export const tableApi = {
  getAll: async (): Promise<TableDto[]> => {
    const { data } = await apiClient.get<TableDto[]>('/tables')
    return data
  },
  getById: async (id: string): Promise<TableDetailDto> => {
    const { data } = await apiClient.get<TableDetailDto>(
      `/tables/${encodeURIComponent(id)}`
    )
    return data
  },
  checkIn: async (
    tableId: string,
    payload: CheckInRequest
  ): Promise<{ table: TableDto; order: OrderDto | null }> => {
    const { data } = await apiClient.post<{
      table: TableDto
      order: OrderDto | null
    }>(`/tables/${encodeURIComponent(tableId)}/check-in`, payload)
    return data
  },
  walkIn: async (tableId: string, payload: WalkInRequest): Promise<TableDto> => {
    const { data } = await apiClient.post<TableDto>(
      `/tables/${encodeURIComponent(tableId)}/walk-in`,
      payload
    )
    return data
  },
  transfer: async (
    sourceId: string,
    payload: TransferTableRequest
  ): Promise<{ sourceTable: TableDto; targetTable: TableDto }> => {
    const { data } = await apiClient.post<{
      sourceTable: TableDto
      targetTable: TableDto
    }>(`/tables/${encodeURIComponent(sourceId)}/transfer`, payload)
    return data
  },
  updateStatus: async (
    tableId: string,
    status: TableStatus
  ): Promise<TableDto> => {
    const { data } = await apiClient.patch<TableDto>(
      `/tables/${encodeURIComponent(tableId)}/status`,
      { status }
    )
    return data
  },
}

export const orderApi = {
  getByTable: async (tableId: string): Promise<OrderDto> => {
    const { data } = await apiClient.get<OrderDto>(
      `/orders/table/${encodeURIComponent(tableId)}`
    )
    return data
  },
  getById: async (orderId: string): Promise<OrderDto> => {
    const { data } = await apiClient.get<OrderDto>(
      `/orders/${encodeURIComponent(orderId)}`
    )
    return data
  },
  create: async (payload: CreateOrderRequest): Promise<OrderDto> => {
    const { data } = await apiClient.post<OrderDto>('/orders', payload)
    return data
  },
  activateCourse: async (
    orderId: string,
    payload: FireCourseRequest
  ): Promise<OrderDto> => {
    const { data } = await apiClient.post<OrderDto>(
      `/orders/${encodeURIComponent(orderId)}/fire-course`,
      payload
    )
    return data
  },
  addItems: async (
    orderId: string,
    payload: AddOrderItemsRequest
  ): Promise<OrderDto> => {
    const { data } = await apiClient.post<OrderDto>(
      `/orders/${encodeURIComponent(orderId)}/items`,
      payload
    )
    return data
  },
  getKitchenPending: async (): Promise<KitchenPendingTicketDto[]> => {
    const { data } = await apiClient.get<KitchenPendingTicketDto[]>(
      '/orders/kitchen/pending'
    )
    return data
  },
  serveItem: async (
    orderId: string,
    itemId: string
  ): Promise<OrderItemDto> => {
    const { data } = await apiClient.patch<OrderItemDto>(
      `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/serve`
    )
    return data
  },
  remakeItem: async (orderId: string, itemId: string): Promise<OrderItemDto> => {
    const { data } = await apiClient.post<OrderItemDto>(
      `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/remake`
    )
    return data
  },
}

export const invoiceApi = {
  requestCheckout: async (tableId: string): Promise<TableDto> => {
    const { data } = await apiClient.post<TableDto>(
      `/tables/${encodeURIComponent(tableId)}/request-checkout`
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
