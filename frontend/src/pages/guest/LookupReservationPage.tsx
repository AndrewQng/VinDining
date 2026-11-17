import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertCircle, CheckCircle2, Search } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Money,
  PageHeader,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import {
  evaluateCancellationPolicy,
  formatDateTime,
  TABLE_ZONE_LABELS,
} from '@/domain'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { reservationApi } from '@/services/api'
import type { ApiErrorResponse, ReservationDto } from '@/types'

/** G2 — Guest reservation lookup and 4-hour cutoff cancellation flow. */
export function LookupReservationPage() {
  useDocumentTitle('Tra cứu đặt bàn')
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [bookingCode, setBookingCode] = useState(
    () => searchParams.get('code') ?? ''
  )
  const [phoneNumber, setPhoneNumber] = useState('')
  const [formErrors, setFormErrors] = useState<{
    bookingCode?: string
    phoneNumber?: string
  }>({})
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<ReservationDto | null>(null)

  const [confirmMode, setConfirmMode] = useState<'none' | 'refund' | 'forfeit'>(
    'none'
  )
  const [cancelReason, setCancelReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelOutcome, setCancelOutcome] = useState<{
    refunded: boolean
    refundAmount: number
  } | null>(null)

  const lookupMutation = useMutation({
    mutationFn: () =>
      reservationApi.getByCode(bookingCode.trim(), phoneNumber.trim()),
    onSuccess: (data) => {
      setLookupError(null)
      setReservation(data)
      setConfirmMode('none')
      setCancelOutcome(null)
      setCancelError(null)
    },
    onError: (err) => {
      setReservation(null)
      if (isAxiosError<ApiErrorResponse>(err)) {
        setLookupError(
          err.response?.data?.message ??
            'Không tìm thấy thông tin đặt bàn khớp với mã và số điện thoại đã nhập'
        )
      } else {
        setLookupError('Không thể tra cứu đặt bàn lúc này')
      }
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (confirmForfeit: boolean) =>
      reservationApi.cancel({
        bookingCode: reservation!.bookingCode,
        phoneNumber: phoneNumber.trim(),
        reason: cancelReason.trim(),
        confirmForfeit,
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-all-slots'] })
      setReservation(res.reservation)
      setConfirmMode('none')
      setCancelError(null)
      setCancelOutcome({
        refunded: res.refunded,
        refundAmount: res.refundAmount,
      })
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        setCancelError(
          err.response?.data?.message ?? 'Không thể hủy đặt bàn lúc này'
        )
      } else {
        setCancelError('Không thể kết nối hệ thống')
      }
    },
  })

  const handleLookupSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors: { bookingCode?: string; phoneNumber?: string } = {}
    if (!bookingCode.trim()) {
      errors.bookingCode = 'Vui lòng nhập mã đặt bàn'
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại'
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    lookupMutation.mutate()
  }

  const handleOpenCancel = () => {
    if (!reservation) return
    const depositAmount = reservation.deposit?.amount ?? 0
    const policy = evaluateCancellationPolicy(
      reservation.reservationTime,
      new Date(),
      depositAmount
    )
    setReasonError(null)
    setCancelError(null)
    setConfirmMode(policy.isEligibleForFullRefund ? 'refund' : 'forfeit')
  }

  const handleConfirmCancel = (confirmForfeit: boolean) => {
    if (!cancelReason.trim()) {
      setReasonError('Vui lòng nhập lý do hủy đặt bàn')
      return
    }
    setReasonError(null)
    cancelMutation.mutate(confirmForfeit)
  }

  const depositAmount = reservation?.deposit?.amount ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        title="Tra cứu & hủy đặt bàn"
        subtitle="Nhập mã đặt bàn và số điện thoại đã đăng ký để xem chi tiết"
        backTo="/"
        backLabel="Về trang chủ"
      />

      {/* G2.1 Lookup Form */}
      <Card className="max-w-xl">
        <form onSubmit={handleLookupSubmit} className="space-y-4">
          <Input
            label="Mã đặt bàn *"
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value)}
            placeholder="VD-7K3Q"
            error={formErrors.bookingCode}
          />
          <Input
            label="Số điện thoại *"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0901 234 567"
            error={formErrors.phoneNumber}
          />

          {lookupError && (
            <div
              role="alert"
              className="rounded-lg border border-danger/50 bg-danger/10 p-3 flex items-center gap-2 text-sm text-danger"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{lookupError}</span>
            </div>
          )}

          <Button
            type="submit"
            loading={lookupMutation.isPending}
            icon={<Search className="w-4 h-4" />}
          >
            Tra cứu đặt bàn
          </Button>
        </form>
      </Card>

      {/* G2.2 / G2.4 / G2.4x Details */}
      {reservation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-semibold text-accent">
                {reservation.bookingCode}
              </h2>
              <StatusBadge status={reservation.status} domain="reservation" />
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-ink">
                Thời gian: {formatDateTime(reservation.reservationTime)}
              </p>
              <p className="text-ink-muted">
                Vị trí: Bàn {reservation.tableNumber} ·{' '}
                {TABLE_ZONE_LABELS[reservation.zone]} · {reservation.partySize}{' '}
                khách
              </p>
              <p className="text-ink-muted">
                Khách hàng: {reservation.guest.fullName} (
                {reservation.guest.phoneNumber})
              </p>
              <p className="text-ink-muted">
                Tiền cọc:{' '}
                <Money amount={depositAmount} tone="accent" />
              </p>
              {reservation.preOrderedTastingMenuName && (
                <p className="text-accent font-medium">
                  Set Menu đặt trước: {reservation.preOrderedTastingMenuName} ×{' '}
                  {reservation.partySize}
                </p>
              )}
              {reservation.cancelledReason && (
                <p className="text-ink-muted pt-1 border-t border-line">
                  Lý do hủy: {reservation.cancelledReason}
                </p>
              )}
            </div>

            {cancelOutcome && (
              <div
                role="status"
                className="rounded-lg border border-line bg-card p-3.5 flex items-start gap-2.5 text-sm"
              >
                <CheckCircle2
                  className="w-4 h-4 text-accent shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  {cancelOutcome.refunded ? (
                    <p className="text-ink">
                      Đã hủy đặt bàn và hoàn 100% tiền cọc (
                      <Money amount={cancelOutcome.refundAmount} tone="accent" />
                      ) qua VNPAY.
                    </p>
                  ) : (
                    <p className="text-ink">
                      Đã hủy đặt bàn. Tiền cọc không được hoàn lại theo chính
                      sách dưới 4 tiếng.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <h2 className="text-base font-semibold text-accent">
                Chính sách hủy đặt bàn & hoàn cọc
              </h2>
              <ul className="space-y-1.5 text-sm text-ink-muted">
                <li>
                  • Hủy trước giờ hẹn từ 4 tiếng: hoàn 100% tiền cọc qua VNPAY.
                </li>
                <li>• Hủy dưới 4 tiếng hoặc vắng mặt: không hoàn cọc.</li>
              </ul>

              {reservation.status === 'Reserved' && confirmMode === 'none' && (
                <Button variant="danger" onClick={handleOpenCancel}>
                  Hủy đặt bàn này
                </Button>
              )}

              {reservation.status !== 'Reserved' && !cancelOutcome && (
                <p className="text-xs text-ink-subtle">
                  Đơn đặt bàn đang ở trạng thái cuối hoặc chưa hoàn tất cọc nên
                  không thể hủy.
                </p>
              )}
            </Card>

            {/* G2.3 >= 4h full refund confirmation */}
            {confirmMode === 'refund' && (
              <Card className="space-y-4 border-primary/50">
                <h3 className="text-base font-semibold text-ink">
                  Xác nhận hủy đặt bàn & hoàn cọc 100%
                </h3>
                <p className="text-sm text-ink-muted">
                  Quý khách hủy trước giờ hẹn từ 4 tiếng trở lên. Hệ thống sẽ
                  hoàn <Money amount={depositAmount} tone="accent" /> qua VNPAY.
                </p>
                <Textarea
                  label="Lý do hủy *"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đặt bàn..."
                  error={reasonError ?? undefined}
                />
                {cancelError && (
                  <p role="alert" className="text-sm text-danger">
                    {cancelError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmMode('none')}
                  >
                    Giữ đặt bàn
                  </Button>
                  <Button
                    variant="danger"
                    loading={cancelMutation.isPending}
                    onClick={() => handleConfirmCancel(false)}
                  >
                    Xác nhận hủy & hoàn cọc
                  </Button>
                </div>
              </Card>
            )}

            {/* G2.2x < 4h forfeit warning */}
            {confirmMode === 'forfeit' && (
              <Card className="space-y-4 border-danger/60">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-danger">
                  Cảnh báo chính sách hủy
                </h3>
                <p className="text-sm text-ink">
                  Thời gian đến giờ hẹn còn dưới 4 tiếng. Theo quy định của nhà
                  hàng, tiền cọc <Money amount={depositAmount} tone="accent" />{' '}
                  sẽ KHÔNG được hoàn lại nếu quý khách hủy đặt bàn.
                </p>
                <Textarea
                  label="Lý do hủy *"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đặt bàn..."
                  error={reasonError ?? undefined}
                />
                {cancelError && (
                  <p role="alert" className="text-sm text-danger">
                    {cancelError}
                  </p>
                )}
                <div className="flex flex-col gap-2.5">
                  <Button onClick={() => setConfirmMode('none')}>
                    Giữ đặt bàn (không hủy)
                  </Button>
                  <Button
                    variant="danger"
                    loading={cancelMutation.isPending}
                    onClick={() => handleConfirmCancel(true)}
                  >
                    Đồng ý hủy (không hoàn cọc)
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
