import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Banknote,
  Printer,
} from 'lucide-react'
import { ReceiptPreview80mm, type ReceiptData } from '@/features/billing'
import { Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export function CashierPage() {
  const [searchParams] = useSearchParams()
  const initialTableId = searchParams.get('tableId') || 't1'

  const [selectedTable, setSelectedTable] = useState(initialTableId)
  const [paymentMethod, setPaymentMethod] = useState<'VietQR' | 'Cash' | 'Card'>('VietQR')
  const [isSettled, setIsSettled] = useState(false)

  // Sample items for the selected table
  const orderItems = [
    {
      id: 'it1',
      name: 'Hokkaido Scallop Carpaccio',
      quantity: 2,
      unitPrice: 350000,
      total: 700000,
      status: 'Served' as const,
    },
    {
      id: 'it2',
      name: 'Foie Gras Poêlé au Truffle',
      quantity: 2,
      unitPrice: 680000,
      total: 1360000,
      status: 'Served' as const,
    },
    {
      id: 'it3',
      name: 'Bò Wagyu A5 Nướng Than Binchotan',
      quantity: 2,
      unitPrice: 1200000,
      total: 2400000,
      status: 'Served' as const,
    },
    {
      id: 'it4',
      name: 'Chocolate Valrhona Soufflé',
      quantity: 2,
      unitPrice: 250000,
      total: 500000,
      status: 'Served' as const,
    },
  ]

  // Calculation
  const subtotal = orderItems.reduce((acc, item) => acc + item.total, 0)
  const serviceCharge = Math.round(subtotal * 0.05)
  const vat = Math.round((subtotal + serviceCharge) * 0.1)
  const depositDeducted = 500000
  const finalAmount = Math.max(0, subtotal + serviceCharge + vat - depositDeducted)

  // Business invariant: All items must be 'Served' or 'Cancelled' before invoice settlement
  const hasIncompleteItems = orderItems.some(
    (item) => item.status !== 'Served'
  )

  const receiptData: ReceiptData = {
    invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}`,
    tableNumber: selectedTable === 't1' ? 'M01' : 'M02',
    waitstaffName: 'Nguyễn Văn Phục Vụ',
    guestCount: 2,
    issuedAt: new Date().toLocaleString('vi-VN'),
    items: orderItems,
    subtotal,
    serviceCharge,
    vat,
    depositDeducted,
    finalAmount,
  }

  const handleSettle = () => {
    setIsSettled(true)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/pos/tables"
            className="p-2 rounded-xl bg-dark-card hover:bg-dark-card-hover border border-dark-border text-neutral-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-neutral-100 flex items-center gap-2">
              Quầy Thu Ngân & Xuất Hóa Đơn (Cashier)
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Cấn trừ tiền cọc tự động • Tính 5% phí phục vụ & 10% VAT • In phiếu nhiệt 80mm
            </p>
          </div>
        </div>

        {/* Table Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Chọn bàn:</span>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="bg-dark-card border border-dark-border rounded-xl px-3 py-1.5 text-xs text-neutral-100 font-bold focus:outline-none focus:border-gold-500"
          >
            <option value="t1">Bàn M01 (Đang phục vụ - 2 khách)</option>
            <option value="t2">Bàn M02 (Đang phục vụ - 4 khách)</option>
          </select>
        </div>
      </div>

      {/* Incomplete items warning if any */}
      {hasIncompleteItems && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-300">
              Chưa thể quyết toán hóa đơn
            </h4>
            <p className="text-xs text-neutral-300 mt-0.5">
              Toàn bộ món ăn trong đơn phải được hoàn tất phục vụ (Served) hoặc hủy bỏ (Cancelled).
              Hệ thống chặn xuất hóa đơn khi còn món đang chờ chế biến.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Settlement controls on Left, 80mm preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Calculation & Settlement (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Order Details Card */}
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-5 shadow-xl">
            <h2 className="font-serif font-bold text-base text-neutral-100 mb-4 flex items-center justify-between">
              <span>Bảng kê chi tiết món ăn (Bàn {receiptData.tableNumber})</span>
              <span className="text-xs font-mono text-neutral-400">
                {orderItems.length} món
              </span>
            </h2>

            <div className="divide-y divide-dark-border">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-100">{item.name}</span>
                    <span className="text-neutral-400">x{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-200">
                      {item.total.toLocaleString('vi-VN')}đ
                    </span>
                    <Badge variant="served" className="text-[10px] py-0 px-1.5">
                      Đã phục vụ
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="mt-5 pt-4 border-t border-dark-border space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Tạm tính (Subtotal):</span>
                <span className="font-mono text-neutral-200">
                  {subtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Phí phục vụ (5% Service Charge):</span>
                <span className="font-mono text-neutral-200">
                  {serviceCharge.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Thuế GTGT (10% VAT):</span>
                <span className="font-mono text-neutral-200">
                  {vat.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Cấn trừ tiền cọc đã nộp (Deposit):</span>
                <span className="font-mono">
                  -{depositDeducted.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-gold-400 pt-3 border-t border-dark-border">
                <span>TỔNG TIỀN PHẢI THU:</span>
                <span className="font-mono text-xl text-gold-300">
                  {finalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-dark-surface rounded-2xl border border-dark-border p-5 shadow-xl">
            <h3 className="font-serif font-bold text-sm text-neutral-100 mb-3">
              Phương thức thanh toán
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('VietQR')}
                className={cn(
                  'cursor-pointer p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5',
                  paymentMethod === 'VietQR'
                    ? 'bg-gold-500/10 border-gold-500 text-gold-300 ring-1 ring-gold-500/30'
                    : 'bg-dark-card border-dark-border text-neutral-300 hover:border-neutral-700'
                )}
              >
                <QrCode className="w-5 h-5 text-gold-400" />
                <span className="text-xs font-bold">VietQR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={cn(
                  'cursor-pointer p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5',
                  paymentMethod === 'Card'
                    ? 'bg-gold-500/10 border-gold-500 text-gold-300 ring-1 ring-gold-500/30'
                    : 'bg-dark-card border-dark-border text-neutral-300 hover:border-neutral-700'
                )}
              >
                <CreditCard className="w-5 h-5 text-gold-400" />
                <span className="text-xs font-bold">Thẻ POS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={cn(
                  'cursor-pointer p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5',
                  paymentMethod === 'Cash'
                    ? 'bg-gold-500/10 border-gold-500 text-gold-300 ring-1 ring-gold-500/30'
                    : 'bg-dark-card border-dark-border text-neutral-300 hover:border-neutral-700'
                )}
              >
                <Banknote className="w-5 h-5 text-gold-400" />
                <span className="text-xs font-bold">Tiền mặt</span>
              </button>
            </div>

            {/* Settle Action Button */}
            <div className="mt-5">
              {isSettled ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Đã quyết toán hóa đơn thành công! Bàn chuyển sang dọn dẹp (Cleaning).
                </div>
              ) : (
                <Button
                  onClick={handleSettle}
                  disabled={hasIncompleteItems}
                  className="w-full py-3 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-neutral-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận thanh toán & Hoàn tất bàn
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 80mm Thermal Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 bg-dark-surface rounded-2xl border border-dark-border p-5 shadow-xl flex flex-col items-center">
          <div className="w-full text-center border-b border-dark-border pb-3 mb-4">
            <h3 className="font-serif font-bold text-sm text-neutral-100 flex items-center justify-center gap-1.5">
              <Printer className="w-4 h-4 text-gold-400" />
              Mô phỏng Phiếu In Nhiệt (Khổ 80mm)
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Máy in nhiệt quầy thu ngân • Kẹp sổ da kèm mã VietQR
            </p>
          </div>

          <ReceiptPreview80mm
            data={receiptData}
            onPrint={() => alert('Đã gửi lệnh in đến máy in nhiệt 80mm tại quầy thu ngân!')}
          />
        </div>
      </div>
    </div>
  )
}
export default CashierPage
