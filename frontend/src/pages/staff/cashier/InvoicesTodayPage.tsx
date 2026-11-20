import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { formatDateTime, formatInvoiceCode, formatVnd } from '@/domain'
import { ReceiptSlip80mm } from '@/components/ReceiptSlip80mm'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Money,
  Skeleton,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { invoiceApi } from '@/services/api'
import { useRealtime } from '@/services/realtime/useRealtime'
import type { InvoiceDto, PaymentMethod } from '@/types'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ',
  VietQR: 'VietQR',
}

type MethodFilter = 'ALL' | PaymentMethod

const FILTER_OPTIONS: ReadonlyArray<{ value: MethodFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'Cash', label: 'Tiền mặt' },
  { value: 'Card', label: 'Thẻ' },
  { value: 'VietQR', label: 'VietQR' },
]

function getTodayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Hóa đơn hôm nay — danh sách hóa đơn đã quyết toán trong ngày và in lại phiếu 80mm. */
export function InvoicesTodayPage() {
  useDocumentTitle('Hóa đơn hôm nay')
  const queryClient = useQueryClient()
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  )
  const todayDate = getTodayDateString()

  const invoicesQuery = useQuery({
    queryKey: ['invoices', 'list', todayDate, methodFilter],
    queryFn: () =>
      invoiceApi.list({
        date: todayDate,
        ...(methodFilter === 'ALL' ? {} : { paymentMethod: methodFilter }),
      }),
  })

  const detailQuery = useQuery({
    queryKey: ['invoices', 'detail', selectedInvoiceId],
    queryFn: () => invoiceApi.getById(selectedInvoiceId!),
    enabled: Boolean(selectedInvoiceId),
  })

  useRealtime('invoice:settled', () => {
    void queryClient.invalidateQueries({ queryKey: ['invoices'] })
  })

  const invoices = invoicesQuery.data ?? []
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountDue, 0)
  const detail: InvoiceDto | undefined = detailQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Hóa đơn hôm nay
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {invoices.length} hóa đơn đã thanh toán · Tổng thực thu:{' '}
            <span className="font-semibold text-accent tabular-nums">
              {formatVnd(totalCollected)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethodFilter(opt.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                methodFilter === opt.value
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line bg-card text-ink-muted hover:text-ink'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {invoicesQuery.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="Chưa có hóa đơn nào hôm nay"
          description="Các bàn sau khi xác nhận thanh toán sẽ được lưu tại đây để tra cứu và in lại."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-card/70 text-xs font-semibold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Mã hóa đơn</th>
                  <th className="px-4 py-3">Bàn</th>
                  <th className="px-4 py-3">Giờ thanh toán</th>
                  <th className="px-4 py-3">Phương thức</th>
                  <th className="px-4 py-3">Thu ngân</th>
                  <th className="px-4 py-3 text-right">Cọc đã trừ</th>
                  <th className="px-4 py-3 text-right">Thực thu</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    data-testid={`invoice-row-${inv.id}`}
                    className="transition-colors hover:bg-card-hover"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-ink">
                      {formatInvoiceCode(inv.id)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      Bàn {inv.tableNumber}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-muted tabular-nums">
                      {formatDateTime(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-ink">
                      {METHOD_LABELS[inv.paymentMethod]}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">
                      {inv.settleByName}
                    </td>
                    <td className="px-4 py-3.5 text-right text-success tabular-nums">
                      {inv.deductedDeposit > 0 ? (
                        <Money amount={inv.deductedDeposit} deduction />
                      ) : (
                        '0 ₫'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                      <Money amount={inv.amountDue} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
                        Xem / In lại
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(selectedInvoiceId)}
        onClose={() => setSelectedInvoiceId(null)}
        title={
          detail
            ? `Chi tiết hóa đơn ${formatInvoiceCode(detail.id)} · Bàn ${detail.tableNumber}`
            : 'Chi tiết hóa đơn'
        }
        size="sm"
      >
        {detailQuery.isLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : detail ? (
          <div className="space-y-4">
            <ReceiptSlip80mm
              variant="official"
              invoiceId={detail.id}
              tableNumber={detail.tableNumber}
              guestCount={detail.guestCount}
              waiterName={detail.waiterName}
              cashierName={detail.settleByName}
              timestampIso={detail.createdAt}
              items={detail.items}
              tastingMenuNames={detail.tastingMenuNames}
              subtotal={detail.subtotal}
              serviceCharge={detail.serviceCharge}
              vatAmount={detail.vatAmount}
              totalAmount={detail.totalAmount}
              deductedDeposit={detail.deductedDeposit}
              amountDue={detail.amountDue}
              paymentMethod={detail.paymentMethod}
              qrValue={`${window.location.origin}/danh-gia/${detail.surveyToken}`}
              qrCaption="Quét mã để đánh giá"
            />
            <div className="no-print flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedInvoiceId(null)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                In lại (80mm)
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Không tìm thấy hóa đơn.</p>
        )}
      </Modal>
    </div>
  )
}
