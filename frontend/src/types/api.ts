export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]> | string[]
  statusCode: number
}

export interface PaginationMeta {
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface PaginatedList<T> {
  items: T[]
  meta: PaginationMeta
}
