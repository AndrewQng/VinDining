import { useState } from 'react'
import {
  ChefHat,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { KdsTicketCard, type KdsTicket } from '@/features/kds'
import { useTestingOverview, useSeedSampleData } from '@/hooks/useTestingData'
import { Button } from '@/components/ui'

export function KitchenKdsPage() {
  const { refetch } = useTestingOverview()
  const seedMutation = useSeedSampleData()

  // Local state tickets representing the live kitchen display queue
  const [tickets, setTickets] = useState<KdsTicket[]>([
    {
      orderId: 'ord_101',
      tableNumber: 'M01',
      courseType: 'Khai Vị (Appetizer)',
      waitstaffName: 'Nguyễn Văn Phục Vụ',
      elapsedMinutes: 9,
      isRush: false,
      items: [
        {
          id: 'k1',
          name: 'Hokkaido Scallop Carpaccio',
          quantity: 2,
          courseType: 'Appetizer',
          status: 'Cooking',
          notes: 'Không tiêu đen, chia 2 đĩa riêng',
        },
        {
          id: 'k2',
          name: 'Foie Gras Poêlé au Truffle',
          quantity: 2,
          courseType: 'Appetizer',
          status: 'Cooking',
        },
      ],
    },
    {
      orderId: 'ord_102',
      tableNumber: 'V02',
      courseType: 'Món Chính (Main Course)',
      waitstaffName: 'Trần Thị Thu',
      elapsedMinutes: 4,
      isRush: true,
      items: [
        {
          id: 'k3',
          name: 'Bò Wagyu A5 Nướng Than Binchotan',
          quantity: 2,
          courseType: 'MainCourse',
          status: 'Cooking',
          isRush: true,
          notes: 'REMAKE: Đĩa trước bị nguội sốt. Nướng Medium-Rare chuẩn.',
        },
      ],
    },
    {
      orderId: 'ord_103',
      tableNumber: 'M04',
      courseType: 'Tráng Miệng (Dessert)',
      waitstaffName: 'Lê Hoàng Nam',
      elapsedMinutes: 2,
      isRush: false,
      items: [
        {
          id: 'k4',
          name: 'Chocolate Valrhona Soufflé',
          quantity: 3,
          courseType: 'Dessert',
          status: 'Fired',
          notes: 'Ăn kèm kem Vanilla Bourbon',
        },
      ],
    },
  ])

  const handleStartCooking = (_orderId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) => (i.id === itemId ? { ...i, status: 'Cooking' } : i)),
      }))
    )
  }

  const handleMarkReady = (_orderId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) => (i.id === itemId ? { ...i, status: 'Ready' } : i)),
      }))
    )
  }

  const handleCompleteCourse = (orderId: string, _courseType: string) => {
    setTickets((prev) => prev.filter((t) => t.orderId !== orderId))
  }

  const totalCooking = tickets.reduce(
    (acc, t) => acc + t.items.filter((i) => i.status === 'Cooking').length,
    0
  )
  const totalRush = tickets.filter((t) => t.isRush).length

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-neutral-100 flex items-center gap-2">
                Màn hình KDS Bếp (Kitchen Display)
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SignalR Live
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Màn hình cảm ứng / rảnh tay hỗ trợ điều phối chế biến theo Course Firing
              </p>
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-4 h-4 fill-current" />
              <span>{totalCooking} món đang nấu</span>
            </div>
            <span className="text-neutral-600">|</span>
            <div className="flex items-center gap-1 text-red-400 font-bold">
              <Clock className="w-4 h-4" />
              <span>{totalRush} vé RUSH</span>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="cursor-pointer p-2.5 rounded-xl bg-dark-card hover:bg-dark-card-hover border border-dark-border text-neutral-300 transition-colors"
            title="Làm mới hàng đợi"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-gold-400 border-gold-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nạp vé test</span>
          </Button>
        </div>
      </div>

      {/* Ticket Grid */}
      {tickets.length === 0 ? (
        <div className="text-center py-20 bg-dark-surface rounded-2xl border border-dark-border">
          <ChefHat className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-300">
            Bếp hiện tại đang trống vé
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Khi nhân viên phát tín hiệu Course Firing từ bàn, các món sẽ tự động hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickets.map((ticket) => (
            <KdsTicketCard
              key={`${ticket.orderId}-${ticket.courseType}`}
              ticket={ticket}
              onStartCooking={handleStartCooking}
              onMarkReady={handleMarkReady}
              onCompleteCourse={handleCompleteCourse}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default KitchenKdsPage
