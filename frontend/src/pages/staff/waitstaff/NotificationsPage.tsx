import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, RotateCcw, Utensils } from 'lucide-react'
import { SERVICE_REQUEST_TYPE_LABELS, formatRelativeMinutes } from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { serviceCallApi } from '@/services/api'
import { useWaitstaffNotificationsStore } from '@/stores/useWaitstaffNotificationsStore'
import type { ServiceRequestDto } from '@/types'

/** W9 & W9b — Realtime waitstaff notifications from Pass, Remake alerts, and guest table requests. */
export function NotificationsPage() {
  useDocumentTitle('Thông báo phục vụ')
  const queryClient = useQueryClient()

  const alerts = useWaitstaffNotificationsStore((s) => s.alerts)
  const completedRequests = useWaitstaffNotificationsStore(
    (s) => s.completedRequests
  )
  const acknowledgeAlert = useWaitstaffNotificationsStore(
    (s) => s.acknowledgeAlert
  )
  const recordCompletedRequest = useWaitstaffNotificationsStore(
    (s) => s.recordCompletedRequest
  )

  const { data: activeCalls = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['service-calls', 'active'],
    queryFn: () => serviceCallApi.getActive(),
  })

  const completeMutation = useMutation({
    mutationFn: (request: ServiceRequestDto) =>
      serviceCallApi.complete(request.id),
    onSuccess: (updated) => {
      recordCompletedRequest(updated)
      void queryClient.invalidateQueries({
        queryKey: ['service-calls', 'active'],
      })
    },
  })

  const unreadAlerts = alerts.filter((a) => !a.acknowledged)
  const totalUnread = activeCalls.length + unreadAlerts.length

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Thông báo phục vụ (${totalUnread})`}
        backTo="/phuc-vu"
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">
            Không thể tải danh sách thông báo.
          </p>
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
        <div className="space-y-3">
          {unreadAlerts.map((alert) => (
            <Card key={alert.id} className="space-y-2 border-primary/50">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-accent flex items-center gap-1.5">
                  {alert.kind === 'pass-ready' ? (
                    <Utensils className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {alert.kind === 'pass-ready'
                    ? 'Quầy Pass · Món sẵn sàng'
                    : 'Quầy Pass · Làm lại món'}
                </span>
                <span className="text-ink-muted">
                  {formatRelativeMinutes(alert.createdAt)}
                </span>
              </div>

              <p className="text-sm font-medium text-ink">
                {alert.kind === 'pass-ready'
                  ? `Bàn ${alert.tableNumber} · ${alert.itemName} đã sẵn sàng tại quầy Pass.`
                  : `Bàn ${alert.tableNumber} · ${alert.itemName} đang được làm lại.`}
              </p>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-[44px]"
                icon={<Check className="w-4 h-4" />}
                onClick={() => acknowledgeAlert(alert.id)}
              >
                Đã tiếp nhận
              </Button>
            </Card>
          ))}

          {activeCalls.map((req) => (
            <Card key={req.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-accent">
                  Yêu cầu từ khách tại bàn
                </span>
                <span className="text-ink-muted">
                  {formatRelativeMinutes(req.createdAt)}
                </span>
              </div>

              <p className="text-sm font-semibold text-ink">
                Bàn {req.tableNumber} · Yêu cầu:{' '}
                {SERVICE_REQUEST_TYPE_LABELS[req.requestType]}
              </p>

              <Button
                type="button"
                variant="primary"
                className="w-full min-h-[44px]"
                loading={
                  completeMutation.isPending &&
                  completeMutation.variables?.id === req.id
                }
                onClick={() => completeMutation.mutate(req)}
              >
                Xác nhận đã phục vụ
              </Button>
            </Card>
          ))}

          {completedRequests.map((req) => (
            <Card
              key={`done-${req.id}`}
              className="space-y-1 opacity-75 border-success/40"
            >
              <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Đã hoàn tất
              </p>
              <p className="text-xs text-ink-muted">
                Bàn {req.tableNumber} · Yêu cầu:{' '}
                {SERVICE_REQUEST_TYPE_LABELS[req.requestType]}
              </p>
            </Card>
          ))}

          {totalUnread === 0 && completedRequests.length === 0 && (
            <EmptyState
              title="Chưa có thông báo mới"
              description="Tín hiệu gọi phục vụ từ bàn ăn và quầy Pass sẽ hiển thị ngay tại đây."
            />
          )}
        </div>
      )}
    </div>
  )
}
