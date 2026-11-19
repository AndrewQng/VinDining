import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  buildBillLineItems,
  formatDateTime,
  formatInvoiceCode,
  formatVnd,
  formatVndDeduction,
  type BillLineItem,
} from '@/domain'
import type { OrderItemDto, PaymentMethod } from '@/types'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ',
  VietQR: 'VietQR',
}

export type ReceiptSlipVariant = 'preview' | 'official'

export interface ReceiptSlip80mmProps {
  variant: ReceiptSlipVariant
  tableNumber: string
  guestCount?: number | null
  waiterName?: string | null
  cashierName?: string | null
  timestampIso: string
  items?: ReadonlyArray<OrderItemDto>
  tastingMenuNames?: Record<string, string>
  subtotal: number
  serviceCharge: number
  vatAmount: number
  totalAmount: number
  deductedDeposit: number
  amountDue: number
  paymentMethod?: PaymentMethod
  qrValue: string
  qrCaption: string
  invoiceId?: string
  showLeatherFolderHint?: boolean
  children?: React.ReactNode
}

/**
 * Shared 80mm thermal slip (~302px CSS width) for both screen preview and `window.print()`.
 * Uses real client-side QR rendering via `qrcode` without any bank account credentials.
 */
export function ReceiptSlip80mm({
  variant,
  tableNumber,
  guestCount,
  waiterName,
  cashierName,
  timestampIso,
  items = [],
  tastingMenuNames = {},
  subtotal,
  serviceCharge,
  vatAmount,
  totalAmount,
  deductedDeposit,
  amountDue,
  paymentMethod,
  qrValue,
  qrCaption,
  invoiceId,
  showLeatherFolderHint = false,
  children,
}: ReceiptSlip80mmProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const lines: BillLineItem[] = buildBillLineItems(items, tastingMenuNames)
  const billableLines = lines.filter((line) => line.isServed)

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(qrValue || 'https://vindining.vn', {
      width: 148,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        if (active) setQrDataUrl('')
      })
    return () => {
      active = false
    }
  }, [qrValue])

  const heading = variant === 'preview' ? 'PHIẾU TẠM TÍNH' : 'HÓA ĐƠN'
  const dueLabel =
    variant === 'preview' ? 'CÒN PHẢI THANH TOÁN:' : 'ĐÃ THANH TOÁN:'

  return (
    <div
      data-testid="receipt-slip-80mm"
      className="print-slip-area mx-auto w-[302px] max-w-full rounded-xl border border-[#d6d3ce] bg-white px-4 py-5 text-[#111827] shadow-lg"
    >
      <div className="text-center space-y-1">
        <p className="font-serif text-lg font-bold tracking-tight text-[#111827]">
          VinDining
        </p>
        <p className="text-xs font-bold tracking-wider uppercase text-[#1f2937]">
          {heading}
        </p>
        {invoiceId && variant === 'official' && (
          <p className="text-[11px] font-mono text-[#6b7280]">
            Mã HĐ: {formatInvoiceCode(invoiceId)}
          </p>
        )}
        <p className="text-xs font-semibold text-[#374151]">
          Bàn: {tableNumber}
          {guestCount ? ` · Số khách: ${guestCount}` : ''}
        </p>
        <p className="text-[11px] text-[#6b7280]">
          {waiterName ? `Phục vụ: ${waiterName} · ` : ''}
          {formatDateTime(timestampIso)}
        </p>
        {variant === 'official' && paymentMethod && (
          <p className="text-[11px] font-semibold text-[#111827]">
            Phương thức: {PAYMENT_METHOD_LABELS[paymentMethod]}
            {cashierName ? ` · Thu ngân: ${cashierName}` : ''}
          </p>
        )}
      </div>

      <hr className="my-3 border-dashed border-[#cbd5e1]" />

      <div className="space-y-1.5 text-xs">
        {billableLines.length > 0 ? (
          billableLines.map((line) => (
            <div key={line.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-[#111827]">
                  {line.label} × {line.quantity}
                </p>
                {line.sublabel && (
                  <p className="text-[10px] text-[#6b7280]">{line.sublabel}</p>
                )}
              </div>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatVnd(line.lineTotal)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between gap-2 text-[#374151]">
            <span>Chi tiết món đã phục vụ</span>
            <span className="font-semibold tabular-nums">
              {formatVnd(subtotal)}
            </span>
          </div>
        )}
      </div>

      <hr className="my-3 border-dashed border-[#cbd5e1]" />

      <dl className="space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-[#4b5563]">Tiền món (Subtotal):</dt>
          <dd className="font-semibold tabular-nums">{formatVnd(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#4b5563]">Phí phục vụ (5%):</dt>
          <dd className="font-semibold tabular-nums">
            {formatVnd(serviceCharge)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#4b5563]">VAT (10%):</dt>
          <dd className="font-semibold tabular-nums">{formatVnd(vatAmount)}</dd>
        </div>
        <div className="flex justify-between gap-2 pt-0.5">
          <dt className="font-semibold text-[#111827]">Tổng cộng:</dt>
          <dd className="font-bold tabular-nums">{formatVnd(totalAmount)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#4b5563]">Trừ tiền cọc:</dt>
          <dd className="font-semibold tabular-nums text-[#047857]">
            {deductedDeposit > 0 ? formatVndDeduction(deductedDeposit) : '0 ₫'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2 border-t border-dashed border-[#cbd5e1] pt-2 text-sm">
          <dt className="font-bold text-[#111827]">{dueLabel}</dt>
          <dd className="font-bold tabular-nums text-[#111827]">
            {formatVnd(amountDue)}
          </dd>
        </div>
      </dl>

      <hr className="my-3 border-dashed border-[#cbd5e1]" />

      <div className="flex flex-col items-center gap-2 text-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={qrCaption}
            className="h-[136px] w-[136px] rounded border border-[#e5e7eb] bg-white p-1"
          />
        ) : (
          <div className="flex h-[136px] w-[136px] items-center justify-center rounded border border-[#e5e7eb] bg-[#f9fafb] text-xs text-[#6b7280]">
            Đang tạo mã QR...
          </div>
        )}
        <p className="text-xs font-semibold text-[#111827]">{qrCaption}</p>
        {variant === 'preview' && (
          <p className="text-[11px] font-medium tabular-nums text-[#4b5563]">
            Số tiền: {formatVnd(amountDue)}
          </p>
        )}
      </div>

      {showLeatherFolderHint && (
        <div className="no-print mt-3 rounded-lg border border-[#e5a93c]/60 bg-[#fef3c7] px-3 py-2 text-center text-[11px] font-medium text-[#78350f]">
          Kẹp phiếu tạm tính vào sổ da và giao cho phục vụ mang ra bàn.
        </div>
      )}

      {children && <div className="no-print mt-3">{children}</div>}
    </div>
  )
}
