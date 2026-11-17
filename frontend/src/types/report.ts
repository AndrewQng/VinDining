import type { TableZone } from './table'

/** Supported report time ranges. */
export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter'

/** Supported report export formats. */
export type ExportReportFormat = 'excel' | 'pdf'

/** Query parameters for GET /api/manager/reports/dashboard and /export. */
export interface ReportDateRangeQuery {
  period: ReportPeriod
  from?: string
  to?: string
  zone?: TableZone
}

/** Best-selling menu item metric row. */
export interface BestSellerItemDto {
  menuItemId: string
  name: string
  quantitySold: number
  revenue: number
}

/** Zone-level breakdown row for revenue reporting. */
export interface ZoneRevenueDto {
  zone: TableZone
  revenue: number
  guestCount: number
  reservationCount: number
}

/** Dashboard metrics DTO returned by GET /api/manager/reports/dashboard. */
export interface DashboardMetricsDto {
  totalRevenue: number
  totalGuests: number
  occupancyRate: number
  cancellationRate: number
  bestSellers: BestSellerItemDto[]
  revenueByZone: ZoneRevenueDto[]
}
