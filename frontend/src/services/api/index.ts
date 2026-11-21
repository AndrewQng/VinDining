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
  FeedbackTokenValidationDto,
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
  PassHistoryItemDto,
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
import {
  normalizeOrder,
  normalizeOrderItem,
  normalizeOrderItemStatus,
  normalizePaymentMethod,
  normalizeReservation,
  normalizeStaffRole,
  normalizeTable,
} from './normalize'

export { apiClient } from './client'
export * from './normalize'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<
      LoginResponse & {
        id?: string
        username?: string
        fullName?: string
        email?: string
        phoneNumber?: string
        role?: string
        expiresAt?: string
      }
    >('/auth/login', payload)
    const user: CurrentUserDto = data.user
      ? {
          ...data.user,
          role: normalizeStaffRole(data.user.role),
        }
      : {
          id: data.id ?? '',
          username: data.username ?? payload.username,
          fullName: data.fullName ?? payload.username,
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
          role: normalizeStaffRole(data.role ?? 'Manager'),
        }
    return {
      token: data.token,
      expiresAtUtc: data.expiresAtUtc ?? data.expiresAt ?? new Date().toISOString(),
      user,
    }
  },
  me: async (): Promise<CurrentUserDto> => {
    const { data } = await apiClient.get<CurrentUserDto>('/auth/me')
    return {
      ...data,
      role: normalizeStaffRole(data.role),
    }
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
    return {
      ...data,
      reservation: normalizeReservation(data.reservation),
    }
  },
  getByCode: async (
    code: string,
    phone?: string
  ): Promise<ReservationDto> => {
    const { data } = await apiClient.get<ReservationDto>(
      `/reservations/${encodeURIComponent(code)}`,
      { params: phone !== undefined ? { phone } : undefined }
    )
    return normalizeReservation(data)
  },
  processVnPayIpn: async (
    payload: VnPayIpnRequest
  ): Promise<{ success: boolean; reservation: ReservationDto }> => {
    const { data } = await apiClient.post<{
      success: boolean
      reservation: ReservationDto
    }>('/payments/vnpay-ipn', payload)
    return {
      ...data,
      reservation: normalizeReservation(data.reservation),
    }
  },
  cancel: async (
    payload: CancelReservationRequest
  ): Promise<CancelReservationResponse> => {
    const { data } = await apiClient.post<CancelReservationResponse>(
      '/reservations/cancel',
      payload
    )
    return {
      ...data,
      reservation: normalizeReservation(data.reservation),
    }
  },
  search: async (params?: {
    status?: ReservationStatus
    search?: string
  }): Promise<ReservationDto[]> => {
    const { data } = await apiClient.get<ReservationDto[]>('/reservations', {
      params,
    })
    return data.map(normalizeReservation)
  },
}

export const tableApi = {
  getAll: async (): Promise<TableDto[]> => {
    const { data } = await apiClient.get<TableDto[]>('/tables')
    return data.map(normalizeTable)
  },
  getById: async (id: string): Promise<TableDetailDto> => {
    const { data } = await apiClient.get<TableDetailDto>(
      `/tables/${encodeURIComponent(id)}`
    )
    return {
      table: normalizeTable(data.table),
      activeOrder: data.activeOrder ? normalizeOrder(data.activeOrder) : null,
      activeReservation: data.activeReservation
        ? normalizeReservation(data.activeReservation)
        : null,
    }
  },
  checkIn: async (
    tableId: string,
    payload: CheckInRequest
  ): Promise<{ table: TableDto; order: OrderDto | null }> => {
    const { data } = await apiClient.post<{
      table: TableDto
      order: OrderDto | null
    }>(`/tables/${encodeURIComponent(tableId)}/check-in`, payload)
    return {
      table: normalizeTable(data.table),
      order: data.order ? normalizeOrder(data.order) : null,
    }
  },
  walkIn: async (tableId: string, payload: WalkInRequest): Promise<TableDto> => {
    const { data } = await apiClient.post<TableDto>(
      `/tables/${encodeURIComponent(tableId)}/walk-in`,
      payload
    )
    return normalizeTable(data)
  },
  transfer: async (
    sourceId: string,
    payload: TransferTableRequest
  ): Promise<{ sourceTable: TableDto; targetTable: TableDto }> => {
    const { data } = await apiClient.post<{
      sourceTable: TableDto
      targetTable: TableDto
    }>(`/tables/${encodeURIComponent(sourceId)}/transfer`, payload)
    return {
      sourceTable: normalizeTable(data.sourceTable),
      targetTable: normalizeTable(data.targetTable),
    }
  },
  updateStatus: async (
    tableId: string,
    status: TableStatus
  ): Promise<TableDto> => {
    const { data } = await apiClient.patch<TableDto>(
      `/tables/${encodeURIComponent(tableId)}/status`,
      { status }
    )
    return normalizeTable(data)
  },
}

export const orderApi = {
  getByTable: async (tableId: string): Promise<OrderDto> => {
    const { data } = await apiClient.get<OrderDto>(
      `/orders/table/${encodeURIComponent(tableId)}`
    )
    return normalizeOrder(data)
  },
  getById: async (orderId: string): Promise<OrderDto> => {
    const { data } = await apiClient.get<OrderDto>(
      `/orders/${encodeURIComponent(orderId)}`
    )
    return normalizeOrder(data)
  },
  create: async (payload: CreateOrderRequest): Promise<OrderDto> => {
    const { data } = await apiClient.post<OrderDto>('/orders', payload)
    return normalizeOrder(data)
  },
  activateCourse: async (
    orderId: string,
    payload: FireCourseRequest
  ): Promise<OrderDto> => {
    const { data } = await apiClient.post<OrderDto>(
      `/orders/${encodeURIComponent(orderId)}/fire-course`,
      payload
    )
    return normalizeOrder(data)
  },
  addItems: async (
    orderId: string,
    payload: AddOrderItemsRequest
  ): Promise<OrderDto> => {
    const { data } = await apiClient.post<OrderDto>(
      `/orders/${encodeURIComponent(orderId)}/items`,
      payload
    )
    return normalizeOrder(data)
  },
  getKitchenPending: async (): Promise<KitchenPendingTicketDto[]> => {
    const { data } = await apiClient.get<KitchenPendingTicketDto[]>(
      '/orders/kitchen/pending'
    )
    return data.map((ticket) => ({
      ...ticket,
      status: normalizeOrderItemStatus(ticket.status),
    }))
  },
  getPassHistory: async (
    tableNumber?: string
  ): Promise<PassHistoryItemDto[]> => {
    const { data } = await apiClient.get<PassHistoryItemDto[]>(
      '/orders/pass/history',
      {
        params: tableNumber ? { tableNumber } : undefined,
      }
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
    return normalizeOrderItem(data)
  },
  remakeItem: async (orderId: string, itemId: string): Promise<OrderItemDto> => {
    const { data } = await apiClient.post<OrderItemDto>(
      `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/remake`
    )
    return normalizeOrderItem(data)
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
    return {
      ...data,
      items: (data.items ?? []).map(normalizeOrderItem),
    }
  },
  printPreview: async (tableId: string): Promise<PrintPreviewResponse> => {
    const { data } = await apiClient.post<PrintPreviewResponse>(
      `/invoices/${encodeURIComponent(tableId)}/print-preview`
    )
    return {
      ...data,
      preview: {
        ...data.preview,
        items: (data.preview?.items ?? []).map(normalizeOrderItem),
      },
    }
  },
  settle: async (
    tableId: string,
    payload: SettleInvoiceRequest
  ): Promise<InvoiceDto> => {
    const { data } = await apiClient.post<InvoiceDto>(
      `/invoices/${encodeURIComponent(tableId)}/settle`,
      payload
    )
    return {
      ...data,
      paymentMethod: normalizePaymentMethod(data.paymentMethod),
      items: data.items ? data.items.map(normalizeOrderItem) : data.items,
    }
  },
  list: async (filter?: InvoiceFilter): Promise<InvoiceDto[]> => {
    const mappedFilter = filter
      ? {
          ...filter,
          paymentMethod:
            filter.paymentMethod === 'VietQR'
              ? 'BankTransfer'
              : filter.paymentMethod,
        }
      : undefined
    const { data } = await apiClient.get<InvoiceDto[]>('/invoices', {
      params: mappedFilter,
    })
    return data.map((inv) => ({
      ...inv,
      paymentMethod: normalizePaymentMethod(inv.paymentMethod),
      items: inv.items ? inv.items.map(normalizeOrderItem) : inv.items,
    }))
  },
  getById: async (invoiceId: string): Promise<InvoiceDto> => {
    const { data } = await apiClient.get<InvoiceDto>(
      `/invoices/${encodeURIComponent(invoiceId)}`
    )
    return {
      ...data,
      paymentMethod: normalizePaymentMethod(data.paymentMethod),
      items: data.items ? data.items.map(normalizeOrderItem) : data.items,
    }
  },
}

export const feedbackApi = {
  validateToken: async (token: string): Promise<FeedbackTokenValidationDto> => {
    const { data } = await apiClient.get<FeedbackTokenValidationDto>(
      `/feedbacks/validate/${encodeURIComponent(token)}`
    )
    return data
  },
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
    const { data } = await apiClient.put<TableDto[] | { tables: TableDto[] }>(
      '/manager/tables/layout',
      payload
    )
    const list = Array.isArray(data) ? data : data.tables
    return list.map(normalizeTable)
  },
  createTable: async (payload: CreateTableRequest): Promise<TableDto> => {
    const { data } = await apiClient.post<TableDto>('/manager/tables', payload)
    return normalizeTable(data)
  },
  deleteTable: async (id: string): Promise<{ deleted: boolean }> => {
    const { data } = await apiClient.delete<{ deleted: boolean }>(
      `/manager/tables/${encodeURIComponent(id)}`
    )
    return data
  },
  getRefunds: async (): Promise<RefundRequestDto[]> => {
    const { data } = await apiClient.get<RefundRequestDto[]>('/manager/refunds')
    return data.map((row) => ({
      ...row,
      reservation: normalizeReservation(row.reservation),
    }))
  },
  processManualRefund: async (
    reservationId: string,
    payload: ManualRefundRequest
  ): Promise<ReservationDto> => {
    const { data } = await apiClient.post<ReservationDto>(
      `/manager/reservations/${encodeURIComponent(reservationId)}/manual-refund`,
      payload
    )
    return normalizeReservation(data)
  },
  getStaffList: async (filter?: StaffFilter): Promise<StaffDto[]> => {
    const { data } = await apiClient.get<StaffDto[]>('/manager/staff', {
      params: filter,
    })
    return data.map((s) => ({ ...s, role: normalizeStaffRole(s.role) }))
  },
  createStaff: async (
    payload: CreateStaffRequest
  ): Promise<CreateStaffResponse> => {
    const { data } = await apiClient.post<CreateStaffResponse>(
      '/manager/staff',
      payload
    )
    return { ...data, role: normalizeStaffRole(data.role) }
  },
  updateStaff: async (
    id: string,
    payload: UpdateStaffRequest
  ): Promise<StaffDto> => {
    const { data } = await apiClient.put<StaffDto>(
      `/manager/staff/${encodeURIComponent(id)}`,
      payload
    )
    return { ...data, role: normalizeStaffRole(data.role) }
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
    return { ...data, role: normalizeStaffRole(data.role) }
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
