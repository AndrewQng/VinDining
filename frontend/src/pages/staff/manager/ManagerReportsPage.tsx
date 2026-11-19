import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SheetData } from 'write-excel-file/browser'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Printer,
  Star,
} from 'lucide-react'
import {
  TABLE_ZONE_LABELS,
  formatDateTime,
  formatVnd,
  getReportPeriodWindow,
} from '@/domain'
import { Button, Card, Money, Skeleton, Tabs } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { managerApi } from '@/services/api'
import type {
  DashboardMetricsDto,
  ReportPeriod,
  RevenueSeriesPointDto,
  TableZone,
} from '@/types'

const PERIOD_TABS: { value: ReportPeriod; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
]

/** M5 / M5x — Báo cáo doanh thu, lượt khách, tỷ lệ lấp đầy, hủy cọc, đánh giá và xuất Excel/PDF. */
export function ManagerReportsPage() {
  useDocumentTitle('Báo cáo doanh thu & vận hành')
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [offset, setOffset] = useState(0)
  const [zone, setZone] = useState<'ALL' | TableZone>('ALL')
  const [exportingExcel, setExportingExcel] = useState(false)

  const windowInfo = useMemo(
    () => getReportPeriodWindow(period, offset),
    [period, offset]
  )

  const reportQuery = useQuery({
    queryKey: [
      'manager',
      'reports',
      period,
      offset,
      zone,
    ],
    queryFn: () =>
      managerApi.getDashboardReport({
        period,
        from: windowInfo.from.toISOString(),
        to: windowInfo.to.toISOString(),
        label: windowInfo.label,
        zone: zone === 'ALL' ? undefined : zone,
      }),
  })

  const feedbacksQuery = useQuery({
    queryKey: ['manager', 'feedbacks'],
    queryFn: managerApi.getFeedbacks,
  })

  const report = reportQuery.data

  const handleExportExcel = async () => {
    if (!report) return
    setExportingExcel(true)
    try {
      const [meta, mod] = await Promise.all([
        managerApi.exportReportMeta({
          period,
          from: windowInfo.from.toISOString(),
          to: windowInfo.to.toISOString(),
          zone: zone === 'ALL' ? undefined : zone,
          format: 'excel',
        }),
        import('write-excel-file/browser'),
      ])
      const writeXlsxFile = mod.default
      const sheetData = buildExcelRows(report, zone)
      await writeXlsxFile(sheetData, { sheet: 'Báo cáo' }).toFile(
        meta.fileName
      )
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    await managerApi.exportReportMeta({
      period,
      from: windowInfo.from.toISOString(),
      to: windowInfo.to.toISOString(),
      zone: zone === 'ALL' ? undefined : zone,
      format: 'pdf',
    })
    window.print()
  }

  return (
    <div className="print-report-area space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Báo cáo doanh thu & vận hành
          </h1>
          <p className="print-muted mt-1 text-sm text-ink-muted">
            Kỳ báo cáo: <strong className="text-ink">{windowInfo.label}</strong> ·{' '}
            {zone === 'ALL' ? 'Tất cả khu vực' : TABLE_ZONE_LABELS[zone]}
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={exportingExcel}
            disabled={!report}
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => void handleExportExcel()}
          >
            Xuất Excel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!report}
            icon={<Printer className="w-4 h-4" />}
            onClick={() => void handleExportPdf()}
          >
            Xuất PDF
          </Button>
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={period}
          onChange={(next) => {
            setPeriod(next)
            setOffset(0)
          }}
          items={PERIOD_TABS}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center rounded-lg border border-line bg-card">
            <button
              type="button"
              aria-label="Kỳ trước"
              onClick={() => setOffset((o) => o - 1)}
              className="px-2.5 py-2 text-ink-muted hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              data-testid="report-period-label"
              className="px-3 text-xs font-semibold text-ink tabular-nums"
            >
              {windowInfo.label}
            </span>
            <button
              type="button"
              aria-label="Kỳ sau"
              onClick={() => setOffset((o) => o + 1)}
              className="px-2.5 py-2 text-ink-muted hover:text-ink cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            aria-label="Lọc theo khu vực"
            value={zone}
            onChange={(e) => setZone(e.target.value as 'ALL' | TableZone)}
            className="h-9 rounded-lg border border-line bg-card px-3 text-sm text-ink"
          >
            <option value="ALL">Khu vực: Tất cả khu vực</option>
            <option value="MainHall">Sảnh chính</option>
            <option value="VIP">VIP</option>
            <option value="Balcony">Ban công</option>
          </select>
        </div>
      </div>

      {reportQuery.isLoading || !report ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="print-card space-y-1">
              <p className="print-muted text-xs text-ink-muted">Tổng doanh thu</p>
              <p
                data-testid="kpi-total-revenue"
                className="font-serif text-2xl font-bold text-accent tabular-nums"
              >
                <Money amount={report.totalRevenue} />
              </p>
            </Card>
            <Card className="print-card space-y-1">
              <p className="print-muted text-xs text-ink-muted">Số lượt khách</p>
              <p
                data-testid="kpi-total-guests"
                className="font-serif text-2xl font-bold text-ink tabular-nums"
              >
                {report.totalGuests} lượt
              </p>
            </Card>
            <Card className="print-card space-y-1">
              <p className="print-muted text-xs text-ink-muted">Tỷ lệ lấp đầy bàn</p>
              <p
                data-testid="kpi-occupancy-rate"
                className="font-serif text-2xl font-bold text-success tabular-nums"
              >
                {report.occupancyRate}%
              </p>
            </Card>
            <Card className="print-card space-y-1">
              <p className="print-muted text-xs text-ink-muted">Tỷ lệ hủy cọc</p>
              <p
                data-testid="kpi-cancellation-rate"
                className="font-serif text-2xl font-bold text-danger tabular-nums"
              >
                {report.cancellationRate}%
              </p>
            </Card>
          </div>

          {!report.hasData ? (
            <Card
              data-testid="m5x-empty-report"
              className="print-card py-12 text-center space-y-2"
            >
              <Download className="mx-auto h-8 w-8 text-ink-subtle" />
              <p className="text-base font-semibold text-ink">
                Không có số liệu trong khoảng thời gian này
              </p>
              <p className="text-xs text-ink-muted">
                Chuyển về kỳ trước hoặc chọn khu vực khác để xem thống kê doanh
                thu và món bán chạy.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] items-start">
                <Card className="print-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-ink">
                      Doanh thu theo thời gian ({report.periodLabel})
                    </h2>
                    <span className="print-muted text-xs text-ink-muted">
                      Đơn vị: VNĐ
                    </span>
                  </div>
                  <RevenueBarChart series={report.revenueSeries} />
                </Card>

                <Card className="print-card space-y-4">
                  <h2 className="text-sm font-semibold text-ink">
                    Món bán chạy nhất
                  </h2>
                  {report.bestSellers.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      Chưa có món phục vụ trong kỳ.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {report.bestSellers.slice(0, 5).map((dish, idx) => (
                        <div
                          key={dish.menuItemId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent tabular-nums">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink truncate">
                                {dish.name}
                              </p>
                              <p className="print-muted text-xs text-ink-muted tabular-nums">
                                {dish.quantitySold} phần
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 font-semibold text-accent tabular-nums">
                            {formatVnd(dish.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 items-start">
                <Card className="print-card space-y-4">
                  <h2 className="text-sm font-semibold text-ink">
                    Phân bổ theo khu vực
                  </h2>
                  <ZoneRevenueSvgChart zones={report.revenueByZone} />
                </Card>

                <Card data-testid="m5-feedback-card" className="print-card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-ink">
                      Chất lượng dịch vụ & đánh giá khách hàng
                    </h2>
                    <span className="print-muted text-xs text-ink-muted">
                      {feedbacksQuery.data?.length ?? 0} phản hồi
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-line bg-card p-3">
                      <p className="print-muted text-xs text-ink-muted">Món ăn</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-bold text-accent tabular-nums">
                        <Star className="w-4 h-4 fill-current" />
                        {computeAverageRating(feedbacksQuery.data ?? [], 'foodRating')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-card p-3">
                      <p className="print-muted text-xs text-ink-muted">Không gian</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-bold text-accent tabular-nums">
                        <Star className="w-4 h-4 fill-current" />
                        {computeAverageRating(
                          feedbacksQuery.data ?? [],
                          'ambienceRating'
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-card p-3">
                      <p className="print-muted text-xs text-ink-muted">Phục vụ</p>
                      <p className="mt-1 inline-flex items-center gap-1 font-bold text-accent tabular-nums">
                        <Star className="w-4 h-4 fill-current" />
                        {computeAverageRating(
                          feedbacksQuery.data ?? [],
                          'serviceRating'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(feedbacksQuery.data ?? []).slice(0, 4).map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-ink">
                            Bàn {fb.tableNumber ?? '—'}
                          </span>
                          <span className="print-muted text-ink-muted tabular-nums">
                            {formatDateTime(fb.createdAt)}
                          </span>
                        </div>
                        {fb.comment && (
                          <p className="text-ink-muted">{fb.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function computeAverageRating(
  list: ReadonlyArray<{
    foodRating: number
    ambienceRating: number
    serviceRating: number
  }>,
  key: 'foodRating' | 'ambienceRating' | 'serviceRating'
): string {
  if (list.length === 0) return '—'
  const total = list.reduce((sum, item) => sum + item[key], 0)
  return (total / list.length).toFixed(1)
}

function RevenueBarChart({ series }: { series: RevenueSeriesPointDto[] }) {
  const maxVal = Math.max(1, ...series.map((s) => s.revenue))
  const width = 640
  const height = 220
  const padX = 20
  const chartBottom = 188
  const barAreaW = width - padX * 2
  const slotW = barAreaW / Math.max(1, series.length)
  const barW = Math.min(26, Math.max(6, slotW * 0.6))
  const labelStride = series.length > 16 ? 3 : series.length > 10 ? 2 : 1

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label="Biểu đồ doanh thu theo thời gian"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[460px] h-56"
      >
        <title>Biểu đồ doanh thu theo thời gian</title>
        <line
          x1={padX}
          y1={chartBottom}
          x2={width - padX}
          y2={chartBottom}
          stroke="var(--line)"
          strokeWidth={1}
        />
        {series.map((point, idx) => {
          const barH =
            point.revenue > 0
              ? Math.max(6, Math.round((point.revenue / maxVal) * 150))
              : 2
          const x = padX + idx * slotW + (slotW - barW) / 2
          const y = chartBottom - barH
          return (
            <g key={point.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={point.revenue > 0 ? 'var(--accent)' : 'var(--line)'}
                opacity={point.revenue > 0 ? 0.92 : 0.4}
              >
                <title>
                  {point.label}: {formatVnd(point.revenue)} ({point.guests} khách)
                </title>
              </rect>
              {idx % labelStride === 0 && (
                <text
                  x={x + barW / 2}
                  y={208}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--ink-muted)"
                >
                  {point.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ZoneRevenueSvgChart({
  zones,
}: {
  zones: DashboardMetricsDto['revenueByZone']
}) {
  const maxVal = Math.max(1, ...zones.map((z) => z.revenue))

  return (
    <svg
      role="img"
      aria-label="Biểu đồ doanh thu theo khu vực"
      viewBox="0 0 460 156"
      className="w-full h-40"
    >
      <title>Doanh thu theo khu vực</title>
      {zones.map((row, idx) => {
        const y = 16 + idx * 44
        const barW =
          row.revenue > 0
            ? Math.max(12, Math.round((row.revenue / maxVal) * 230))
            : 4
        return (
          <g key={row.zone}>
            <text
              x={4}
              y={y + 18}
              fontSize={12}
              fontWeight="600"
              fill="var(--ink)"
            >
              {TABLE_ZONE_LABELS[row.zone]}
            </text>
            <rect
              x={105}
              y={y + 4}
              width={230}
              height={20}
              rx={6}
              fill="var(--line)"
              opacity={0.35}
            />
            <rect
              x={105}
              y={y + 4}
              width={barW}
              height={20}
              rx={6}
              fill="var(--primary)"
            >
              <title>
                {TABLE_ZONE_LABELS[row.zone]}: {formatVnd(row.revenue)}
              </title>
            </rect>
            <text
              x={456}
              y={y + 18}
              textAnchor="end"
              fontSize={11}
              fontWeight="600"
              fill="var(--ink-muted)"
            >
              {formatVnd(row.revenue)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function buildExcelRows(
  report: DashboardMetricsDto,
  zone: 'ALL' | TableZone
): SheetData {
  return [
    [
      {
        value: 'BÁO CÁO DOANH THU & VẬN HÀNH VINDINING',
        fontWeight: 'bold',
      },
    ],
    [
      { value: 'Kỳ báo cáo' },
      { value: report.periodLabel },
      { value: 'Khu vực' },
      { value: zone === 'ALL' ? 'Tất cả khu vực' : TABLE_ZONE_LABELS[zone] },
    ],
    [],
    [
      { value: 'Chỉ số KPI', fontWeight: 'bold' },
      { value: 'Giá trị', fontWeight: 'bold' },
    ],
    [{ value: 'Tổng doanh thu (VNĐ)' }, { value: report.totalRevenue, type: Number }],
    [{ value: 'Số lượt khách' }, { value: report.totalGuests, type: Number }],
    [{ value: 'Tỷ lệ lấp đầy bàn (%)' }, { value: report.occupancyRate, type: Number }],
    [{ value: 'Tỷ lệ hủy cọc (%)' }, { value: report.cancellationRate, type: Number }],
    [],
    [
      { value: 'Món ăn bán chạy', fontWeight: 'bold' },
      { value: 'Số lượng', fontWeight: 'bold' },
      { value: 'Doanh thu (VNĐ)', fontWeight: 'bold' },
    ],
    ...report.bestSellers.map((b) => [
      { value: b.name },
      { value: b.quantitySold, type: Number },
      { value: b.revenue, type: Number },
    ]),
    [],
    [
      { value: 'Khu vực', fontWeight: 'bold' },
      { value: 'Doanh thu (VNĐ)', fontWeight: 'bold' },
      { value: 'Lượt khách', fontWeight: 'bold' },
      { value: 'Số đặt bàn', fontWeight: 'bold' },
    ],
    ...report.revenueByZone.map((z) => [
      { value: TABLE_ZONE_LABELS[z.zone] },
      { value: z.revenue, type: Number },
      { value: z.guestCount, type: Number },
      { value: z.reservationCount, type: Number },
    ]),
  ]
}
