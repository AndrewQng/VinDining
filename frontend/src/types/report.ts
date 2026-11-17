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

/** Single bucket in the revenue-over-time series chart. */
export interface RevenueSeriesPointDto {
  label: string
  revenue: number
  guests: number
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

/** Aggregated guest feedback averages returned in reports. */
export interface ReportFeedbackSummaryDto {
  count: number
  avgFood: number
  avgAmbience: number
  avgService: number
}

/** Dashboard metrics DTO returned by GET /api/manager/reports/dashboard. */
export interface DashboardMetricsDto {
  period: ReportPeriod
  from: string
  to: string
  periodLabel: string
  hasData: boolean
  totalRevenue: number
  totalGuests: number
  occupancyRate: number
  cancellationRate: number
  revenueSeries: RevenueSeriesPointDto[]
  bestSellers: BestSellerItemDto[]
  revenueByZone: ZoneRevenueDto[]
  feedbackSummary: ReportFeedbackSummaryDto
}
