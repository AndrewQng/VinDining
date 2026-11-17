import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, RotateCcw } from 'lucide-react'
import {
  formatMinutesSeconds,
  groupKitchenTickets,
  type GroupedKitchenTicket,
} from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
  StatusBadge,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn, isMockMode } from '@/lib/utils'
import { orderApi } from '@/services/api'
import { seedFullKitchenDemo } from '@/services/mock'
import { useRealtime } from '@/services/realtime'
import type { ApiErrorResponse, KitchenPendingTicketDto } from '@/types'

interface RemakeDialogTarget {
  orderId: string
  itemId: string
  tableNumber: string
  courseTitle: string
  itemName: string
}

function getTicketBorderClass(ticket: GroupedKitchenTicket): string {
  if (ticket.lane === 'remake' || ticket.slaStatus === 'overdue') {
    return 'border-danger/70'
  }
  if (ticket.slaStatus === 'warning') {
    return 'border-warning/70'
  }
  return 'border-success/50'
}

function getSlaToneTextClass(ticket: GroupedKitchenTicket): string {
  if (ticket.lane === 'remake' || ticket.slaStatus === 'overdue') {
    return 'text-danger'
  }
  if (ticket.slaStatus === 'warning') {
    return 'text-warning'
  }
  return 'text-success'
}

function getSlaBarFillClass(ticket: GroupedKitchenTicket): string {
  if (ticket.lane === 'remake' || ticket.slaStatus === 'overdue') {
    return 'bg-danger'
  }
  if (ticket.slaStatus === 'warning') {
    return 'bg-warning'
  }
  return 'bg-success'
}

function formatClockTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** E1 — Expediter tablet Pass station for dispatching served dishes and requesting kitchen remakes. */
export function ExpediterPassPage() {
  useDocumentTitle('Quầy Pass')
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => new Date())
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'success' | 'warning' | 'danger'
    message: string
  } | null>(null)
  const [remakeTarget, setRemakeTarget] = useState<RemakeDialogTarget | null>(
    null
  )
  const [busyTicketId, setBusyTicketId] = useState<string | null>(null)

  useEffect(() => {
    if (isMockMode() && searchParams.get('demo') === 'full') {
      seedFullKitchenDemo()
    }
  }, [searchParams])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const {
    data: pendingItems = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['kitchen-pending'],
    queryFn: () => orderApi.getKitchenPending(),
  })

  useRealtime('order:updated', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })
  useRealtime('course:activated', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })
  useRealtime('item:served', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })
  useRealtime('item:remake-requested', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })

  const passTickets = useMemo(
    () =>
      groupKitchenTickets(pendingItems, now).filter(
        (t) => t.lane === 'remake' || t.lane === 'cooking'
      ),
    [pendingItems, now]
  )

  const totalDishes = useMemo(
    () => passTickets.reduce((sum, t) => sum + t.items.length, 0),
    [passTickets]
  )

  const serveItemsMutation = useMutation({
    mutationFn: async (input: {
      ticketId: string
      tableNumber: string
      courseTitle: string
      items: KitchenPendingTicketDto[]
    }) => {
      setBusyTicketId(input.ticketId)
      for (const item of input.items) {
        await orderApi.serveItem(item.orderId, item.orderItemId)
      }
      return input
    },
    onSuccess: ({ tableNumber, courseTitle, items }) => {
      setBusyTicketId(null)
      const label =
        items.length === 1
          ? `${tableNumber} · ${items[0].itemName} · Đã ra món`
          : `${tableNumber} · ${courseTitle} · Đã ra món`
      setFeedbackBanner({ tone: 'success', message: label })
      void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
    },
    onError: (err) => {
      setBusyTicketId(null)
      const msg = isAxiosError<ApiErrorResponse>(err)
        ? (err.response?.data?.message ?? 'Không thể xác nhận đi món lúc này')
        : 'Không thể kết nối hệ thống'
      setFeedbackBanner({ tone: 'danger', message: msg })
    },
  })

  const remakeMutation = useMutation({
    mutationFn: async (target: RemakeDialogTarget) => {
      return orderApi.remakeItem(target.orderId, target.itemId)
    },
    onSuccess: (_res, target) => {
      setRemakeTarget(null)
      setFeedbackBanner({
        tone: 'warning',
        message: `Đã gửi yêu cầu làm lại · ${target.tableNumber} · ${target.itemName}`,
      })
      void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
    },
    onError: (err) => {
      setRemakeTarget(null)
      const msg = isAxiosError<ApiErrorResponse>(err)
        ? (err.response?.data?.message ?? 'Không thể gửi yêu cầu làm lại')
        : 'Không thể kết nối hệ thống'
      setFeedbackBanner({ tone: 'danger', message: msg })
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface border border-line px-5 py-3.5">
        <div>
          <h1 className="text-lg font-bold text-ink">Điều phối món tại quầy Pass</h1>
          <p className="text-xs text-ink-muted">
            Sắp xếp theo mức độ ưu tiên thời gian chế biến
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-success tabular-nums">
            {totalDishes} món tại quầy Pass
          </span>
          <span
            data-testid="pass-clock"
            className="font-bold text-ink tabular-nums"
          >
            {formatClockTime(now)}
          </span>
        </div>
      </div>

      {feedbackBanner && (
        <div
          role="status"
          data-testid="pass-feedback-banner"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-semibold',
            feedbackBanner.tone === 'success' &&
              'border-success/60 bg-success/10 text-success',
            feedbackBanner.tone === 'warning' &&
              'border-warning/60 bg-warning/10 text-warning',
            feedbackBanner.tone === 'danger' &&
              'border-danger/60 bg-danger/10 text-danger'
          )}
        >
          {feedbackBanner.message}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      ) : isError ? (
        <Card className="space-y-3 text-center py-8">
          <p className="text-sm text-danger">Không thể tải danh sách món đang nấu.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : passTickets.length === 0 ? (
        <EmptyState
          title="Chưa có món đang nấu tại quầy Pass"
          description="Khi phục vụ kích hoạt món, vé chế biến sẽ hiển thị tự động tại đây."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {passTickets.map((ticket) => (
            <PassTicketCard
              key={ticket.id}
              ticket={ticket}
              isBusy={
                serveItemsMutation.isPending && busyTicketId === ticket.id
              }
              onServeAll={() =>
                serveItemsMutation.mutate({
                  ticketId: ticket.id,
                  tableNumber: ticket.tableNumber,
                  courseTitle: ticket.courseTitle,
                  items: ticket.items,
                })
              }
              onServeItem={(item) =>
                serveItemsMutation.mutate({
                  ticketId: ticket.id,
                  tableNumber: ticket.tableNumber,
                  courseTitle: ticket.courseTitle,
                  items: [item],
                })
              }
              onRequestRemake={(item) => {
                setRemakeTarget({
                  orderId: item.orderId,
                  itemId: item.orderItemId,
                  tableNumber: ticket.tableNumber,
                  courseTitle: ticket.courseTitle,
                  itemName: item.itemName,
                })
              }}
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(remakeTarget)}
        onClose={() => setRemakeTarget(null)}
        title="Yêu cầu làm lại món"
        description={
          remakeTarget
            ? `Bàn ${remakeTarget.tableNumber} · ${remakeTarget.courseTitle}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onClick={() => setRemakeTarget(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              className="min-h-[44px]"
              loading={remakeMutation.isPending}
              onClick={() => remakeTarget && remakeMutation.mutate(remakeTarget)}
            >
              Gửi yêu cầu làm lại
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <p className="text-ink-muted">Yêu cầu bếp làm lại món này?</p>
          <p className="font-semibold text-ink">{remakeTarget?.itemName}</p>
        </div>
      </Modal>
    </div>
  )
}

interface PassTicketCardProps {
  ticket: GroupedKitchenTicket
  isBusy: boolean
  onServeAll: () => void
  onServeItem: (item: KitchenPendingTicketDto) => void
  onRequestRemake: (item: KitchenPendingTicketDto) => void
}

function PassTicketCard({
  ticket,
  isBusy,
  onServeAll,
  onServeItem,
  onRequestRemake,
}: PassTicketCardProps) {
  const isRemake = ticket.lane === 'remake'
  const progressPct =
    ticket.slaSeconds > 0
      ? Math.min(100, Math.round((ticket.elapsedSeconds / ticket.slaSeconds) * 100))
      : 0
  const slaLabel = `${isRemake ? 'Đang làm lại' : 'Đang nấu'} · ${formatMinutesSeconds(
    ticket.elapsedSeconds
  )} / ${formatMinutesSeconds(ticket.slaSeconds)}`

  return (
    <Card
      data-testid={`pass-ticket-${ticket.tableNumber}-${ticket.courseKey}-${ticket.lane}`}
      data-sla-status={ticket.slaStatus}
      className={cn(
        'flex flex-col justify-between gap-4 border-2',
        getTicketBorderClass(ticket)
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">
            Bàn {ticket.tableNumber} · {ticket.courseTitle}
          </h2>
          <StatusBadge
            status={isRemake ? 'Cooking' : 'Cooking'}
            isRemake={isRemake}
          />
        </div>

        <ul className="space-y-2.5">
          {ticket.items.map((item) => (
            <li
              key={item.orderItemId}
              className="rounded-lg bg-card border border-line px-3 py-2.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {item.quantity}× {item.itemName}
                  </p>
                  {item.note && (
                    <p className="text-xs text-accent mt-0.5">
                      Ghi chú: {item.note}
                    </p>
                  )}
                </div>
                <span className="text-xs text-ink-muted tabular-nums shrink-0">
                  {item.prepTimeMinutes} phút
                </span>
              </div>

              {ticket.items.length > 1 && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="min-h-[44px]"
                    disabled={isBusy}
                    icon={<Check className="w-3.5 h-3.5 text-success" />}
                    onClick={() => onServeItem(item)}
                  >
                    Xác nhận đi món
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-[44px] text-danger"
                    disabled={isBusy}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => onRequestRemake(item)}
                  >
                    Yêu cầu làm lại
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p
            data-testid={`pass-sla-${ticket.tableNumber}-${ticket.courseKey}`}
            className={cn(
              'text-xs font-semibold tabular-nums',
              getSlaToneTextClass(ticket)
            )}
          >
            {slaLabel}
          </p>
          <div className="h-2 w-full rounded-full bg-card overflow-hidden">
            <div
              className={cn('h-full transition-all', getSlaBarFillClass(ticket))}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            className="min-h-[44px]"
            loading={isBusy}
            icon={<Check className="w-4 h-4" />}
            onClick={onServeAll}
          >
            Xác nhận đi món
          </Button>
          {ticket.items.length === 1 && (
            <Button
              type="button"
              variant="danger"
              className="min-h-[44px]"
              disabled={isBusy}
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => onRequestRemake(ticket.items[0])}
            >
              Yêu cầu làm lại
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
