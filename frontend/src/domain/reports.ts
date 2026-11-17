import type {
  BestSellerItemDto,
  DashboardMetricsDto,
  FeedbackDto,
  InvoiceDto,
  OrderDto,
  ReportFeedbackSummaryDto,
  ReportPeriod,
  ReservationDto,
  RevenueSeriesPointDto,
  TableDto,
  TableZone,
  ZoneRevenueDto,
} from '@/types'

const DAILY_TABLE_SLOTS = 4

export interface PeriodWindow {
  period: ReportPeriod
  from: Date
  to: Date
  label: string
}

/** Computes occupancy rate (%) = occupied table-slots / available table-slots * 100. */
export function calculateOccupancyRate(
  occupiedTableSlots: number,
  availableTableSlots: number
): number {
  if (availableTableSlots <= 0 || occupiedTableSlots <= 0) return 0
  const pct = (occupiedTableSlots / availableTableSlots) * 100
  return Math.min(100, Number(pct.toFixed(1)))
}

/** Computes deposit cancellation rate (%) = cancelled reservations / total reservations * 100. */
export function calculateCancellationRate(
  cancelledCount: number,
  totalReservations: number
): number {
  if (totalReservations <= 0 || cancelledCount <= 0) return 0
  const pct = (cancelledCount / totalReservations) * 100
  return Math.min(100, Number(pct.toFixed(1)))
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/** Resolves inclusive [from, to] calendar window and Vietnamese label for period + offset. */
export function getReportPeriodWindow(
  period: ReportPeriod,
  offset = 0,
  anchor: Date = new Date()
): PeriodWindow {
  if (period === 'day') {
    const target = new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate() + offset
    )
    return {
      period,
      from: startOfLocalDay(target),
      to: endOfLocalDay(target),
      label: `Ngày ${pad2(target.getDate())}/${pad2(target.getMonth() + 1)}/${target.getFullYear()}`,
    }
  }

  if (period === 'week') {
    const dayIdx = (anchor.getDay() + 6) % 7
    const monday = new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      anchor.getDate() - dayIdx + offset * 7
    )
    const sunday = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 6
    )
    return {
      period,
      from: startOfLocalDay(monday),
      to: endOfLocalDay(sunday),
      label: `${pad2(monday.getDate())}/${pad2(monday.getMonth() + 1)} – ${pad2(sunday.getDate())}/${pad2(sunday.getMonth() + 1)}/${sunday.getFullYear()}`,
    }
  }

  if (period === 'month') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1)
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
    return {
      period,
      from: startOfLocalDay(first),
      to: endOfLocalDay(last),
      label: `Tháng ${pad2(first.getMonth() + 1)}/${first.getFullYear()}`,
    }
  }

  const baseQuarter = Math.floor(anchor.getMonth() / 3)
  const totalQuarters = anchor.getFullYear() * 4 + baseQuarter + offset
  const targetYear = Math.floor(totalQuarters / 4)
  const targetQuarter = ((totalQuarters % 4) + 4) % 4
  const firstMonth = targetQuarter * 3
  const first = new Date(targetYear, firstMonth, 1)
  const last = new Date(targetYear, firstMonth + 3, 0)
  return {
    period,
    from: startOfLocalDay(first),
    to: endOfLocalDay(last),
    label: `Quý ${targetQuarter + 1}/${targetYear}`,
  }
}

function inRange(iso: string, fromMs: number, toMs: number): boolean {
  const ts = Date.parse(iso)
  return !Number.isNaN(ts) && ts >= fromMs && ts <= toMs
}

function buildRevenueSeries(
  period: ReportPeriod,
  from: Date,
  to: Date,
  invoices: ReadonlyArray<InvoiceDto>
): RevenueSeriesPointDto[] {
  const buckets: { label: string; startMs: number; endMs: number }[] = []

  if (period === 'day') {
    for (let h = 10; h <= 22; h += 2) {
      const s = new Date(from.getFullYear(), from.getMonth(), from.getDate(), h, 0, 0, 0)
      const e = new Date(from.getFullYear(), from.getMonth(), from.getDate(), h + 1, 59, 59, 999)
      buckets.push({
        label: `${pad2(h)}h`,
        startMs: s.getTime(),
        endMs: e.getTime(),
      })
    }
  } else if (period === 'quarter') {
    for (let m = 0; m < 3; m++) {
      const s = new Date(from.getFullYear(), from.getMonth() + m, 1)
      const e = endOfLocalDay(new Date(s.getFullYear(), s.getMonth() + 1, 0))
      buckets.push({
        label: `T${s.getMonth() + 1}`,
        startMs: s.getTime(),
        endMs: e.getTime(),
      })
    }
  } else {
    const cursor = new Date(from)
    while (cursor.getTime() <= to.getTime()) {
      const s = startOfLocalDay(cursor)
      const e = endOfLocalDay(cursor)
      const label =
        period === 'week'
          ? `${pad2(cursor.getDate())}/${pad2(cursor.getMonth() + 1)}`
          : String(cursor.getDate())
      buckets.push({ label, startMs: s.getTime(), endMs: e.getTime() })
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return buckets.map((b) => {
    const matching = invoices.filter((inv) => {
      const ts = Date.parse(inv.createdAt)
      return ts >= b.startMs && ts <= b.endMs
    })
    return {
      label: b.label,
      revenue: matching.reduce((sum, inv) => sum + inv.totalAmount, 0),
      guests: matching.reduce((sum, inv) => sum + (inv.guestCount ?? 2), 0),
    }
  })
}

function aggregateFeedbackSummary(
  feedbacks: ReadonlyArray<FeedbackDto>
): ReportFeedbackSummaryDto {
  if (feedbacks.length === 0) {
    return { count: 0, avgFood: 0, avgAmbience: 0, avgService: 0 }
  }
  const totals = feedbacks.reduce(
    (acc, f) => ({
      food: acc.food + f.foodRating,
      ambience: acc.ambience + f.ambienceRating,
      service: acc.service + f.serviceRating,
    }),
    { food: 0, ambience: 0, service: 0 }
  )
  return {
    count: feedbacks.length,
    avgFood: Number((totals.food / feedbacks.length).toFixed(1)),
    avgAmbience: Number((totals.ambience / feedbacks.length).toFixed(1)),
    avgService: Number((totals.service / feedbacks.length).toFixed(1)),
  }
}

export interface ReportAggregateInput {
  period: ReportPeriod
  from: Date
  to: Date
  periodLabel: string
  zone?: TableZone
  tables: ReadonlyArray<TableDto>
  invoices: ReadonlyArray<InvoiceDto>
  orders: ReadonlyArray<OrderDto>
  reservations: ReadonlyArray<ReservationDto>
  feedbacks: ReadonlyArray<FeedbackDto>
  now?: Date
}

/** Pure domain aggregator computing KPIs, revenue chart series, top dishes, and zone stats. */
export function buildDashboardReportMetrics({
  period,
  from,
  to,
  periodLabel,
  zone,
  tables,
  invoices,
  orders,
  reservations,
  feedbacks,
  now = new Date(),
}: ReportAggregateInput): DashboardMetricsDto {
  const fromMs = from.getTime()
  const toMs = to.getTime()

  const tablesInScope = tables.filter(
    (t) => t.isActive && (!zone || t.zone === zone)
  )
  const tableIds = new Set(tablesInScope.map((t) => t.id))

  const paidInvoices = invoices.filter(
    (inv) =>
      inv.isPaid &&
      tableIds.has(inv.tableId) &&
      inRange(inv.createdAt, fromMs, toMs)
  )

  const orderIds = new Set(paidInvoices.map((inv) => inv.orderId))
  const totalRevenue = paidInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  )

  const reservationsInPeriod = reservations.filter(
    (r) =>
      (!zone || r.zone === zone) &&
      inRange(r.reservationTime, fromMs, toMs)
  )
  const cancelledReservations = reservationsInPeriod.filter(
    (r) =>
      r.status === 'Cancelled_Forfeited' ||
      r.status === 'Cancelled_Refunded' ||
      r.status === 'RefundRejected'
  )

  const includesNow = now.getTime() >= fromMs && now.getTime() <= toMs
  const activeTablesNow = includesNow
    ? tablesInScope.filter(
        (t) => t.status === 'Occupied' || t.status === 'PaymentPending'
      )
    : []

  const totalGuests =
    paidInvoices.reduce((sum, inv) => sum + (inv.guestCount ?? 2), 0) +
    activeTablesNow.reduce((sum, t) => sum + (t.guestCount ?? 0), 0)

  const daysInRange = Math.max(
    1,
    Math.ceil((toMs - fromMs + 1) / (24 * 60 * 60_000))
  )
  const effectiveDays = includesNow
    ? Math.max(
        1,
        Math.ceil((now.getTime() - fromMs + 1) / (24 * 60 * 60_000))
      )
    : daysInRange
  const availableSlots =
    tablesInScope.length * Math.min(daysInRange, effectiveDays) * DAILY_TABLE_SLOTS
  const occupiedSlots = paidInvoices.length + activeTablesNow.length
  const occupancyRate = calculateOccupancyRate(occupiedSlots, availableSlots)
  const cancellationRate = calculateCancellationRate(
    cancelledReservations.length,
    reservationsInPeriod.length
  )

  const itemTotals = new Map<string, BestSellerItemDto>()
  for (const order of orders) {
    if (!tableIds.has(order.tableId)) continue
    const matchesPeriod =
      orderIds.has(order.id) ||
      (includesNow && order.status === 'Active' && inRange(order.openedAt, fromMs, toMs))
    if (!matchesPeriod) continue
    for (const item of order.items) {
      if (item.status !== 'Served' && order.status !== 'Paid') continue
      const key = item.menuItemId ?? item.itemName
      const existing = itemTotals.get(key)
      if (existing) {
        existing.quantitySold += item.quantity
        existing.revenue += item.quantity * item.unitPrice
      } else {
        itemTotals.set(key, {
          menuItemId: key,
          name: item.itemName,
          quantitySold: item.quantity,
          revenue: item.quantity * item.unitPrice,
        })
      }
    }
  }

  const zones: TableZone[] = zone ? [zone] : ['MainHall', 'VIP', 'Balcony']
  const revenueByZone: ZoneRevenueDto[] = zones.map((z) => {
    const zTables = new Set(
      tables.filter((t) => t.isActive && t.zone === z).map((t) => t.id)
    )
    const zInvoices = paidInvoices.filter((inv) => zTables.has(inv.tableId))
    const zReservations = reservationsInPeriod.filter((r) => r.zone === z)
    return {
      zone: z,
      revenue: zInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      guestCount: zInvoices.reduce((sum, inv) => sum + (inv.guestCount ?? 2), 0),
      reservationCount: zReservations.length,
    }
  })

  const feedbacksInPeriod = feedbacks.filter((fb) =>
    inRange(fb.createdAt, fromMs, toMs)
  )

  const hasData =
    paidInvoices.length > 0 ||
    reservationsInPeriod.length > 0 ||
    activeTablesNow.length > 0

  return {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    periodLabel,
    hasData,
    totalRevenue,
    totalGuests,
    occupancyRate,
    cancellationRate,
    revenueSeries: buildRevenueSeries(period, from, to, paidInvoices),
    bestSellers: Array.from(itemTotals.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 8),
    revenueByZone,
    feedbackSummary: aggregateFeedbackSummary(feedbacksInPeriod),
  }
}
