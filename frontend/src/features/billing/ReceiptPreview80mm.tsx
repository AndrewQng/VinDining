import React from 'react'
import { Printer, QrCode } from 'lucide-react'
import { Button } from '@/components/ui'

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
  courseType?: string
}

export interface ReceiptData {
  invoiceNumber: string
  tableNumber: string
  waitstaffName: string
  guestCount: number
  issuedAt: string
  items: ReceiptItem[]
  subtotal: number
  serviceCharge: number // 5%
  vat: number // 10%
  depositDeducted: number
  finalAmount: number
  vietQrUrl?: string
}

interface ReceiptPreview80mmProps {
  data: ReceiptData
  onPrint?: () => void
}

export const ReceiptPreview80mm: React.FC<ReceiptPreview80mmProps> = ({ data, onPrint }) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* 80mm Thermal Receipt Simulation Container (approx 320px width) */}
      <div className="w-[320px] bg-white text-neutral-900 font-mono text-xs p-5 rounded-md shadow-2xl border border-neutral-300 select-none">
        {/* Header */}
        <div className="text-center border-b border-dashed border-neutral-400 pb-3 mb-3">
          <h2 className="font-bold text-sm tracking-wider uppercase text-neutral-950">
            VINDINING RESTAURANT
          </h2>
          <p className="text-[11px] text-neutral-600">Fine Dining Experience</p>
          <p className="text-[10px] text-neutral-500 mt-1">
            Tầng 48, Tòa nhà Vincom Center, TP. Hồ Chí Minh
          </p>
          <p className="text-[10px] text-neutral-500">Hotline: 1900 888 999</p>
        </div>

        {/* Invoice Info */}
        <div className="border-b border-dashed border-neutral-400 pb-2 mb-2 text-[11px] leading-tight space-y-1">
          <div className="flex justify-between">
            <span className="text-neutral-600">Số HĐ:</span>
            <span className="font-bold">{data.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Bàn:</span>
            <span className="font-bold text-neutral-950">{data.tableNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Nhân viên:</span>
            <span>{data.waitstaffName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Số khách:</span>
            <span>{data.guestCount} người</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Thời gian in:</span>
            <span>{data.issuedAt}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b border-dashed border-neutral-400 pb-2 mb-2">
          <div className="flex justify-between font-bold text-[11px] mb-1 pb-1 border-b border-neutral-200">
            <span className="w-1/2">Tên món</span>
            <span className="w-1/6 text-center">SL</span>
            <span className="w-1/3 text-right">T.Tiền</span>
          </div>
          <div className="space-y-1.5">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px] leading-tight">
                <span className="w-1/2 pr-1 truncate font-medium">{item.name}</span>
                <span className="w-1/6 text-center text-neutral-600">x{item.quantity}</span>
                <span className="w-1/3 text-right">{item.total.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Calculation */}
        <div className="border-b border-dashed border-neutral-400 pb-2 mb-2 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-neutral-600">Tạm tính:</span>
            <span>{data.subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Phí phục vụ (5%):</span>
            <span>{data.serviceCharge.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Thuế VAT (10%):</span>
            <span>{data.vat.toLocaleString('vi-VN')}đ</span>
          </div>
          {data.depositDeducted > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Đã trừ tiền cọc:</span>
              <span>-{data.depositDeducted.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-neutral-300 text-neutral-950">
            <span>TỔNG THANH TOÁN:</span>
            <span className="text-base text-red-700">
              {data.finalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* VietQR Code Area */}
        <div className="text-center pt-1 pb-2">
          <p className="text-[10px] text-neutral-600 mb-1 font-semibold uppercase">
            Quét mã VietQR thanh toán
          </p>
          <div className="w-32 h-32 mx-auto bg-neutral-100 border border-neutral-300 rounded flex flex-col items-center justify-center p-2">
            <QrCode className="w-20 h-20 text-neutral-800" />
            <span className="text-[9px] text-neutral-500 mt-1 font-mono">MBBank • VINDINING</span>
          </div>
          <p className="text-[9px] text-neutral-500 mt-2 italic">
            Cảm ơn Quý khách & Hẹn gặp lại!
          </p>
        </div>
      </div>

      {/* Print Action Trigger */}
      <div className="mt-4 flex gap-3">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          <span>In Phiếu Thu Ngân (80mm)</span>
        </Button>
      </div>
    </div>
  )
}
export default ReceiptPreview80mm
