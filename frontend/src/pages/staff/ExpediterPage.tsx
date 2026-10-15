import { useState } from 'react'
import { ChefHat, CheckCircle2, RotateCcw, AlertTriangle, Flame, BellRing } from 'lucide-react'
import type { OrderItem, OrderItemStatus } from '@/types/order'

interface ExpediterItem extends OrderItem {
  tableNumber: string
  waitstaffName: string
  elapsedMinutes: number
}

export function ExpediterPage() {
  const [items, setItems] = useState<ExpediterItem[]>([
    {
      id: 'oi_1',
      orderId: 'ord_101',
      tableNumber: 'M01',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      menuItemId: 'm1',
      menuItemName: 'Hokkaido Scallop Carpaccio',
      unitPrice: 450000,
      quantity: 2,
      courseType: 'Appetizer',
      status: 'Ready',
      specialInstructions: 'Không tiêu đen, chia 2 đĩa riêng',
      elapsedMinutes: 8,
    },
    {
      id: 'oi_2',
      orderId: 'ord_101',
      tableNumber: 'M01',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      menuItemId: 'm2',
      menuItemName: 'Foie Gras Poêlé au Truffle',
      unitPrice: 680000,
      quantity: 2,
      courseType: 'Appetizer',
      status: 'Cooking',
      elapsedMinutes: 12,
    },
    {
      id: 'oi_3',
      orderId: 'ord_102',
      tableNumber: 'VIP01',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      menuItemId: 'm3',
      menuItemName: 'Wagyu A5 Kagoshima Tenderloin',
      unitPrice: 1850000,
      quantity: 4,
      courseType: 'MainCourse',
      status: 'Ready',
      specialInstructions: 'Độ chín Medium Rare chuẩn xác',
      elapsedMinutes: 19,
    },
  ])

  const handleServe = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: 'Served' as OrderItemStatus, servedAtUtc: new Date().toISOString() }
          : i
      )
    )
  }

  const handleRemake = (itemId: string) => {
    const reason = prompt('Nhập lý do yêu cầu Bếp làm lại khẩn cấp (Remake):')
    if (!reason) return
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: 'Remake' as OrderItemStatus, remakeReason: reason }
          : i
      )
    )
  }

  const readyItems = items.filter((i) => i.status === 'Ready')
  const cookingItems = items.filter((i) => i.status === 'Cooking' || i.status === 'Remake')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <span>Màn Hình Quầy Pass Điều Phối (Expediter KDS)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Thẩm định tiêu chuẩn chất lượng đĩa món trước khi phát tín hiệu rung gọi phục vụ ra bàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
            <span>Đang chờ duyệt ra đĩa: {readyItems.length}</span>
          </span>
        </div>
      </div>

      {/* Grid: Ready for Pass Verification */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gold-400 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>1. Món Bếp Vừa Đẩy Lên Quầy Pass (Cần Thẩm Định)</span>
        </h2>

        {readyItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dark-border bg-dark-surface/50 text-center text-xs text-neutral-500">
            Hiện không có món nào đang chờ ở quầy Pass.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gold-500/40 bg-dark-surface p-5 shadow-lg relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-gold-500 text-neutral-950 font-black text-xs font-mono">
                        Bàn {item.tableNumber}
                      </span>
                      <span className="text-xs text-neutral-400">Phục vụ: {item.waitstaffName}</span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">{item.elapsedMinutes} phút trước</span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-100 mb-1">
                    {item.quantity}x {item.menuItemName}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-dark-card text-neutral-400 border border-dark-border">
                    Course: {item.courseType}
                  </span>

                  {item.specialInstructions && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{item.specialInstructions}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-dark-border flex gap-2">
                  <button
                    onClick={() => handleServe(item.id)}
                    className="cursor-pointer flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Đạt Chuẩn & Ra Món</span>
                  </button>

                  <button
                    onClick={() => handleRemake(item.id)}
                    className="cursor-pointer px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Làm Lại (Remake)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Cooking / In-Kitchen */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span>2. Món Đang Chế Biến Tại Nhà Bếp ({cookingItems.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cookingItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-dark-border bg-dark-surface/50 p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-dark-card font-mono text-xs font-bold text-gold-400">
                    Bàn {item.tableNumber}
                  </span>
                  <span className="text-xs font-medium text-neutral-300">
                    {item.quantity}x {item.menuItemName}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Course: {item.courseType} &bull; Phục vụ: {item.waitstaffName}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {item.status === 'Remake' ? 'Làm lại khẩn cấp' : 'Đang nấu'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExpediterPage
