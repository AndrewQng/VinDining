import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightLeft, UtensilsCrossed } from 'lucide-react'
import { TABLE_ZONE_LABELS } from '@/domain'
import {
  Button,
  Card,
  PageHeader,
  Skeleton,
  StatusBadge,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { tableApi } from '@/services/api'

/** W2b — Post check-in / seated table summary routing either to auto-created Order or Order creation. */
export function TableCheckInDetailPage() {
  useDocumentTitle('Chi tiết bàn')
  const { tableId = '' } = useParams<{ tableId: string }>()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tableApi.getById(tableId),
    enabled: Boolean(tableId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Chi tiết bàn" backTo="/phuc-vu" />
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">Không thể tải thông tin bàn.</p>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  const { table, activeOrder, activeReservation } = data
  const zoneLabel = TABLE_ZONE_LABELS[table.zone]
  const guestLabel = activeReservation
    ? `Khách: ${activeReservation.guest.fullName}`
    : 'Khách vãng lai'
  const guestCount =
    table.guestCount ??
    activeReservation?.partySize ??
    activeOrder?.guestCount ??
    1

  const courseOneItems = activeOrder
    ? activeOrder.items.filter(
        (i) => i.courseType === 'Appetizer' || i.courseType === 'Beverage'
      )
    : []
  const allCourseOneServed =
    courseOneItems.length > 0 &&
    courseOneItems.every((i) => i.status === 'Served')

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Chi tiết Bàn ${table.tableNumber}`}
        backTo="/phuc-vu"
      />

      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">
            Bàn {table.tableNumber} · {zoneLabel}
          </h2>
          <StatusBadge status={table.status} />
        </div>
        <p className="text-xs text-ink-muted">
          {guestLabel} · {guestCount} khách
        </p>
      </Card>

      {activeOrder ? (
        <Card className="space-y-2 border-primary/50">
          <h3 className="text-sm font-bold text-accent">
            Đã tạo Order tự động · Course 1 đã gửi bếp
          </h3>
          {activeReservation?.preOrderedTastingMenuName && (
            <p className="text-xs font-medium text-ink">
              {activeReservation.preOrderedTastingMenuName} × {guestCount} ({guestCount}{' '}
              khách)
            </p>
          )}
          {courseOneItems.length > 0 && (
            <p className="text-xs text-ink-muted">
              Course 1:{' '}
              {courseOneItems
                .map((i) => `${i.quantity}× ${i.itemName}`)
                .join(', ')}{' '}
              {allCourseOneServed ? 'đã phục vụ.' : 'đang nấu tại bếp.'}
            </p>
          )}
        </Card>
      ) : (
        <Card className="space-y-2">
          <h3 className="text-sm font-bold text-ink">Chưa có order</h3>
          <p className="text-xs text-ink-muted">
            Bàn vừa check-in, vui lòng tạo order cho khách.
          </p>
        </Card>
      )}

      <div className="space-y-2.5 pt-1">
        {activeOrder ? (
          <Link
            to={`/phuc-vu/order/${encodeURIComponent(table.id)}`}
            className="block"
          >
            <Button
              variant="primary"
              className="w-full min-h-[44px]"
              icon={<UtensilsCrossed className="w-4 h-4" />}
            >
              Xem Order đang phục vụ
            </Button>
          </Link>
        ) : (
          <Link
            to={`/phuc-vu/tao-order/${encodeURIComponent(table.id)}`}
            className="block"
          >
            <Button
              variant="primary"
              className="w-full min-h-[44px]"
              icon={<UtensilsCrossed className="w-4 h-4" />}
            >
              Tạo Order
            </Button>
          </Link>
        )}

        {table.status === 'Occupied' && (
          <Link
            to={`/phuc-vu/doi-ban/${encodeURIComponent(table.id)}`}
            className="block"
          >
            <Button
              variant="secondary"
              className="w-full min-h-[44px]"
              icon={<ArrowRightLeft className="w-4 h-4" />}
            >
              Đổi bàn
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
