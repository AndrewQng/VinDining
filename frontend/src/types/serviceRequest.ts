/** Canonical guest service request types from QR E-Menu. */
export type ServiceRequestType = 'CallStaff' | 'RefillWater' | 'ChangeUtensils'

/** Status of a guest service request. */
export type ServiceRequestStatus = 'Pending' | 'Completed'

/** Service request DTO matching the ServiceRequests ERD table. */
export interface ServiceRequestDto {
  id: string
  tableId: string
  tableNumber: string
  requestType: ServiceRequestType
  status: ServiceRequestStatus
  completedById: string | null
  completedAt: string | null
  createdAt: string
}

/** Payload for POST /api/tables/{id}/call-service. */
export interface CreateServiceRequestInput {
  requestType: ServiceRequestType
}
