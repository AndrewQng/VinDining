import type {
  AddOrderItemsRequest,
  AvailableSlotDto,
  AvailableSlotsQuery,
  CancelReservationRequest,
  CancelReservationResponse,
  CategoryDto,
  CheckInRequest,
  CreateMenuItemRequest,
  CreateOrderRequest,
  CreateReservationRequest,
  CreateReservationResponse,
  CreateStaffRequest,
  CreateStaffResponse,
  CreateTableRequest,
  CreateTastingMenuRequest,
  CurrentUserDto,
  DashboardMetricsDto,
  ExportReportFormat,
  FeedbackDto,
  FireCourseRequest,
  InvoiceDto,
  InvoiceFilter,
  InvoicePreviewDto,
  KitchenPendingTicketDto,
  LoginRequest,
  LoginResponse,
  ManualRefundRequest,
  MenuItemDto,
  MenuItemStatus,
  OrderDto,
  OrderItemDto,
  PrintPreviewResponse,
  RefundRequestDto,
  ReportDateRangeQuery,
  ReservationDto,
  ReservationStatus,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ServiceRequestDto,
  ServiceRequestType,
  SettleInvoiceRequest,
  StaffDto,
  StaffFilter,
  SubmitFeedbackRequest,
  TableDetailDto,
  TableDto,
  TableMenuResponse,
  TableStatus,
  TastingMenuDto,
  TransferTableRequest,
  UpdateFloorPlanLayoutRequest,
  UpdateMenuItemRequest,
  UpdateStaffRequest,
  UpdateTastingMenuRequest,
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
  getPreview: async (tableId: string): Promise<InvoicePreviewDto> => {
    const { data } = await apiClient.get<InvoicePreviewDto>(
      `/invoices/preview/${encodeURIComponent(tableId)}`
    )
    return data
  },
  printPreview: async (tableId: string): Promise<PrintPreviewResponse> => {
    const { data } = await apiClient.post<PrintPreviewResponse>(
      `/invoices/${encodeURIComponent(tableId)}/print-preview`
    )
    return data
  },
  settle: async (
    tableId: string,
    payload: SettleInvoiceRequest
  ): Promise<InvoiceDto> => {
    const { data } = await apiClient.post<InvoiceDto>(
      `/invoices/${encodeURIComponent(tableId)}/settle`,
      payload
    )
    return data
  },
  list: async (filter?: InvoiceFilter): Promise<InvoiceDto[]> => {
    const { data } = await apiClient.get<InvoiceDto[]>('/invoices', {
      params: filter,
    })
    return data
  },
  getById: async (invoiceId: string): Promise<InvoiceDto> => {
    const { data } = await apiClient.get<InvoiceDto>(
      `/invoices/${encodeURIComponent(invoiceId)}`
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

export const managerApi = {
  getMenuItems: async (search?: string): Promise<MenuItemDto[]> => {
    const { data } = await apiClient.get<MenuItemDto[]>('/manager/menu-items', {
      params: search ? { search } : undefined,
    })
    return data
  },
  createMenuItem: async (
    payload: CreateMenuItemRequest
  ): Promise<MenuItemDto> => {
    const { data } = await apiClient.post<MenuItemDto>(
      '/manager/menu-items',
      payload
    )
    return data
  },
  updateMenuItem: async (
    id: string,
    payload: UpdateMenuItemRequest
  ): Promise<MenuItemDto> => {
    const { data } = await apiClient.put<MenuItemDto>(
      `/manager/menu-items/${encodeURIComponent(id)}`,
      payload
    )
    return data
  },
  setMenuItemAvailability: async (
    id: string,
    status: MenuItemStatus
  ): Promise<MenuItemDto> => {
    const { data } = await apiClient.patch<MenuItemDto>(
      `/manager/menu-items/${encodeURIComponent(id)}/availability`,
      { status }
    )
    return data
  },
  deleteMenuItem: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ deleted: boolean }>(
      `/manager/menu-items/${encodeURIComponent(id)}`
    )
    return data
  },
  getTastingMenus: async (): Promise<TastingMenuDto[]> => {
    const { data } = await apiClient.get<TastingMenuDto[]>(
      '/manager/tasting-menus'
    )
    return data
  },
  createTastingMenu: async (
    payload: CreateTastingMenuRequest
  ): Promise<TastingMenuDto> => {
    const { data } = await apiClient.post<TastingMenuDto>(
      '/manager/tasting-menus',
      payload
    )
    return data
  },
  updateTastingMenu: async (
    id: string,
    payload: UpdateTastingMenuRequest
  ): Promise<TastingMenuDto> => {
    const { data } = await apiClient.put<TastingMenuDto>(
      `/manager/tasting-menus/${encodeURIComponent(id)}`,
      payload
    )
    return data
  },
  deleteTastingMenu: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ deleted: boolean }>(
      `/manager/tasting-menus/${encodeURIComponent(id)}`
    )
    return data
  },
  saveFloorPlanLayout: async (
    payload: UpdateFloorPlanLayoutRequest
  ): Promise<TableDto[]> => {
    const { data } = await apiClient.put<TableDto[]>(
      '/manager/tables/layout',
      payload
    )
    return data
  },
  createTable: async (payload: CreateTableRequest): Promise<TableDto> => {
    const { data } = await apiClient.post<TableDto>('/manager/tables', payload)
    return data
  },
  deleteTable: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ deleted: boolean }>(
      `/manager/tables/${encodeURIComponent(id)}`
    )
    return data
  },
  getRefunds: async (): Promise<RefundRequestDto[]> => {
    const { data } = await apiClient.get<RefundRequestDto[]>('/manager/refunds')
    return data
  },
  processManualRefund: async (
    reservationId: string,
    payload: ManualRefundRequest
  ): Promise<ReservationDto> => {
    const { data } = await apiClient.post<ReservationDto>(
      `/manager/reservations/${encodeURIComponent(reservationId)}/manual-refund`,
      payload
    )
    return data
  },
  getStaffList: async (filter?: StaffFilter): Promise<StaffDto[]> => {
    const { data } = await apiClient.get<StaffDto[]>('/manager/staff', {
      params: filter,
    })
    return data
  },
  createStaff: async (
    payload: CreateStaffRequest
  ): Promise<CreateStaffResponse> => {
    const { data } = await apiClient.post<CreateStaffResponse>(
      '/manager/staff',
      payload
    )
    return data
  },
  updateStaff: async (
    id: string,
    payload: UpdateStaffRequest
  ): Promise<StaffDto> => {
    const { data } = await apiClient.put<StaffDto>(
      `/manager/staff/${encodeURIComponent(id)}`,
      payload
    )
    return data
  },
  resetStaffPassword: async (
    id: string,
    payload?: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    const { data } = await apiClient.post<ResetPasswordResponse>(
      `/manager/staff/${encodeURIComponent(id)}/reset-password`,
      payload ?? {}
    )
    return data
  },
  setStaffStatus: async (
    id: string,
    isActive: boolean
  ): Promise<StaffDto> => {
    const { data } = await apiClient.patch<StaffDto>(
      `/manager/staff/${encodeURIComponent(id)}/status`,
      { isActive }
    )
    return data
  },
  getDashboardReport: async (
    params: ReportDateRangeQuery & { label?: string }
  ): Promise<DashboardMetricsDto> => {
    const { data } = await apiClient.get<DashboardMetricsDto>(
      '/manager/reports/dashboard',
      { params }
    )
    return data
  },
  getFeedbacks: async (): Promise<FeedbackDto[]> => {
    const { data } = await apiClient.get<FeedbackDto[]>('/manager/feedbacks')
    return data
  },
  exportReportMeta: async (
    params: ReportDateRangeQuery & { format: ExportReportFormat }
  ): Promise<{ fileName: string; format: ExportReportFormat; generatedAt: string }> => {
    const { data } = await apiClient.get<{
      fileName: string
      format: ExportReportFormat
      generatedAt: string
    }>('/manager/reports/export', { params })
    return data
  },
}
