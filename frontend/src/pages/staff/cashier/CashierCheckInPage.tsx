import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { CheckCircle2, Search } from 'lucide-react'
import { TABLE_ZONE_LABELS } from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Skeleton,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import {
  ReservedCheckInPanel,
  WalkInCheckInPanel,
} from '@/pages/staff/waitstaff/CheckInSheet'
import { reservationApi, tableApi } from '@/services/api'
import { useRealtime } from '@/services/realtime/useRealtime'
import type { ApiErrorResponse, ReservationDto, TableDto } from '@/types'

type CheckInMode = 'reserved' | 'walkin'

/** C4 / C4b — Check-in khách đặt trước (mã / SĐT) hoặc khách vãng lai tại quầy Thu ngân. */
export function CashierCheckInPage() {
  useDocumentTitle('Check-in khách')
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<CheckInMode>('reserved')
  const [searchInput, setSearchInput] = useState('')
  const [matchedReservation, setMatchedReservation] =
    useState<ReservationDto | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [guestCount, setGuestCount] = useState(2)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [checkedInSummary, setCheckedInSummary] = useState<{
    tableNumber: string
    mode: CheckInMode
    guestCount: number
    hasSetMenu: boolean
  } | null>(null)

  const tablesQuery = useQuery({
    queryKey: ['tables'],
    queryFn: tableApi.getAll,
  })

  useRealtime('table:status-changed', () => {
    void queryClient.invalidateQueries({ queryKey: ['tables'] })
  })

  const reservedTables = useMemo(
    () => (tablesQuery.data ?? []).filter((t) => t.status === 'Reserved'),
    [tablesQuery.data]
  )
  const availableTables = useMemo(
    () => (tablesQuery.data ?? []).filter((t) => t.status === 'Available'),
    [tablesQuery.data]
  )

  const selectedTable: TableDto | null = useMemo(() => {
    if (mode === 'reserved') {
      if (matchedReservation) {
        return (
          (tablesQuery.data ?? []).find(
            (t) => t.id === matchedReservation.tableId
          ) ?? null
        )
      }
      return (
        reservedTables.find((t) => t.id === selectedTableId) ??
        reservedTables[0] ??
        null
      )
    }
    return (
      availableTables.find((t) => t.id === selectedTableId) ??
      availableTables[0] ??
      null
    )
  }, [
    mode,
    matchedReservation,
    tablesQuery.data,
    reservedTables,
    availableTables,
    selectedTableId,
  ])

  useEffect(() => {
    if (!selectedTable) return
    setGuestCount((prev) =>
      Math.min(Math.max(prev, 1), selectedTable.capacity)
    )
  }, [selectedTable])

  const searchMutation = useMutation({
    mutationFn: async (term: string) => {
      const cleaned = term.trim()
      if (!cleaned) {
        throw new Error('Vui lòng nhập mã đặt bàn hoặc số điện thoại')
      }
      const list = await reservationApi.search({
        status: 'Reserved',
        search: cleaned,
      })
      const preferred = list[0] ?? null
      if (!preferred) {
        throw new Error(
          'Không tìm thấy đơn đặt bàn phù hợp ở trạng thái Đã đặt'
        )
      }
      return preferred
    },
    onSuccess: (found) => {
      setLookupError(null)
      setSubmitError(null)
      setMatchedReservation(found)
      setSelectedTableId(found.tableId)
      setCheckedInSummary(null)
    },
    onError: (err) => {
      setMatchedReservation(null)
      setLookupError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể tra cứu đặt bàn lúc này')
          : (err as Error).message
      )
    },
  })

  const checkInMutation = useMutation({
    mutationFn: (payload: { tableId: string; code: string }) =>
      tableApi.checkIn(payload.tableId, { reservationCode: payload.code }),
    onSuccess: (res) => {
      setSubmitError(null)
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      setCheckedInSummary({
        tableNumber: res.table.tableNumber,
        mode: 'reserved',
        guestCount: res.table.guestCount ?? matchedReservation?.partySize ?? 2,
        hasSetMenu: Boolean(res.order),
      })
      setMatchedReservation(null)
      setSearchInput('')
    },
    onError: (err) => {
      setSubmitError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể check-in cho bàn này')
          : 'Không thể kết nối hệ thống'
      )
    },
  })

  const walkInMutation = useMutation({
    mutationFn: (tableId: string) =>
      tableApi.walkIn(tableId, { guestCount }),
    onSuccess: (table) => {
      setSubmitError(null)
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      setCheckedInSummary({
        tableNumber: table.tableNumber,
        mode: 'walkin',
        guestCount: table.guestCount ?? guestCount,
        hasSetMenu: false,
      })
    },
    onError: (err) => {
      setSubmitError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể nhận khách vãng lai')
          : 'Không thể kết nối hệ thống'
      )
    },
  })

  const handleSelectReservedTable = async (table: TableDto) => {
    setSelectedTableId(table.id)
    setSubmitError(null)
    setLookupError(null)
    setCheckedInSummary(null)
    if (table.currentReservationCode) {
      setSearchInput(table.currentReservationCode)
      searchMutation.mutate(table.currentReservationCode)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Check-in khách
          </h1>
        </div>

        <Tabs
          value={mode}
          onChange={(next) => {
            setMode(next)
            setSubmitError(null)
            setLookupError(null)
            setCheckedInSummary(null)
          }}
          items={[
            { value: 'reserved', label: 'Khách đặt trước' },
            { value: 'walkin', label: 'Khách vãng lai' },
          ]}
        />
      </div>

      {checkedInSummary && (
        <div
          role="status"
          data-testid="cashier-checkin-success"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Đã check-in Bàn {checkedInSummary.tableNumber} (
                {checkedInSummary.guestCount} khách)
              </p>
              <p className="text-xs text-ink-muted">
                {checkedInSummary.hasSetMenu
                  ? 'Bàn chuyển sang Đang phục vụ và đơn Set Menu đã tự động mở (Món Khai vị đã gửi Bếp).'
                  : 'Bàn chuyển sang Đang phục vụ để phục vụ tiếp nhận gọi món.'}
              </p>
            </div>
          </div>
          <Link to="/thu-ngan">
            <Button variant="secondary" size="sm">
              Về hàng chờ thanh toán
            </Button>
          </Link>
        </div>
      )}

      {tablesQuery.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
          <Card className="space-y-4">
            {mode === 'reserved' ? (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Tra cứu đặt bàn
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Nhập mã đặt bàn (ví dụ VD-7K3Q) hoặc số điện thoại của
                    khách.
                  </p>
                </div>

                <form
                  className="flex items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    searchMutation.mutate(searchInput)
                  }}
                >
                  <div className="flex-1">
                    <Input
                      label="Mã đặt bàn hoặc số điện thoại"
                      placeholder="VD-7K3Q hoặc 0901 234 567"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="min-h-[44px]"
                    icon={<Search className="w-4 h-4" />}
                    loading={searchMutation.isPending}
                  >
                    Tìm
                  </Button>
                </form>

                {selectedTable ? (
                  <ReservedCheckInPanel
                    hideSearch
                    table={selectedTable}
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                    onSearch={() => searchMutation.mutate(searchInput)}
                    isSearching={searchMutation.isPending}
                    lookupError={lookupError}
                    matchedReservation={matchedReservation}
                    submitError={submitError}
                    isSubmitting={checkInMutation.isPending}
                    onConfirm={() => {
                      const code =
                        matchedReservation?.bookingCode ?? searchInput.trim()
                      if (code) {
                        checkInMutation.mutate({
                          tableId: selectedTable.id,
                          code,
                        })
                      }
                    }}
                  />
                ) : (
                  <EmptyState
                    title="Chưa chọn bàn đặt trước"
                    description="Tra cứu bằng mã đặt bàn / số điện thoại hoặc chọn một bàn Đã đặt ở danh sách bên phải."
                  />
                )}
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Nhận khách vãng lai
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Chọn một bàn Trống ở danh sách bên phải và xác nhận số
                    lượng khách.
                  </p>
                </div>

                {selectedTable ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
                      <span className="font-semibold text-ink">
                        Bàn {selectedTable.tableNumber}
                      </span>{' '}
                      <span className="text-ink-muted">
                        · {selectedTable.capacity} ghế ·{' '}
                        {TABLE_ZONE_LABELS[selectedTable.zone]}
                      </span>
                    </div>
                    <WalkInCheckInPanel
                      table={selectedTable}
                      guestCount={guestCount}
                      onGuestCountChange={setGuestCount}
                      submitError={submitError}
                      isSubmitting={walkInMutation.isPending}
                      onConfirm={() => walkInMutation.mutate(selectedTable.id)}
                    />
                  </div>
                ) : (
                  <EmptyState
                    title="Không còn bàn trống"
                    description="Hiện tại tất cả bàn đều đang có khách hoặc đang được giữ."
                  />
                )}
              </>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">
              {mode === 'reserved'
                ? `Bàn đang đặt trước (${reservedTables.length})`
                : `Bàn trống khả dụng (${availableTables.length})`}
            </h2>

            {(mode === 'reserved' ? reservedTables : availableTables).length ===
            0 ? (
              <p className="text-xs text-ink-muted">
                {mode === 'reserved'
                  ? 'Không có bàn nào đang ở trạng thái Đã đặt.'
                  : 'Không còn bàn trống nào.'}
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {(mode === 'reserved' ? reservedTables : availableTables).map(
                  (table) => {
                    const isSelected = selectedTable?.id === table.id
                    return (
                      <button
                        key={table.id}
                        type="button"
                        data-testid={`checkin-table-${table.tableNumber}`}
                        onClick={() => {
                          if (mode === 'reserved') {
                            void handleSelectReservedTable(table)
                          } else {
                            setSelectedTableId(table.id)
                            setSubmitError(null)
                            setCheckedInSummary(null)
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left transition-colors',
                          isSelected
                            ? 'border-accent bg-accent/15'
                            : 'border-line bg-card hover:border-accent/50'
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            Bàn {table.tableNumber}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {table.capacity} ghế ·{' '}
                            {TABLE_ZONE_LABELS[table.zone]}
                          </p>
                          {table.currentReservationCode && (
                            <p className="mt-0.5 text-[11px] font-mono text-accent">
                              {table.currentReservationCode}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={table.status} />
                      </button>
                    )
                  }
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
