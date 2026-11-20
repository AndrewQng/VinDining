import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Printer,
  QrCode,
} from 'lucide-react'
import {
  buildBillLineItems,
  formatDateTime,
  formatInvoiceCode,
  formatSlotTime,
  formatVnd,
  hasAnyServedItem,
  type BillLineItem,
} from '@/domain'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ReceiptSlip80mm } from '@/components/ReceiptSlip80mm'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Money,
  Skeleton,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { invoiceApi } from '@/services/api'
import { useRealtime } from '@/services/realtime/useRealtime'
import type {
  ApiErrorResponse,
  InvoiceDto,
  InvoicePreviewDto,
  PaymentMethod,
} from '@/types'

type PreviewStage = 'preview' | 'payment' | 'settled'

const PAYMENT_OPTIONS: ReadonlyArray<{
  value: PaymentMethod
  label: string
  hint: string
  icon: typeof Banknote
}> = [
  {
    value: 'Cash',
    label: 'Tiền mặt',
    hint: 'Thu tiền mặt tại bàn qua sổ da',
    icon: Banknote,
  },
  {
    value: 'Card',
    label: 'Thẻ',
    hint: 'Khách thanh toán bằng cà thẻ POS không dây tại bàn',
    icon: CreditCard,
  },
  {
    value: 'VietQR',
    label: 'VietQR',
    hint: 'Khách quét mã VietQR trên phiếu tạm tính tại bàn',
    icon: QrCode,
  },
]

const METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ',
  VietQR: 'VietQR',
}

/** C2 / C2x / C2p / C3 / C3b — Tạm tính 80mm, cấn trừ tiền cọc và xác nhận thanh toán. */
export function InvoicePreviewPage() {
  useDocumentTitle('Phiếu tạm tính')
  const { tableId = '' } = useParams<{ tableId: string }>()
  const queryClient = useQueryClient()
  const [stage, setStage] = useState<PreviewStage>('preview')
  const [slipModalOpen, setSlipModalOpen] = useState(false)
  const [printedAt, setPrintedAt] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('VietQR')
  const [settledInvoice, setSettledInvoice] = useState<InvoiceDto | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const previewQuery = useQuery({
    queryKey: ['invoices', 'preview', tableId],
    queryFn: () => invoiceApi.getPreview(tableId),
    enabled: Boolean(tableId) && stage !== 'settled',
  })

  useRealtime('item:served', (payload) => {
    if (payload.tableId === tableId) {
      void queryClient.invalidateQueries({
        queryKey: ['invoices', 'preview', tableId],
      })
    }
  })

  useRealtime('order:updated', (payload) => {
    if (payload.tableId === tableId) {
      void queryClient.invalidateQueries({
        queryKey: ['invoices', 'preview', tableId],
      })
    }
  })

  const printPreviewMutation = useMutation({
    mutationFn: () => invoiceApi.printPreview(tableId),
    onSuccess: (res) => {
      setActionError(null)
      setPrintedAt(res.printedAt)
      setSlipModalOpen(true)
    },
    onError: (err) => {
      setActionError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể tạo phiếu tạm tính')
          : 'Không thể tạo phiếu tạm tính'
      )
    },
  })

  const settleMutation = useMutation({
    mutationFn: (method: PaymentMethod) =>
      invoiceApi.settle(tableId, { paymentMethod: method }),
    onSuccess: (invoice) => {
      setActionError(null)
      setSettledInvoice(invoice)
      setStage('settled')
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      void queryClient.refetchQueries({ queryKey: ['tables'] })
      void queryClient.invalidateQueries({ queryKey: ['invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err) => {
      setActionError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể xác nhận thanh toán')
          : 'Không thể xác nhận thanh toán'
      )
    },
  })

  if (stage === 'settled' && settledInvoice) {
    return <SettledSuccessPanel invoice={settledInvoice} />
  }

  if (previewQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  const preview = previewQuery.data
  if (!preview) {
    return (
      <EmptyState
        title="Không tìm thấy phiếu tạm tính"
        description="Bàn có thể đã được thanh toán hoặc chưa có đơn gọi món đang hoạt động."
        action={
          <Link to="/thu-ngan">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại hàng chờ
            </Button>
          </Link>
        }
      />
    )
  }

  if (stage === 'payment') {
    return (
      <PaymentConfirmPanel
        preview={preview}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        isSubmitting={settleMutation.isPending || Boolean(settledInvoice)}
        error={actionError}
        onConfirm={() => {
          if (settleMutation.isPending || settledInvoice) return
          settleMutation.mutate(selectedMethod)
        }}
        onBack={() => {
          setActionError(null)
          setStage('preview')
        }}
      />
    )
  }

  const billLines = buildBillLineItems(
    preview.items,
    preview.tastingMenuNames ?? {}
  )
  const canSettle =
    hasAnyServedItem(preview.items) && !preview.hasUnservedItems

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Phiếu tạm tính · Bàn {preview.tableNumber}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {preview.guestCount} khách · Phục vụ:{' '}
            {preview.waiterName ?? 'Chưa phân công'}
            {preview.openedAt
              ? ` · Giờ vào: ${formatSlotTime(preview.openedAt)}`
              : ''}
            {preview.checkoutRequestedAt
              ? ` · Yêu cầu tính tiền: ${formatSlotTime(preview.checkoutRequestedAt)}`
              : ''}
          </p>
        </div>

        <Link to="/thu-ngan">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Quay lại hàng chờ
          </Button>
        </Link>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {actionError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] items-start">
        <BillDetailsColumn
          preview={preview}
          lines={billLines}
        />
        <TotalsBreakdownPanel
          preview={preview}
          canSettle={canSettle}
          isPrinting={printPreviewMutation.isPending}
          onOpenPrintPreview={() => printPreviewMutation.mutate()}
          onProceedPayment={() => {
            setActionError(null)
            setStage('payment')
          }}
        />
      </div>

      <Modal
        open={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        title={`Xem trước phiếu tạm tính 80mm · Bàn ${preview.tableNumber}`}
        size="sm"
      >
        <div className="space-y-4">
          <ReceiptSlip80mm
            variant="preview"
            tableNumber={preview.tableNumber}
            guestCount={preview.guestCount}
            waiterName={preview.waiterName}
            timestampIso={printedAt ?? new Date().toISOString()}
            items={preview.items}
            tastingMenuNames={preview.tastingMenuNames}
            subtotal={preview.subtotal}
            serviceCharge={preview.serviceCharge}
            vatAmount={preview.vatAmount}
            totalAmount={preview.totalAmount}
            deductedDeposit={preview.deductedDeposit}
            amountDue={preview.amountDue}
            qrValue={preview.vietQrPayload}
            qrCaption="Quét mã để thanh toán"
            showLeatherFolderHint
          />

          <div className="no-print flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              In phiếu (80mm)
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                setSlipModalOpen(false)
                setStage('payment')
              }}
            >
              Đã in → Tiếp tục thanh toán
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function BillDetailsColumn({
  preview,
  lines,
}: {
  preview: InvoicePreviewDto
  lines: BillLineItem[]
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-accent">Món đã phục vụ</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Bàn {preview.tableNumber} · {preview.guestCount} khách
          {preview.openedAt ? ` · Giờ vào: ${formatSlotTime(preview.openedAt)}` : ''}
        </p>
      </div>

      {preview.hasUnservedItems && (
        <div
          data-testid="unserved-warning"
          className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs text-ink"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Đơn hàng còn món hoặc phần của Set Menu chưa phục vụ. Tạm tính chỉ
            tính tiền các món đã phục vụ.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {lines.map((line) => (
          <div
            key={line.id}
            data-testid={`bill-line-${line.id}`}
            className={cn(
              'flex items-center justify-between gap-4 rounded-xl border px-4 py-3',
              line.isServed
                ? 'border-line bg-card'
                : 'border-dashed border-line-strong bg-surface'
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {line.label} × {line.quantity}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
                {line.sublabel ? `${line.sublabel} · ` : ''}
                Đơn giá: {formatVnd(line.unitPrice)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  line.isServed ? 'text-accent' : 'text-ink-muted'
                )}
              >
                {formatVnd(line.lineTotal)}
              </span>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                  line.isServed
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-line bg-card text-ink-muted'
                )}
              >
                {line.isServed ? 'Đã ra món' : line.unservedNote}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function TotalsBreakdownPanel({
  preview,
  canSettle,
  isPrinting,
  onOpenPrintPreview,
  onProceedPayment,
}: {
  preview: InvoicePreviewDto
  canSettle: boolean
  isPrinting: boolean
  onOpenPrintPreview: () => void
  onProceedPayment: () => void
}) {
  const isMinimumSpendApplied =
    preview.amountDue === 0 &&
    preview.deductedDeposit > preview.totalAmount

  return (
    <Card className="space-y-5">
      <h2 className="text-sm font-semibold text-accent">Bảng tạm tính</h2>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Subtotal (Tiền món):</dt>
          <dd className="font-semibold text-ink tabular-nums">
            <Money amount={preview.subtotal} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Phí phục vụ (5%):</dt>
          <dd className="font-semibold text-ink tabular-nums">
            <Money amount={preview.serviceCharge} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">VAT (10%):</dt>
          <dd className="font-semibold text-ink tabular-nums">
            <Money amount={preview.vatAmount} />
          </dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-line pt-3">
          <dt className="font-semibold text-ink">Tổng cộng:</dt>
          <dd className="font-bold text-ink tabular-nums">
            <Money amount={preview.totalAmount} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">Trừ tiền cọc (VNPAY):</dt>
          <dd className="font-semibold text-success tabular-nums">
            {preview.deductedDeposit > 0 ? (
              <Money amount={preview.deductedDeposit} deduction />
            ) : (
              '0 ₫'
            )}
          </dd>
        </div>
      </dl>

      <div
        data-testid="amount-due-box"
        className="rounded-xl border border-accent/50 bg-accent/10 px-4 py-3.5"
      >
        <p className="text-xs font-semibold text-accent">
          Còn phải thanh toán
        </p>
        <p className="mt-1 font-serif text-3xl font-bold text-accent tabular-nums">
          <Money amount={preview.amountDue} />
        </p>
      </div>

      {isMinimumSpendApplied && (
        <div
          data-testid="minimum-spend-note"
          className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3"
        >
          <p className="text-xs font-semibold text-warning">
            Quy tắc tiền cọc tối thiểu
          </p>
          <p className="mt-1 text-xs font-medium text-ink">
            Tiền cọc là mức chi tiêu tối thiểu, không hoàn lại phần chênh lệch.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canSettle}
          loading={isPrinting}
          icon={<Printer className="w-4 h-4" />}
          onClick={onOpenPrintPreview}
        >
          In phiếu tạm tính (80mm)
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={!canSettle}
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={onProceedPayment}
        >
          Xác nhận thanh toán
        </Button>
        <Link to="/thu-ngan" className="block">
          <Button type="button" variant="ghost" className="w-full">
            ‹ Quay lại hàng chờ
          </Button>
        </Link>
      </div>
    </Card>
  )
}

function PaymentConfirmPanel({
  preview,
  selectedMethod,
  onSelectMethod,
  isSubmitting,
  error,
  onConfirm,
  onBack,
}: {
  preview: InvoicePreviewDto
  selectedMethod: PaymentMethod
  onSelectMethod: (method: PaymentMethod) => void
  isSubmitting: boolean
  error: string | null
  onConfirm: () => void
  onBack: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink">
          Xác nhận thanh toán · Bàn {preview.tableNumber}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Bàn {preview.tableNumber} · {preview.guestCount} khách
          {preview.deductedDeposit > 0
            ? ` · Đã trừ cọc ${formatVnd(preview.deductedDeposit)}`
            : ''}
        </p>
      </div>

      <Card className="space-y-6">
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-center">
          <p className="text-xs font-semibold text-accent">Số tiền cần thu</p>
          <p className="mt-1 font-serif text-4xl font-bold text-accent tabular-nums">
            <Money amount={preview.amountDue} />
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold text-ink-muted">
            Phương thức thanh toán
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENT_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = selectedMethod === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelectMethod(option.value)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors',
                    active
                      ? 'border-accent bg-accent/15 text-ink'
                      : 'border-line bg-card text-ink-muted hover:border-accent/50 hover:text-ink'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active ? 'text-accent' : 'text-ink-muted'
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {option.hint}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2.5">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={onConfirm}
          >
            Xác nhận hoàn tất thanh toán →
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
            onClick={onBack}
          >
            ‹ Quay lại phiếu tạm tính
          </Button>
        </div>
      </Card>
    </div>
  )
}

function SettledSuccessPanel({ invoice }: { invoice: InvoiceDto }) {
  const surveyUrl = `${window.location.origin}/danh-gia/${invoice.surveyToken}`

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-success" />
            <div>
              <p className="text-xs font-semibold text-success">
                Thanh toán thành công
              </p>
              <h1 className="mt-1 font-serif text-2xl font-bold text-ink">
                Đã thanh toán Bàn {invoice.tableNumber}
              </h1>
              <p className="mt-1 text-sm font-medium text-ink">
                {formatVnd(invoice.amountDue)} · {METHOD_LABELS[invoice.paymentMethod]}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Quyết toán lúc {formatDateTime(invoice.createdAt)} · Hóa đơn{' '}
                {formatInvoiceCode(invoice.id)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-ink">
              Trạng thái bàn {invoice.tableNumber}: Đang dọn
            </p>
            <p className="text-xs text-ink-muted">
              Bàn sẽ tự động chuyển về Trống sau khi phục vụ xác nhận dọn bàn.
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              In hóa đơn (80mm)
            </Button>
            <Link to="/thu-ngan">
              <Button variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
                Về hàng chờ thanh toán
              </Button>
            </Link>
            <Link to="/thu-ngan/hoa-don">
              <Button variant="ghost">Xem Hóa đơn hôm nay</Button>
            </Link>
          </div>
        </Card>

        <ReceiptSlip80mm
          variant="official"
          invoiceId={invoice.id}
          tableNumber={invoice.tableNumber}
          guestCount={invoice.guestCount}
          waiterName={invoice.waiterName}
          cashierName={invoice.settleByName}
          timestampIso={invoice.createdAt}
          items={invoice.items}
          tastingMenuNames={invoice.tastingMenuNames}
          subtotal={invoice.subtotal}
          serviceCharge={invoice.serviceCharge}
          vatAmount={invoice.vatAmount}
          totalAmount={invoice.totalAmount}
          deductedDeposit={invoice.deductedDeposit}
          amountDue={invoice.amountDue}
          paymentMethod={invoice.paymentMethod}
          qrValue={surveyUrl}
          qrCaption="Quét mã để đánh giá"
        />
      </div>
    </div>
  )
}
