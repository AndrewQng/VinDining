import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { CheckCircle2, Eye, XCircle } from 'lucide-react'
import {
  RESERVATION_STATUS_LABELS,
  TABLE_ZONE_LABELS,
  formatDateTime,
  formatVnd,
} from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Money,
  Skeleton,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { managerApi } from '@/services/api'
import { useToastStore } from '@/stores/useToastStore'
import type { ApiErrorResponse, RefundRequestDto } from '@/types'

type RefundTab = 'pending' | 'processed'

function formatDecisionLabel(item: RefundRequestDto): string {
  const isApproved =
    item.decisionAction === 'ManualRefundApproved' ||
    item.reservation.status === 'Cancelled_Refunded'
  return isApproved ? 'Chấp thuận hoàn cọc' : 'Từ chối hoàn cọc'
}

/** M3 / M3d / M3a / M3r — Hoàn cọc ngoại lệ (chỉ các đơn bất khả kháng). */
export function ManagerRefundsPage() {
  useDocumentTitle('Hoàn cọc ngoại lệ')
  const queryClient = useQueryClient()
  const pushToast = useToastStore((s) => s.push)
  const [tab, setTab] = useState<RefundTab>('pending')
  const [selected, setSelected] = useState<RefundRequestDto | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const refundsQuery = useQuery({
    queryKey: ['manager', 'refunds'],
    queryFn: managerApi.getRefunds,
  })

  const decisionMutation = useMutation({
    mutationFn: ({
      reservationId,
      approved,
      decisionReason,
    }: {
      reservationId: string
      approved: boolean
      decisionReason: string
    }) =>
      managerApi.processManualRefund(reservationId, {
        approved,
        reason: decisionReason,
      }),
    onSuccess: (updated, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['manager', 'refunds'] })
      setReasonError(null)
      const note = vars.approved
        ? `Đã hoàn tiền cọc qua VNPAY cho đơn ${updated.bookingCode} và ghi nhận thông báo đến khách hàng.`
        : `Đã từ chối hoàn cọc đơn ${updated.bookingCode} và ghi nhận thông báo đến khách hàng.`
      setActionMessage(note)
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              reservation: updated,
              auditReason: vars.decisionReason,
              processedAt: new Date().toISOString(),
              decisionAction: vars.approved
                ? 'ManualRefundApproved'
                : 'ManualRefundRejected',
            }
          : null
      )
      pushToast({
        variant: vars.approved ? 'success' : 'warning',
        title: vars.approved ? 'Đã chấp thuận hoàn cọc' : 'Đã từ chối hoàn cọc',
        description: updated.bookingCode,
      })
    },
    onError: (err) => {
      setReasonError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể xử lý yêu cầu hoàn cọc')
          : 'Không thể xử lý yêu cầu hoàn cọc'
      )
    },
  })

  const pendingRows = useMemo(
    () =>
      (refundsQuery.data ?? []).filter(
        (r) => r.reservation.status === 'Cancelled_Forfeited'
      ),
    [refundsQuery.data]
  )

  const processedRows = useMemo(
    () =>
      (refundsQuery.data ?? [])
        .filter((r) => r.reservation.status !== 'Cancelled_Forfeited')
        .sort(
          (a, b) =>
            Date.parse(b.processedAt ?? b.requestedAt) -
            Date.parse(a.processedAt ?? a.requestedAt)
        ),
    [refundsQuery.data]
  )

  const rows = tab === 'pending' ? pendingRows : processedRows

  const openDetail = (item: RefundRequestDto) => {
    setSelected(item)
    setReason(item.auditReason ?? '')
    setReasonError(null)
    setActionMessage(null)
  }

  const submitDecision = (approved: boolean) => {
    if (!selected) return
    const trimmed = reason.trim()
    if (!trimmed) {
      setReasonError('Vui lòng nhập lý do phê duyệt hoặc từ chối')
      return
    }
    decisionMutation.mutate({
      reservationId: selected.reservation.id,
      approved,
      decisionReason: trimmed,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl font-bold text-ink">
            Hoàn cọc ngoại lệ
          </h1>

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'pending', label: `Chờ xử lý (${pendingRows.length})` },
              {
                value: 'processed',
                label: `Đã xử lý (${processedRows.length})`,
              },
            ]}
          />
        </div>

        <p
          data-testid="refund-policy-banner"
          className="rounded-xl border border-line bg-card/80 px-4 py-3 text-sm text-ink-muted"
        >
          Hủy trước giờ hẹn từ 4 tiếng: tự động hoàn 100% cọc. Hủy dưới 4 tiếng
          hoặc vắng mặt: không hoàn cọc. Quản lý chỉ xét hoàn cọc ngoại lệ trong
          trường hợp bất khả kháng.
        </p>
      </div>

      {refundsQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Không có yêu cầu hoàn cọc nào"
          description="Các đơn hủy dưới 4 tiếng hoặc trường hợp ngoại lệ sẽ xuất hiện tại đây."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line bg-card/70 text-xs font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Mã đặt bàn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Bàn & Giờ hẹn</th>
                  <th className="px-4 py-3 text-right">Tiền cọc</th>
                  <th className="px-4 py-3">
                    {tab === 'processed'
                      ? 'Quyết định & lý do ngoại lệ'
                      : 'Lý do khách nhập'}
                  </th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((item) => {
                  const r = item.reservation
                  return (
                    <tr
                      key={r.id}
                      data-testid={`refund-row-${r.bookingCode}`}
                      className="transition-colors hover:bg-card-hover"
                    >
                      <td className="px-4 py-3.5 font-mono font-semibold text-accent">
                        {r.bookingCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-ink">{r.guest.fullName}</p>
                        <p className="text-xs text-ink-muted">{r.guest.phoneNumber}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-muted">
                        Bàn {r.tableNumber} ({TABLE_ZONE_LABELS[r.zone]})
                        <br />
                        {formatDateTime(r.reservationTime)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                        <Money amount={r.deposit?.amount ?? 0} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-muted max-w-xs space-y-1">
                        {tab === 'processed' ? (
                          <>
                            <p className="font-semibold text-ink">
                              {formatDecisionLabel(item)}
                            </p>
                            <p>{item.auditReason ?? '—'}</p>
                            {item.processedAt && (
                              <p className="text-[11px] text-ink-subtle tabular-nums">
                                Xử lý lúc {formatDateTime(item.processedAt)}
                              </p>
                            )}
                          </>
                        ) : (
                          r.cancelledReason ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => openDetail(item)}
                        >
                          Xem
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Chi tiết hoàn cọc · ${selected?.reservation.bookingCode ?? ''}`}
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <dl className="grid gap-2.5 rounded-xl border border-line bg-card p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-muted">Khách hàng</dt>
                <dd className="font-semibold text-ink">
                  {selected.reservation.guest.fullName} ·{' '}
                  {selected.reservation.guest.phoneNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Trạng thái</dt>
                <dd className="font-semibold text-ink">
                  {RESERVATION_STATUS_LABELS[selected.reservation.status]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Bàn & Giờ hẹn</dt>
                <dd className="text-ink">
                  Bàn {selected.reservation.tableNumber} ·{' '}
                  {formatDateTime(selected.reservation.reservationTime)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Số tiền cọc VNPAY</dt>
                <dd className="font-bold text-accent tabular-nums">
                  {formatVnd(selected.reservation.deposit?.amount ?? 0)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-muted">Lý do hủy của khách</dt>
                <dd className="text-ink">
                  {selected.reservation.cancelledReason ??
                    'Hủy sát giờ hẹn dưới 4 tiếng'}
                </dd>
              </div>
            </dl>

            {actionMessage && (
              <div
                role="status"
                data-testid="refund-decision-status"
                className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-ink"
              >
                {actionMessage}
              </div>
            )}

            {selected.reservation.status === 'Cancelled_Forfeited' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="refund-audit-reason"
                    className="block text-xs font-medium text-ink-muted"
                  >
                    Lý do xử lý của Quản lý (lưu nhật ký kiểm toán)
                  </label>
                  <textarea
                    id="refund-audit-reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do chấp thuận hoàn tiền hoặc từ chối..."
                    className="w-full rounded-lg border border-line bg-card p-3 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                  {reasonError && (
                    <p role="alert" className="text-xs text-danger">
                      {reasonError}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="danger"
                    icon={<XCircle className="w-4 h-4" />}
                    loading={decisionMutation.isPending}
                    onClick={() => submitDecision(false)}
                  >
                    Từ chối hoàn cọc
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    loading={decisionMutation.isPending}
                    onClick={() => submitDecision(true)}
                  >
                    Chấp thuận hoàn cọc
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-card px-4 py-3 text-xs text-ink-muted space-y-1">
                <p className="font-semibold text-ink">
                  Kết quả xử lý: {formatDecisionLabel(selected)} ·{' '}
                  {RESERVATION_STATUS_LABELS[selected.reservation.status]}
                </p>
                {selected.auditReason && <p>Lý do: {selected.auditReason}</p>}
                {selected.processedAt && (
                  <p>Thời điểm xử lý: {formatDateTime(selected.processedAt)}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
