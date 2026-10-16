import { useState } from 'react'
import {
  ChefHat,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Flame,
  BellRing,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useTestingOverview, useSeedSampleData } from '@/hooks/useTestingData'
import { useServeItem, useRemakeItem } from '@/hooks/useOrders'
import { Button, Badge, Card } from '@/components/ui'

interface DisplayItem {
  id: string
  orderId: string
  tableNumber: string
  waitstaffName: string
  menuItemName: string
  unitPrice: number
  quantity: number
  courseType: string
  status: 'Ready' | 'Preparing' | 'Served' | 'Remake' | 'Hold'
  specialInstructions?: string | null
  isRush?: boolean
  elapsedMinutes: number
}

export function ExpediterPage() {
  const { data: serverData, isLoading: isLoadingServer } = useTestingOverview()
  const seedMutation = useSeedSampleData()
  const serveItemMutation = useServeItem()
  const remakeItemMutation = useRemakeItem()

  // Local fallback mock items if no orders in database yet
  const [localItems, setLocalItems] = useState<DisplayItem[]>([
    {
      id: '11111111-2222-3333-4444-555555555551',
      orderId: '00000000-0000-0000-0000-000000000001',
      tableNumber: 'M01',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      menuItemName: 'Hokkaido Scallop Carpaccio',
      unitPrice: 450000,
      quantity: 2,
      courseType: 'Appetizer',
      status: 'Ready',
      specialInstructions: 'Không tiêu đen, chia 2 đĩa riêng',
      elapsedMinutes: 8,
    },
    {
      id: '11111111-2222-3333-4444-555555555552',
      orderId: '00000000-0000-0000-0000-000000000001',
      tableNumber: 'M01',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      menuItemName: 'Foie Gras Poêlé au Truffle',
      unitPrice: 680000,
      quantity: 2,
      courseType: 'Appetizer',
      status: 'Preparing',
      elapsedMinutes: 12,
    },
    {
      id: '11111111-2222-3333-4444-555555555553',
      orderId: '00000000-0000-0000-0000-000000000002',
      tableNumber: 'VIP01',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      menuItemName: 'Wagyu A5 Kagoshima Tenderloin',
      unitPrice: 1850000,
      quantity: 4,
      courseType: 'MainCourse',
      status: 'Ready',
      specialInstructions: 'Độ chín Medium Rare chuẩn xác',
      elapsedMinutes: 19,
    },
  ])

  // Extract items from real server orders if available
  const serverItems: DisplayItem[] = []
  if (serverData?.recentOrders) {
    for (const order of serverData.recentOrders) {
      if (order.items) {
        for (const item of order.items) {
          const statusMap: Record<string, DisplayItem['status']> = {
            Hold: 'Hold',
            Preparing: 'Preparing',
            Served: 'Served',
            Cancelled: 'Hold',
          }
          const itemStatus = statusMap[item.status] || (item.isRush ? 'Remake' : 'Preparing')

          serverItems.push({
            id: item.id,
            orderId: order.id,
            tableNumber: order.tableNumber,
            waitstaffName: 'Nhân viên bàn',
            menuItemName: item.itemName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            courseType: 'Fine Dining Course',
            status: itemStatus,
            specialInstructions: item.note,
            isRush: item.isRush,
            elapsedMinutes: 5,
          })
        }
      }
    }
  }

  const items = serverItems.length > 0 ? serverItems : localItems

  const handleServe = async (item: DisplayItem) => {
    if (serverItems.length > 0) {
      try {
        await serveItemMutation.mutateAsync({
          orderId: item.orderId,
          itemId: item.id,
        })
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } }
        alert(errorObj.response?.data?.message || 'Lỗi khi xác nhận ra món')
      }
    } else {
      setLocalItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'Served' } : i))
      )
    }
  }

  const handleRemake = async (item: DisplayItem) => {
    const reason = prompt('Nhập lý do yêu cầu Bếp làm lại khẩn cấp (Remake):')
    if (!reason) return

    if (serverItems.length > 0) {
      try {
        await remakeItemMutation.mutateAsync({
          orderId: item.orderId,
          itemId: item.id,
          request: { reason },
        })
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } }
        alert(errorObj.response?.data?.message || 'Lỗi khi yêu cầu làm lại món')
      }
    } else {
      setLocalItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'Remake', isRush: true, specialInstructions: `Làm lại khẩn cấp: ${reason}` }
            : i
        )
      )
    }
  }

  const readyItems = items.filter((i) => i.status === 'Ready' || i.status === 'Preparing')
  const cookingItems = items.filter((i) => i.status === 'Hold' || i.status === 'Remake')

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
          {isLoadingServer && <Loader2 className="w-4 h-4 animate-spin text-gold-400" />}

          <Button
            variant="outline"
            size="sm"
            onClick={() => seedMutation.mutate()}
            loading={seedMutation.isPending}
            className="text-xs text-gold-300 border-gold-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Seed Sample Orders
          </Button>

          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
            <span>Chờ kiểm định: {readyItems.length}</span>
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
          <Card className="p-8 text-center text-xs text-neutral-500">
            Hiện không có món nào đang chờ ở quầy Pass.
          </Card>
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

                  <h3 className="text-base font-bold text-neutral-100 mb-1 flex items-center gap-2">
                    <span>
                      {item.quantity}x {item.menuItemName}
                    </span>
                    {item.isRush && (
                      <Badge variant="destructive" className="text-[10px] uppercase">
                        Rush Remake
                      </Badge>
                    )}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-dark-card text-neutral-400 border border-dark-border">
                    {item.courseType}
                  </span>

                  {item.specialInstructions && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{item.specialInstructions}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-dark-border flex gap-2">
                  <Button
                    onClick={() => handleServe(item)}
                    loading={serveItemMutation.isPending}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Xác Nhận Đạt Chuẩn & Ra Món</span>
                  </Button>

                  <Button
                    onClick={() => handleRemake(item)}
                    loading={remakeItemMutation.isPending}
                    variant="outline"
                    className="px-4 py-2.5 text-red-300 border-red-500/30 hover:bg-red-500/10 text-xs font-bold"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    <span>Làm Lại (Remake)</span>
                  </Button>
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
          <span>2. Món Đang Đợi Lệnh / Chế Biến Tại Nhà Bếp ({cookingItems.length})</span>
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
                  {item.courseType} &bull; Phục vụ: {item.waitstaffName}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {item.status === 'Remake' ? 'Làm lại khẩn cấp (Rush)' : 'Đang chờ (Hold)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExpediterPage
