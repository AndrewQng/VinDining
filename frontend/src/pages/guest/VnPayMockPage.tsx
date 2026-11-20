import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { CreditCard, QrCode, ShieldCheck } from 'lucide-react'
import { Button, Card, Money, PageHeader, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { reservationApi } from '@/services/api'
import type { ApiErrorResponse, DepositPaymentMethod } from '@/types'
import { loadBookingDraft, saveBookingDraft } from './bookingState'

/** Simulated VNPAY deposit payment page calling POST /api/payments/vnpay-ipn. */
export function VnPayMockPage() {
  useDocumentTitle('Cổng thanh toán VNPAY')
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [method, setMethod] = useState<DepositPaymentMethod>('VietQR')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data: reservation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['pending-reservation', code],
    queryFn: () => reservationApi.getByCode(code),
    enabled: Boolean(code),
    retry: false,
  })

  const ipnMutation = useMutation({
    mutationFn: () =>
      reservationApi.processVnPayIpn({
        bookingCode: code,
        transactionId: `VNP-${code}-${Date.now()}`,
        paymentMethod: method,
        responseCode: '00',
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-all-slots'] })
      const current = loadBookingDraft()
      if (!res.success || res.reservation?.status !== 'Reserved') {
        saveBookingDraft({ ...current, step: 'expired', holdReservation: null })
        navigate('/dat-ban', { replace: true })
        return
      }
      saveBookingDraft({
        ...current,
        step: 'confirmed',
        holdReservation: null,
        confirmedReservation: res.reservation,
      })
      navigate(`/dat-ban?confirmed=${encodeURIComponent(code)}`, {
        replace: true,
      })
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        if (err.response?.status === 410) {
          const current = loadBookingDraft()
          saveBookingDraft({ ...current, step: 'expired' })
          navigate('/dat-ban', { replace: true })
          return
        }
        setErrorMessage(
          err.response?.data?.message ?? 'Thanh toán không thành công'
        )
      } else {
        setErrorMessage('Không thể kết nối cổng thanh toán')
      }
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (isError || !reservation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <PageHeader
          title="Cổng thanh toán VNPAY (mô phỏng)"
          backTo="/dat-ban"
        />
        <Card className="space-y-4 text-center py-8">
          <p className="text-sm text-ink-muted">
            Phiên giữ chỗ không tồn tại hoặc đã hết hạn 17 phút.
          </p>
          <Button onClick={() => navigate('/dat-ban')}>
            Quay lại đặt bàn
          </Button>
        </Card>
      </div>
    )
  }

  const amount = reservation.deposit?.amount ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <PageHeader
        title="Cổng thanh toán VNPAY (mô phỏng)"
        backTo="/dat-ban"
        backLabel="Hủy giao dịch"
      />

      <Card className="space-y-6">
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-card border border-line text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5 text-accent font-medium">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Thanh toán đặt cọc
          </span>
          <span>Mã: {reservation.bookingCode}</span>
        </div>

        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Phương thức thanh toán">
          <button
            type="button"
            role="radio"
            aria-checked={method === 'VietQR'}
            onClick={() => setMethod('VietQR')}
            className={cn(
              'p-3.5 rounded-xl border text-left transition-colors space-y-1 cursor-pointer',
              method === 'VietQR'
                ? 'border-primary ring-1 ring-primary bg-card text-accent'
                : 'border-line bg-card text-ink-muted hover:text-ink'
            )}
          >
            <QrCode className="w-5 h-5" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">VietQR</p>
            <p className="text-xs text-ink-muted">Quét mã để cọc</p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={method === 'Card'}
            onClick={() => setMethod('Card')}
            className={cn(
              'p-3.5 rounded-xl border text-left transition-colors space-y-1 cursor-pointer',
              method === 'Card'
                ? 'border-primary ring-1 ring-primary bg-card text-accent'
                : 'border-line bg-card text-ink-muted hover:text-ink'
            )}
          >
            <CreditCard className="w-5 h-5" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">Thẻ ngân hàng</p>
            <p className="text-xs text-ink-muted">Thẻ nội địa / quốc tế</p>
          </button>
        </div>

        {method === 'VietQR' ? (
          <div className="p-6 rounded-xl bg-card border border-line flex flex-col items-center gap-2 text-center">
            <div className="w-36 h-36 rounded-xl border-2 border-dashed border-primary/60 flex flex-col items-center justify-center gap-1 bg-surface">
              <QrCode className="w-16 h-16 text-accent" aria-hidden="true" />
              <span className="text-[11px] font-medium text-ink-muted">
                {reservation.bookingCode}
              </span>
            </div>
            <p className="text-xs text-ink-muted">Quét mã để cọc (mô phỏng)</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-card border border-line text-xs text-ink-muted space-y-1">
            <p className="font-medium text-ink">Thẻ ngân hàng mô phỏng</p>
            <p>Nhấn xác nhận để mô phỏng giao dịch thẻ thành công.</p>
          </div>
        )}

        <div className="text-center space-y-1">
          <p className="text-sm text-ink-muted">
            Đơn hàng: Đặt cọc bàn {reservation.tableNumber} · Mã{' '}
            {reservation.bookingCode}
          </p>
          <p className="text-xl font-semibold">
            Số tiền: <Money amount={amount} tone="accent" />
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className="text-sm text-danger text-center">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/dat-ban')}
          >
            Hủy giao dịch
          </Button>
          <Button
            fullWidth
            loading={ipnMutation.isPending}
            onClick={() => ipnMutation.mutate()}
          >
            Xác nhận thanh toán
          </Button>
        </div>
      </Card>
    </div>
  )
}
