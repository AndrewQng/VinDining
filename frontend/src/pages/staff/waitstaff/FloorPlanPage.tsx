import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TABLE_STATUS_LABELS, TABLE_ZONE_LABELS } from '@/domain'
import {
  Button,
  Card,
  Countdown,
  Modal,
  Skeleton,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { tableApi } from '@/services/api'
import type { TableDto, TableZone } from '@/types'
import { CheckInSheet } from './CheckInSheet'

const ZONES: TableZone[] = ['MainHall', 'VIP', 'Balcony']

/** W1 — Mobile waitstaff floor plan across zones with check-in, cleaning, and active order entry. */
export function FloorPlanPage() {
  useDocumentTitle('Sơ đồ bàn')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [zone, setZone] = useState<TableZone>('MainHall')
  const [checkInTable, setCheckInTable] = useState<TableDto | null>(null)
  const [cleaningTable, setCleaningTable] = useState<TableDto | null>(null)
  const [lockedTable, setLockedTable] = useState<TableDto | null>(null)

  const {
    data: tables = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAll(),
  })

  const markAvailableMutation = useMutation({
    mutationFn: (tableId: string) => tableApi.updateStatus(tableId, 'Available'),
    onSuccess: () => {
      setCleaningTable(null)
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })

  const zoneTables = tables.filter((t) => t.zone === zone)

  const handleTableTap = (table: TableDto) => {
    if (table.status === 'Available' || table.status === 'Reserved') {
      setCheckInTable(table)
      return
    }
    if (table.status === 'Occupied' || table.status === 'PaymentPending') {
      if (table.currentOrderId) {
        navigate(`/phuc-vu/order/${encodeURIComponent(table.id)}`)
      } else {
        navigate(`/phuc-vu/ban/${encodeURIComponent(table.id)}`)
      }
      return
    }
    if (table.status === 'Cleaning') {
      setCleaningTable(table)
      return
    }
    setLockedTable(table)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Sơ đồ bàn</h1>

      <Tabs
        value={zone}
        onChange={setZone}
        items={ZONES.map((z) => ({
          value: z,
          label: TABLE_ZONE_LABELS[z],
          badge: tables.filter((t) => t.zone === z).length,
        }))}
        className="w-full"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : isError ? (
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">Không thể tải sơ đồ bàn.</p>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {zoneTables.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => handleTableTap(table)}
              data-testid={`waitstaff-table-${table.tableNumber}`}
              className={cn(
                'min-h-[96px] rounded-xl border border-line bg-card p-3.5 text-left transition-colors',
                'hover:border-primary/60 hover:bg-card-hover active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-2'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-bold text-ink tabular-nums">
                  {table.tableNumber}
                </span>
                <span className="text-xs text-ink-muted tabular-nums">
                  {table.capacity} ghế
                </span>
              </div>

              <div className="space-y-1">
                <StatusBadge status={table.status} />
                {table.guestCount !== null &&
                  (table.status === 'Occupied' ||
                    table.status === 'PaymentPending' ||
                    table.status === 'Reserved') && (
                    <p className="text-[11px] text-ink-muted tabular-nums">
                      {table.guestCount} khách
                    </p>
                  )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Card padding="sm" className="text-[11px] text-ink-muted leading-relaxed">
        {TABLE_STATUS_LABELS.Available} · {TABLE_STATUS_LABELS.Locked} ·{' '}
        {TABLE_STATUS_LABELS.Reserved} · {TABLE_STATUS_LABELS.Occupied} ·{' '}
        {TABLE_STATUS_LABELS.PaymentPending} · {TABLE_STATUS_LABELS.Cleaning}
      </Card>

      <CheckInSheet
        table={checkInTable}
        onClose={() => setCheckInTable(null)}
        onCheckedIn={(tableId) => {
          setCheckInTable(null)
          navigate(`/phuc-vu/ban/${encodeURIComponent(tableId)}`)
        }}
      />

      <Modal
        open={Boolean(cleaningTable)}
        onClose={() => setCleaningTable(null)}
        title={`Bàn ${cleaningTable?.tableNumber ?? ''} đang dọn`}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onClick={() => setCleaningTable(null)}
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              className="min-h-[44px]"
              loading={markAvailableMutation.isPending}
              onClick={() =>
                cleaningTable && markAvailableMutation.mutate(cleaningTable.id)
              }
            >
              Đánh dấu Trống
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Xác nhận bàn {cleaningTable?.tableNumber} đã được dọn dẹp xong và sẵn
          sàng đón khách mới?
        </p>
      </Modal>

      <Modal
        open={Boolean(lockedTable)}
        onClose={() => setLockedTable(null)}
        title={`Bàn ${lockedTable?.tableNumber ?? ''} đang giữ chỗ`}
        size="sm"
        footer={
          <Button
            variant="primary"
            className="min-h-[44px] w-full"
            onClick={() => setLockedTable(null)}
          >
            Đóng
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-ink-muted">
          <p>
            Bàn đang được giữ chỗ tạm thời trong khi khách thanh toán tiền cọc.
          </p>
          {lockedTable?.holdExpiresAt && (
            <div className="flex items-center justify-between rounded-lg bg-card border border-line px-3 py-2">
              <span className="text-xs">Thời gian giữ còn lại</span>
              <Countdown targetIso={lockedTable.holdExpiresAt} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
