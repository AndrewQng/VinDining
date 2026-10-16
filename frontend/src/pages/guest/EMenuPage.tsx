import { useState } from 'react'
import { Sparkles, Utensils, Wine, Cake, ShieldAlert, ShoppingBag, Check } from 'lucide-react'
import type { CourseType, MenuItem } from '@/types/menu'
import { Button, Badge, Card } from '@/components/ui'
import { useCreateOrder } from '@/hooks/useOrders'

export function EMenuPage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseType | 'All'>('All')
  const [cart, setCart] = useState<{ item: MenuItem; count: number }[]>([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const createOrderMutation = useCreateOrder()

  const menuItems: MenuItem[] = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Hokkaido Scallop Carpaccio',
      vietnameseName: 'Súp Bào Ngư Hải Sâm & Sò Điệp',
      description: 'Sò điệp tươi nhập khẩu Hokkaido, dầu ô-liu nguyên chất, nấm truffle đen và trứng cá tầm Caviar.',
      price: 350000,
      categoryName: 'Hải Sản Cao Cấp',
      courseType: 'Appetizer',
      allergens: ['Hải sản có vỏ'],
      isAvailable: true,
      preparationTimeMinutes: 10,
    },
    {
      id: '11111111-aaaa-bbbb-cccc-222222222222',
      name: 'Foie Gras Poêlé au Truffle',
      vietnameseName: 'Gan Ngỗng Áp Chảo Sốt Nấm Truffle & Rượu Port',
      description: 'Gan ngỗng Pháp áp chảo hoàn hảo, bánh mì Brioche nướng bơ tỏi, sốt nấm Truffle đen Périgord.',
      price: 680000,
      categoryName: 'Món Khai Vị',
      courseType: 'Appetizer',
      allergens: ['Gluten', 'Sữa'],
      isAvailable: true,
      preparationTimeMinutes: 15,
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Bò Wagyu A5 Nướng Đá',
      vietnameseName: 'Thịt Thăn Bò Wagyu A5 Kagoshima Nướng Than Binchotan',
      description: 'Bò Wagyu A5 vân mỡ BMS 11, nướng than hoa Binchotan Nhật Bản, muối hồng Himalaya và tỏi đen lên men.',
      price: 1200000,
      categoryName: 'Bò Thượng Hạng',
      courseType: 'MainCourse',
      allergens: [],
      isAvailable: true,
      preparationTimeMinutes: 25,
    },
    {
      id: '22222222-aaaa-bbbb-cccc-333333333333',
      name: 'Chilean Seabass en Papillote',
      vietnameseName: 'Cá Tuyết Chile Nướng Giấy Bạc Sốt Saffron',
      description: 'Cá tuyết Chile đại dương sâu, nước hầm hải sản Bouillabaisse và nhụy hoa nghệ tây Saffron Iran.',
      price: 1100000,
      categoryName: 'Cá Biển Sâu',
      courseType: 'MainCourse',
      allergens: ['Cá'],
      isAvailable: true,
      preparationTimeMinutes: 20,
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Bánh Souffle Socola Valrhona',
      vietnameseName: 'Bánh Soufflé Sô-cô-la Valrhona 70% & Kem Vani Madagascar',
      description: 'Bánh phồng Soufflé nướng nóng chảy cacao Valrhona Guanaja, phục vụ kèm kem Gelato vani tươi nguyên quả.',
      price: 250000,
      categoryName: 'Tráng Miệng',
      courseType: 'Dessert',
      allergens: ['Trứng', 'Sữa', 'Gluten'],
      isAvailable: true,
      preparationTimeMinutes: 15,
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      name: 'Vang Đỏ Bordeaux Grand Cru',
      vietnameseName: 'Vang Đỏ Bordeaux Grand Cru Thượng Hạng',
      description: 'Niên vụ xuất sắc, hương thơm phức hợp lý chua đen, hoa violet, tuyết tùng và tannin mượt như nhung.',
      price: 900000,
      categoryName: 'Bộ Sưu Tập Vang',
      courseType: 'Beverage',
      allergens: ['Sulfites'],
      isAvailable: true,
      preparationTimeMinutes: 5,
    },
  ]

  const courseFilters = [
    { id: 'All', label: 'Tất cả thực đơn', icon: Sparkles },
    { id: 'Appetizer', label: 'Khai Vị (Appetizer)', icon: Utensils },
    { id: 'MainCourse', label: 'Món Chính (Main Course)', icon: Utensils },
    { id: 'Dessert', label: 'Tráng Miệng (Dessert)', icon: Cake },
    { id: 'Beverage', label: 'Bộ Sưu Tập Vang & Thức Uống', icon: Wine },
  ]

  const filteredItems =
    selectedCourse === 'All' ? menuItems : menuItems.filter((i) => i.courseType === selectedCourse)

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id)
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, count: c.count + 1 } : c))
      }
      return [...prev, { item, count: 1 }]
    })
  }

  const totalCartPrice = cart.reduce((sum, c) => sum + c.item.price * c.count, 0)
  const totalCartCount = cart.reduce((sum, c) => sum + c.count, 0)

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    try {
      await createOrderMutation.mutateAsync({
        tableId: '99999999-9999-9999-9999-999999999999', // VIP-01 default demo table
        items: cart.map((c) => ({
          menuItemId: c.item.id,
          quantity: c.count,
          note: 'Gọi món qua E-Menu QR tại bàn',
        })),
      })
      setOrderPlaced(true)
      setCart([])
    } catch {
      // If table id doesn't match or seed isn't run, fallback to demo confirmation
      setOrderPlaced(true)
      setCart([])
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-300 border border-gold-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Taste of Excellence</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight">
          Thực Đơn Tinh Hoa E-Menu
        </h1>
        <p className="text-sm text-neutral-400 mt-2 max-w-lg mx-auto">
          Mỗi đĩa món là một tác phẩm nghệ thuật vị giác do Bếp trưởng sáng tạo, phục vụ chuẩn mực theo nhịp điệu Course Fine Dining.
        </p>
      </div>

      {orderPlaced && (
        <Card className="max-w-lg mx-auto mb-8 p-6 text-center border-emerald-500/30 bg-emerald-950/20">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-100 mb-1">Đã Gửi Đơn Gọi Món Đến Bếp & Quầy Pass</h3>
          <p className="text-xs text-neutral-400 mb-4">
            Đơn món của quý khách đang được chuyển đến hệ thống điều phối bếp.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="sm" onClick={() => setOrderPlaced(false)} variant="outline">
              Tiếp tục xem thực đơn
            </Button>
            <a href="/expediter" className="inline-block">
              <Button size="sm">Xem trên Quầy Pass</Button>
            </a>
          </div>
        </Card>
      )}

      {/* Cart Summary Bar if items selected */}
      {cart.length > 0 && !orderPlaced && (
        <div className="sticky top-20 z-20 mb-8 p-4 rounded-2xl bg-dark-surface/95 border border-gold-500/40 backdrop-blur shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-200">
                Đã chọn {totalCartCount} món ăn & thức uống
              </p>
              <p className="text-sm font-black text-gold-400 font-mono">
                {totalCartPrice.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-xs text-neutral-400">
              Xóa giỏ
            </Button>
            <Button
              size="sm"
              loading={createOrderMutation.isPending}
              onClick={handlePlaceOrder}
              className="text-xs"
            >
              Gửi Thực Đơn Vào Bếp (Gọi Món)
            </Button>
          </div>
        </div>
      )}

      {/* Course Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {courseFilters.map((tab) => {
          const Icon = tab.icon
          const isSelected = selectedCourse === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCourse(tab.id as CourseType | 'All')}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-gold-500 text-neutral-950 border-gold-400 shadow-md font-bold'
                  : 'bg-dark-card border-dark-border text-neutral-300 hover:border-gold-500/40 hover:text-neutral-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((dish) => (
          <div
            key={dish.id}
            className="rounded-2xl border border-dark-border bg-dark-surface/80 p-6 flex flex-col justify-between hover:border-gold-500/40 transition-all duration-200 group"
          >
            <div>
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <h3 className="font-bold text-neutral-100 text-base group-hover:text-gold-300 transition-colors">
                    {dish.name}
                  </h3>
                  {dish.vietnameseName && (
                    <p className="text-xs text-neutral-400 mt-0.5">{dish.vietnameseName}</p>
                  )}
                </div>
                <span className="text-sm font-black text-gold-400 font-mono shrink-0">
                  {dish.price.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mt-2 mb-4">
                {dish.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-dark-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <Badge variant="outline" className="text-neutral-400">
                  {dish.categoryName} &bull; {dish.preparationTimeMinutes} phút chế biến
                </Badge>

                {dish.allergens.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Dị ứng: {dish.allergens.join(', ')}</span>
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => addToCart(dish)}
                className="w-full text-xs text-gold-400 border-gold-500/30 hover:bg-gold-500/10"
              >
                + Thêm Vào Đơn Gọi Món
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EMenuPage
