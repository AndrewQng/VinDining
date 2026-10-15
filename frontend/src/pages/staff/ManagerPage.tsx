import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, AlertCircle, Check, X, ShieldAlert } from 'lucide-react'

interface RefundRequest {
  id: string
  guestName: string
  tableNumber: string
  depositAmount: number
  reason: string
  requestTime: string
}

export function ManagerPage() {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([
    {
      id: 'ref_01',
      guestName: 'Nguyễn Thái Sơn',
      tableNumber: 'VIP01',
      depositAmount: 4000000,
      reason: 'Sự cố chuyến bay trễ đột xuất, gửi thông báo trước giờ hẹn 3 tiếng (dưới 4 tiếng).',
      requestTime: '15 phút trước',
    },
  ])

  const handleApproveRefund = (id: string) => {
    alert('Đã phê duyệt hoàn cọc ngoại lệ thành công.')
    setRefundRequests((prev) => prev.filter((r) => r.id !== id))
  }

  const handleRejectRefund = (id: string) => {
    alert('Đã từ chối hoàn cọc, tiền cọc sẽ được tịch thu theo quy định.')
    setRefundRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <span>Bảng Điều Khiển Quản Trị & Vận Hành (Manager Dashboard)</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Theo dõi tổng quan tài chính ca ăn, tỷ lệ lấp đầy bàn và phê duyệt hoàn cọc ngoại lệ.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Doanh Thu Tạm Tính</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-neutral-100 font-mono">48.650.000 đ</p>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +18% so với ca hôm qua
          </span>
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Tiền Cọc Đã Cấn Trừ</span>
            <DollarSign className="w-4 h-4 text-gold-400" />
          </div>
          <p className="text-2xl font-black text-gold-400 font-mono">12.500.000 đ</p>
          <span className="text-[11px] text-neutral-400 mt-1 block">Tự động trừ 100% vào hóa đơn</span>
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Tỷ Lệ Lấp Đầy Bàn</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-neutral-100 font-mono">82%</p>
          <span className="text-[11px] text-blue-400 font-medium mt-1 block">8 / 10 bàn đang phục vụ</span>
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Yêu Cầu Hoàn Cọc Chờ Duyệt</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{refundRequests.length}</p>
          <span className="text-[11px] text-amber-400/90 font-medium mt-1 block">Ngoại lệ thẩm quyền Manager</span>
        </div>
      </div>

      {/* Exception Refund Approvals Section */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
        <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Phê Duyệt Hoàn Cọc Ngoại Lệ (Manager Approval)</span>
        </h2>

        {refundRequests.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">
            Hiện không có yêu cầu hoàn cọc ngoại lệ nào cần xử lý.
          </p>
        ) : (
          <div className="space-y-3">
            {refundRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-dark-border bg-dark-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-neutral-100 text-sm">{req.guestName}</span>
                    <span className="px-2 py-0.5 rounded bg-dark-surface text-gold-400 text-xs font-mono font-semibold">
                      {req.tableNumber}
                    </span>
                    <span className="text-xs text-neutral-400">({req.requestTime})</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-1">
                    Lý do: <span className="text-neutral-300 italic">{req.reason}</span>
                  </p>
                  <p className="text-xs font-bold text-gold-400 font-mono">
                    Số tiền đề xuất hoàn: {req.depositAmount.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveRefund(req.id)}
                    className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Duyệt Hoàn Cọc</span>
                  </button>
                  <button
                    onClick={() => handleRejectRefund(req.id)}
                    className="cursor-pointer px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Từ Chối</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerPage
