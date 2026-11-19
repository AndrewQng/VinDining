import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { TABLE_ZONE_LABELS, formatVnd, isOrderLockedForTable } from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  StatusBadge,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { tableApi } from '@/services/api'
import type { ApiErrorResponse, TableDto } from '@/types'

/** W7, W7b, W7x — Transfer an Occupied table (and its order + deposit) to a free destination table. */
export function TransferTablePage() {
  useDocumentTitle('Đổi bàn phục vụ')
  const { tableId = '' } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedTarget, setSelectedTarget] = useState<TableDto | null>(null)
  const [transferredTo, setTransferredTo] = useState<TableDto | null>(null)
  const [conflictTableNumber, setConflictTableNumber] = useState<string | null>(
    null
  )
  const [otherError, setConflictOrError] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tableApi.getById(tableId),
    enabled: Boolean(tableId),
  })

  const tablesQuery = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAll(),
  })

  const transferMutation = useMutation({
    mutationFn: (targetId: string) =>
      tableApi.transfer(tableId, { targetTableId: targetId }),
    onSuccess: (res) => {
      setConflictTableNumber(null)
      setConflictOrError(null)
      setTransferredTo(res.targetTable)
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      void queryClient.invalidateQueries({ queryKey: ['table', tableId] })
      void queryClient.invalidateQueries({
        queryKey: ['table', res.targetTable.id],
      })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      if (isAxiosError<ApiErrorResponse>(err)) {
        const msg = err.response?.data?.message ?? ''
        if (err.response?.status === 409 && msg.includes('không còn trống')) {
          setConflictTableNumber(selectedTarget?.tableNumber ?? '')
          return
        }
        setConflictOrError(msg || 'Không thể chuyển bàn lúc này')
      } else {
        setConflictOrError('Không thể kết nối hệ thống')
      }
    },
  })

  if (detailQuery.isLoading || tablesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data?.table) {
    return (
      <div className="space-y-4">
        <PageHeader title="Đổi bàn phục vụ" backTo="/phuc-vu" />
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">Không thể tải thông tin bàn.</p>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => detailQuery.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  const { table: sourceTable, activeReservation } = detailQuery.data
  const guestCount =
    sourceTable.guestCount ?? activeReservation?.partySize ?? 1
  const paidDeposit =
    activeReservation?.deposit?.status === 'Paid'
      ? activeReservation.deposit.amount
      : 0

  if (transferredTo) {
    return (
      <div className="space-y-4">
        <PageHeader title="Đổi bàn thành công" backTo="/phuc-vu" />
        <Card className="space-y-4 text-center py-8">
          <CheckCircle2
            className="w-12 h-12 text-success mx-auto"
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold text-ink">
            Đã chuyển sang Bàn {transferredTo.tableNumber}
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Đã chuyển toàn bộ order
            {paidDeposit > 0 ? ` và tiền cọc (${formatVnd(paidDeposit)})` : ''}{' '}
            sang Bàn {transferredTo.tableNumber}. Bàn {sourceTable.tableNumber}{' '}
            đã chuyển trạng thái sang Đang dọn.
          </p>
          <Button
            variant="primary"
            className="w-full min-h-[44px]"
            onClick={() => navigate('/phuc-vu')}
          >
            Về sơ đồ bàn
          </Button>
        </Card>
      </div>
    )
  }

  if (conflictTableNumber !== null) {
    return (
      <div className="space-y-4">
        <PageHeader title="Đổi bàn" backTo={`/phuc-vu/order/${tableId}`} />
        <Card className="space-y-4 text-center py-8 border-warning/60">
          <AlertTriangle
            className="w-12 h-12 text-warning mx-auto"
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold text-ink">
            Bàn đích không còn trống
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Bàn {conflictTableNumber} vừa có khách check-in hoặc giữ chỗ. Vui
            lòng chọn một bàn khác.
          </p>
          <Button
            variant="primary"
            className="w-full min-h-[44px]"
            onClick={() => {
              setConflictTableNumber(null)
              setSelectedTarget(null)
              void tablesQuery.refetch()
            }}
          >
            Chọn lại bàn khác
          </Button>
        </Card>
      </div>
    )
  }

  const locked = isOrderLockedForTable(sourceTable.status)
  const candidateTargets = (tablesQuery.data ?? []).filter(
    (t) =>
      t.id !== sourceTable.id &&
      t.status === 'Available' &&
      t.capacity >= guestCount
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Đổi bàn phục vụ"
        backTo={
          sourceTable.currentOrderId
            ? `/phuc-vu/order/${encodeURIComponent(sourceTable.id)}`
            : `/phuc-vu/ban/${encodeURIComponent(sourceTable.id)}`
        }
      />

      <Card className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">
            Chuyển từ {sourceTable.tableNumber} ({guestCount} khách)
          </p>
          <p className="text-xs text-ink-muted">
            {TABLE_ZONE_LABELS[sourceTable.zone]}
          </p>
        </div>
        {activeReservation && (
          <p className="text-xs font-medium text-accent">
            {activeReservation.guest.fullName}
          </p>
        )}
      </Card>

      {locked ? (
        <Card className="space-y-3">
          <p className="text-sm text-danger">
            Bàn đang chờ thanh toán, không thể đổi bàn lúc này.
          </p>
        </Card>
      ) : candidateTargets.length === 0 ? (
        <EmptyState
          title="Không có bàn đích phù hợp"
          description={`Hiện chưa có bàn Trống nào đủ ${guestCount} ghế.`}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-ink-muted">
            Chọn bàn đích Trống (≥ {guestCount} ghế):
          </p>

          <div className="space-y-2">
            {candidateTargets.map((candidate) => {
              const selected = selectedTarget?.id === candidate.id
              return (
                <button
                  key={candidate.id}
                  type="button"
                  data-testid={`transfer-target-${candidate.tableNumber}`}
                  onClick={() => setSelectedTarget(candidate)}
                  className={cn(
                    'w-full min-h-[64px] rounded-xl border p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-line bg-card hover:bg-card-hover'
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-ink">
                      Bàn {candidate.tableNumber} · {candidate.capacity} ghế
                    </p>
                    <p className="text-xs text-ink-muted">
                      {TABLE_ZONE_LABELS[candidate.zone]}
                    </p>
                  </div>
                  <StatusBadge status={candidate.status} />
                </button>
              )
            })}
          </div>

          {otherError && (
            <p className="text-xs text-danger" role="alert">
              {otherError}
            </p>
          )}

          <Button
            type="button"
            variant="primary"
            className="w-full min-h-[44px]"
            disabled={!selectedTarget}
            loading={transferMutation.isPending}
            onClick={() =>
              selectedTarget && transferMutation.mutate(selectedTarget.id)
            }
          >
            {selectedTarget
              ? `Xác nhận chuyển sang ${selectedTarget.tableNumber}`
              : 'Chọn bàn đích để tiếp tục'}
          </Button>
        </div>
      )}
    </div>
  )
}
