import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UtensilsCrossed,
  Plus,
  CreditCard,
  Search,
  CheckCircle2,
  Flame,
  AlertCircle,
} from 'lucide-react'
import { CourseFiringBar } from '@/features/ordering'
import type { CourseType, MenuItem } from '@/types/menu'
import { Button, Badge } from '@/components/ui'

interface TableOrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  courseType: CourseType
  status: 'Hold' | 'Fired' | 'Cooking' | 'Ready' | 'Served'
  notes?: string
}

export function WaitstaffOrderPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()

  // Sample catalog for Waitstaff to add dishes
  const sampleCatalog: MenuItem[] = [
    {
      id: 'm1',
      name: 'Hokkaido Scallop Carpaccio',
      vietnameseName: 'Súp Bào Ngư Hải Sâm & Sò Điệp',
      description: 'Sò điệp Hokkaido áp chảo, xốt nấm truffle đen và trứng cá tầm caviar.',
      price: 350000,
      courseType: 'Appetizer',
      categoryName: 'Hải Sản Cao Cấp',
      allergens: ['Hải sản có vỏ'],
      isAvailable: true,
      preparationTimeMinutes: 10,
    },
    {
      id: 'm2',
      name: 'Foie Gras Poêlé au Truffle',
      vietnameseName: 'Gan Ngỗng Áp Chảo Sốt Truffle',
      description: 'Gan ngỗng Pháp áp chảo hoàn hảo, bánh mì Brioche nướng bơ tỏi.',
      price: 680000,
      courseType: 'Appetizer',
      categoryName: 'Món Khai Vị',
      allergens: ['Gluten', 'Sữa'],
      isAvailable: true,
      preparationTimeMinutes: 15,
    },
    {
      id: 'm3',
      name: 'Bò Wagyu A5 Nướng Than Binchotan',
      vietnameseName: 'Thịt Thăn Bò Wagyu A5 Kagoshima',
      description: 'Bò Wagyu A5 vân mỡ BMS 11 nướng than hoa Binchotan Nhật Bản.',
      price: 1200000,
      courseType: 'MainCourse',
      categoryName: 'Bò Thượng Hạng',
      allergens: [],
      isAvailable: true,
      preparationTimeMinutes: 25,
    },
    {
      id: 'm4',
      name: 'Cá Tuyết Nam Cực Hấp Rượu Vang Trắng',
      vietnameseName: 'Cá Tuyết Patagonian Áp Chảo',
      description: 'Cá tuyết áp chảo da giòn, sốt bơ chanh vàng và măng tây Pháp.',
      price: 850000,
      courseType: 'MainCourse',
      categoryName: 'Hải Sản Cao Cấp',
      allergens: ['Cá'],
      isAvailable: true,
      preparationTimeMinutes: 20,
    },
    {
      id: 'm5',
      name: 'Chocolate Valrhona Soufflé',
      vietnameseName: 'Bánh Soufflé Sô-cô-la Valrhona',
      description: 'Soufflé sô-cô-la đen Valrhona Guanaja 70% ăn kèm kem Vanilla.',
      price: 250000,
      courseType: 'Dessert',
      categoryName: 'Tráng Miệng',
      allergens: ['Trứng', 'Sữa'],
      isAvailable: true,
      preparationTimeMinutes: 15,
    },
  ]

  // Existing table items
  const [items, setItems] = useState<TableOrderItem[]>([
    {
      id: 'it1',
      name: 'Hokkaido Scallop Carpaccio',
      quantity: 2,
      unitPrice: 350000,
      courseType: 'Appetizer',
      status: 'Cooking',
      notes: 'Không tiêu đen',
    },
    {
      id: 'it2',
      name: 'Foie Gras Poêlé au Truffle',
      quantity: 2,
      unitPrice: 680000,
      courseType: 'Appetizer',
      status: 'Cooking',
    },
    {
      id: 'it3',
      name: 'Bò Wagyu A5 Nướng Than Binchotan',
      quantity: 2,
      unitPrice: 1200000,
      courseType: 'MainCourse',
      status: 'Hold',
      notes: 'Nướng Medium Rare',
    },
    {
      id: 'it4',
      name: 'Chocolate Valrhona Soufflé',
      quantity: 2,
      unitPrice: 250000,
      courseType: 'Dessert',
      status: 'Hold',
    },
  ])

  // New items drawer/modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All')

  // Course Firing state
  const coursesStatus = [
    {
      courseType: 'Appetizer' as CourseType,
      title: '1. Khai vị (Appetizer)',
      isFired: true,
      status: 'Cooking' as const,
      itemCount: items.filter((i) => i.courseType === 'Appetizer').length,
    },
    {
      courseType: 'MainCourse' as CourseType,
      title: '2. Món chính (Main Course)',
      isFired: items.some((i) => i.courseType === 'MainCourse' && i.status !== 'Hold'),
      status: items.some((i) => i.courseType === 'MainCourse' && i.status !== 'Hold')
        ? ('Cooking' as const)
        : ('Hold' as const),
      itemCount: items.filter((i) => i.courseType === 'MainCourse').length,
    },
    {
      courseType: 'Dessert' as CourseType,
      title: '3. Tráng miệng (Dessert)',
      isFired: items.some((i) => i.courseType === 'Dessert' && i.status !== 'Hold'),
      status: items.some((i) => i.courseType === 'Dessert' && i.status !== 'Hold')
        ? ('Cooking' as const)
        : ('Hold' as const),
      itemCount: items.filter((i) => i.courseType === 'Dessert').length,
    },
  ]

  const handleFireCourse = (courseType: CourseType) => {
    setItems((prev) =>
      prev.map((i) =>
        i.courseType === courseType && i.status === 'Hold'
          ? { ...i, status: 'Cooking' }
          : i
      )
    )
  }

  const handleAddDish = (dish: MenuItem) => {
    const newItem: TableOrderItem = {
      id: `it_${Date.now()}`,
      name: dish.name,
      quantity: 1,
      unitPrice: dish.price,
      courseType: dish.courseType,
      status: dish.courseType === 'Appetizer' ? 'Cooking' : 'Hold',
    }
    setItems((prev) => [...prev, newItem])
    setIsAddOpen(false)
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const serviceCharge = Math.round(subtotal * 0.05)
  const vat = Math.round((subtotal + serviceCharge) * 0.1)
  const deposit = 500000 // mock deposit
  const total = Math.max(0, subtotal + serviceCharge + vat - deposit)

  const filteredCatalog = sampleCatalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.vietnameseName?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false)
    const matchesCourse =
      selectedCourseFilter === 'All' || item.courseType === selectedCourseFilter
    return matchesSearch && matchesCourse
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
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
              Bàn {tableId || 'M01'} — Đơn gọi món
              <Badge variant="occupied">Đang phục vụ</Badge>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Phục vụ: Nguyễn Văn Phục Vụ • 2 Khách • Cọc: 500.000đ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Món / Rượu</span>
          </Button>

          <Button
            onClick={() => navigate(`/cashier?tableId=${tableId || 't1'}`)}
            variant="outline"
            className="flex items-center gap-2 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
          >
            <CreditCard className="w-4 h-4" />
            <span>Tính tiền (Thu ngân)</span>
          </Button>
        </div>
      </div>

      {/* Course Firing Management */}
      <CourseFiringBar
        orderId="ord_101"
        activeCourses={coursesStatus}
        onFireCourse={handleFireCourse}
      />

      {/* Items List grouped by Course */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden shadow-xl">
        <div className="p-4 bg-dark-card border-b border-dark-border flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-neutral-100 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-gold-400" />
            Danh sách món đã gửi ({items.length} món)
          </h2>
          <span className="text-xs text-neutral-400">
            Trạng thái hiển thị theo thời gian thực SignalR
          </span>
        </div>

        <div className="divide-y divide-dark-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-dark-card/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-neutral-100">{item.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-dark-bg text-neutral-300 border border-dark-border">
                    {item.courseType}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Ghi chú: {item.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <span className="text-neutral-400 text-sm">
                  {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')}đ
                </span>
                <span className="font-bold text-neutral-100 text-sm font-mono w-28 text-right">
                  {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                </span>

                <div className="w-32 text-right">
                  {item.status === 'Hold' && (
                    <Badge variant="outline">Đang giữ (HOLD)</Badge>
                  )}
                  {item.status === 'Cooking' && (
                    <Badge variant="preparing" className="flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-current" />
                      Đang nấu
                    </Badge>
                  )}
                  {item.status === 'Ready' && (
                    <Badge variant="available">Chờ Pass ra bàn</Badge>
                  )}
                  {item.status === 'Served' && (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã phục vụ
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="p-5 bg-dark-card border-t border-dark-border">
          <div className="max-w-md ml-auto space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Tạm tính (Subtotal):</span>
              <span className="font-mono text-neutral-200">
                {subtotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Phí dịch vụ (5% Service Charge):</span>
              <span className="font-mono text-neutral-200">
                {serviceCharge.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Thuế GTGT (10% VAT):</span>
              <span className="font-mono text-neutral-200">{vat.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Đã cấn trừ tiền cọc (Deposit):</span>
              <span className="font-mono">-{deposit.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gold-400 pt-2 border-t border-dark-border">
              <span>TỔNG DỰ KIẾN:</span>
              <span className="font-mono">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Items Modal Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-neutral-100">
                  Thêm món vào đơn bàn {tableId || 'M01'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Chọn món từ thực đơn A La Carte hoặc Tasting Menu
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="cursor-pointer text-neutral-400 hover:text-neutral-100 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-dark-border flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên món..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-gold-500"
              >
                <option value="All">Tất cả Course</option>
                <option value="Appetizer">Khai vị</option>
                <option value="MainCourse">Món chính</option>
                <option value="Dessert">Tráng miệng</option>
              </select>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredCatalog.map((dish) => (
                <div
                  key={dish.id}
                  className="p-3 rounded-xl bg-dark-card border border-dark-border hover:border-gold-500/40 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-sm text-neutral-100">{dish.name}</h4>
                    <p className="text-xs text-neutral-400">{dish.vietnameseName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-gold-400">
                        {dish.price.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-dark-bg text-neutral-400 border border-dark-border">
                        {dish.courseType}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddDish(dish)}
                    className="flex items-center gap-1 text-xs bg-gold-600 hover:bg-gold-500 text-neutral-950 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default WaitstaffOrderPage
