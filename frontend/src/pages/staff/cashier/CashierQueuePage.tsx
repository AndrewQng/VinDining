import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Bell, Volume2, VolumeX } from 'lucide-react'
import {
  TABLE_ZONE_LABELS,
  formatRelativeMinutes,
  formatSlotTime,
} from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Money,
  Skeleton,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import {
  isCashierBellMuted,
  playCheckoutBell,
  setCashierBellMuted,
} from '@/lib/bellSound'
import { cn } from '@/lib/utils'
import { invoiceApi, tableApi } from '@/services/api'
import { useRealtime } from '@/services/realtime/useRealtime'
import type { InvoicePreviewDto, TableDto } from '@/types'

type QueueTab = 'pending' | 'occupied'

function sortNewestCheckoutFirst(tables: TableDto[]): TableDto[] {
  return [...tables].sort((a, b) => {
    const tA = a.checkoutRequestedAt ? Date.parse(a.checkoutRequestedAt) : 0
    const tB = b.checkoutRequestedAt ? Date.parse(b.checkoutRequestedAt) : 0
    if (tB !== tA) return tB - tA
    return a.tableNumber.localeCompare(b.tableNumber)
  })
}

/** C1 — Hàng chờ thanh toán: live queue of PaymentPending & Occupied tables with chime & highlight. */
export function CashierQueuePage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<QueueTab>('pending')
  const [muted, setMuted] = useState<boolean>(() => isCashierBellMuted())
  const [highlightedIds, setHighlightedIds] = useState<Record<string, boolean>>(
    {}
  )
  const [latestRequest, setLatestRequest] = useState<{
    tableId: string
    tableNumber: string
    receivedAt: string
  } | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const tablesQuery = useQuery({
    queryKey: ['tables'],
    queryFn: tableApi.getAll,
  })

  useRealtime('checkout:requested', (payload) => {
    playCheckoutBell(muted)
    setHighlightedIds((prev) => ({ ...prev, [payload.tableId]: true }))
    setLatestRequest({
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
      receivedAt: new Date().toISOString(),
    })
    void queryClient.invalidateQueries({ queryKey: ['tables'] })
    void queryClient.invalidateQueries({
      queryKey: ['invoices', 'preview', payload.tableId],
    })
  })

  useRealtime('invoice:settled', (payload) => {
    setHighlightedIds((prev) => {
      if (!prev[payload.tableId]) return prev
      const next = { ...prev }
      delete next[payload.tableId]
      return next
    })
    setLatestRequest((prev) =>
      prev?.tableId === payload.tableId ? null : prev
    )
    void queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  useRealtime('table:status-changed', () => {
    void queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  useRealtime('item:served', (payload) => {
    void queryClient.invalidateQueries({
      queryKey: ['invoices', 'preview', payload.tableId],
    })
  })

  const pendingTables = useMemo(
    () =>
      sortNewestCheckoutFirst(
        (tablesQuery.data ?? []).filter((t) => t.status === 'PaymentPending')
      ),
    [tablesQuery.data]
  )

  const occupiedTables = useMemo(
    () =>
      [...(tablesQuery.data ?? [])]
        .filter((t) => t.status === 'Occupied')
        .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)),
    [tablesQuery.data]
  )

  const activeList = tab === 'pending' ? pendingTables : occupiedTables
  const previewTargets = useMemo(
    () => activeList.filter((t) => Boolean(t.currentOrderId)),
    [activeList]
  )

  const previewQueries = useQueries({
    queries: previewTargets.map((table) => ({
      queryKey: ['invoices', 'preview', table.id],
      queryFn: () => invoiceApi.getPreview(table.id),
      staleTime: 10_000,
    })),
  })

  const previewMap = useMemo(() => {
    const map = new Map<string, InvoicePreviewDto>()
    previewTargets.forEach((table, idx) => {
      const data = previewQueries[idx]?.data
      if (data) map.set(table.id, data)
    })
    return map
  }, [previewTargets, previewQueries])

  const bannerTable = useMemo(() => {
    if (latestRequest) {
      return (
        pendingTables.find((t) => t.id === latestRequest.tableId) ??
        (tablesQuery.data ?? []).find((t) => t.id === latestRequest.tableId) ??
        null
      )
    }
    return pendingTables[0] ?? null
  }, [latestRequest, pendingTables, tablesQuery.data])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setCashierBellMuted(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Hàng chờ thanh toán
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {pendingTables.length} bàn đang yêu cầu tính tiền ·{' '}
            {occupiedTables.length} bàn đang phục vụ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleMute}
            aria-pressed={muted}
            icon={
              muted ? (
                <VolumeX className="w-4 h-4 text-ink-muted" />
              ) : (
                <Volume2 className="w-4 h-4 text-accent" />
              )
            }
          >
            {muted ? 'Chuông báo: Tắt' : 'Chuông báo: Bật'}
          </Button>
        </div>
      </div>

      {bannerTable && (
        <div
          role="status"
          data-testid="checkout-alert-banner"
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3',
            latestRequest || highlightedIds[bannerTable.id]
              ? 'border-accent bg-accent/15'
              : 'border-accent/40 bg-accent/10'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 shrink-0 text-accent" />
            <span className="text-sm font-semibold text-accent">
              {latestRequest && latestRequest.tableId === bannerTable.id
                ? `Bàn ${bannerTable.tableNumber} vừa yêu cầu tính tiền`
                : `Bàn ${bannerTable.tableNumber} đang chờ thanh toán`}
            </span>
          </div>
          <p className="text-xs text-ink-muted tabular-nums">
            Phục vụ: {bannerTable.assignedStaffName ?? 'Chưa phân công'} · Yêu
            cầu lúc{' '}
            {bannerTable.checkoutRequestedAt
              ? `${formatSlotTime(bannerTable.checkoutRequestedAt)} (${formatRelativeMinutes(
                  bannerTable.checkoutRequestedAt,
                  new Date(nowMs)
                )})`
              : formatSlotTime(new Date(nowMs))}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            {
              value: 'pending',
              label: `Chờ thanh toán (${pendingTables.length})`,
            },
            {
              value: 'occupied',
              label: `Đang phục vụ (${occupiedTables.length})`,
            },
          ]}
        />
      </div>

      {tablesQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : activeList.length === 0 ? (
        <EmptyState
          title={
            tab === 'pending'
              ? 'Chưa có bàn nào chờ thanh toán'
              : 'Không có bàn nào đang phục vụ'
          }
          description={
            tab === 'pending'
              ? 'Khi phục vụ bấm Yêu cầu tính tiền, bàn sẽ xuất hiện tại đây theo thời gian thực.'
              : 'Khách check-in hoặc nhận khách vãng lai tại quầy để mở bàn mới.'
          }
          action={
            <Link to="/thu-ngan/check-in">
              <Button variant="secondary" size="sm">
                Đi tới Check-in khách
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-card/70 text-xs font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Bàn</th>
                  <th className="px-4 py-3">Số khách</th>
                  <th className="px-4 py-3">Phục vụ phụ trách</th>
                  <th className="px-4 py-3">
                    {tab === 'pending' ? 'Thời gian yêu cầu' : 'Khu vực'}
                  </th>
                  <th className="px-4 py-3 text-right">Còn phải thanh toán</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {activeList.map((table) => {
                  const preview = previewMap.get(table.id)
                  const isHighlighted = Boolean(highlightedIds[table.id])
                  const requestTime = table.checkoutRequestedAt
                  return (
                    <tr
                      key={table.id}
                      data-testid={`queue-row-${table.tableNumber}`}
                      className={cn(
                        'transition-colors hover:bg-card-hover',
                        isHighlighted && 'bg-accent/10 ring-1 ring-inset ring-accent/50'
                      )}
                    >
                      <td className="px-4 py-3.5 font-semibold text-ink">
                        <span>Bàn {table.tableNumber}</span>
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted tabular-nums">
                        {table.guestCount ?? preview?.guestCount ?? '—'} khách
                      </td>
                      <td className="px-4 py-3.5 text-ink">
                        {table.assignedStaffName ?? 'Chưa phân công'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-muted tabular-nums">
                        {tab === 'pending' ? (
                          requestTime ? (
                            <span className={cn(isHighlighted && 'font-semibold text-accent')}>
                              {formatSlotTime(requestTime)} (
                              {formatRelativeMinutes(
                                requestTime,
                                new Date(nowMs)
                              )}
                              )
                            </span>
                          ) : (
                            'Vừa yêu cầu'
                          )
                        ) : (
                          TABLE_ZONE_LABELS[table.zone]
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                        {preview ? (
                          <Money amount={preview.amountDue} />
                        ) : table.currentOrderId ? (
                          <span className="text-xs text-ink-muted">Đang tính...</span>
                        ) : (
                          <span className="text-xs text-ink-muted">Chưa gọi món</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={table.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {table.currentOrderId ? (
                          <Link to={`/thu-ngan/tam-tinh/${table.id}`}>
                            <Button
                              variant={tab === 'pending' ? 'primary' : 'secondary'}
                              size="sm"
                              icon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Xem tạm tính
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-ink-muted">
                            Chưa có đơn
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
