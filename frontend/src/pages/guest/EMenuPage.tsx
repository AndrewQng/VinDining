import { useState } from 'react'
import { Sparkles, Utensils, Wine, Cake, ShieldAlert } from 'lucide-react'
import type { CourseType, MenuItem } from '@/types/menu'

export function EMenuPage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseType | 'All'>('All')

  const menuItems: MenuItem[] = [
    {
      id: 'm1',
      name: 'Hokkaido Scallop Carpaccio',
      vietnameseName: 'Sò Điệp Hokkaido Ướp Lạnh Sốt Cam Bergamot',
      description: 'Sò điệp tươi nhập khẩu Hokkaido, dầu oliu nguyên chất, trứng cá tầm Caviar Oscietra và nhũ vàng 24K.',
      price: 450000,
      categoryName: 'Hải Sản Cao Cấp',
      courseType: 'Appetizer',
      allergens: ['Hải sản có vỏ'],
      isAvailable: true,
      preparationTimeMinutes: 12,
    },
    {
      id: 'm2',
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
      id: 'm3',
      name: 'Wagyu A5 Kagoshima Tenderloin',
      vietnameseName: 'Thịt Thăn Bò Wagyu A5 Kagoshima Nướng Than Binchotan',
      description: 'Bò Wagyu A5 vân mỡ BMS 11, nướng than hoa Binchotan Nhật Bản, muối hồng Himalaya và tỏi đen lên men.',
      price: 1850000,
      categoryName: 'Bò Thượng Hạng',
      courseType: 'MainCourse',
      allergens: [],
      isAvailable: true,
      preparationTimeMinutes: 25,
    },
    {
      id: 'm4',
      name: 'Chilean Seabass en Papillote',
      vietnameseName: 'Cá Tuyết Chile Nướng Giấy Bạc Sốt Nhụy Hoa Nghệ Tây',
      description: 'Cá tuyết Chile đại dương sâu, nước hầm hải sản Bouillabaisse và nhụy hoa nghệ tây Saffron Iran.',
      price: 1200000,
      categoryName: 'Cá Biển Sâu',
      courseType: 'MainCourse',
      allergens: ['Cá'],
      isAvailable: true,
      preparationTimeMinutes: 20,
    },
    {
      id: 'm5',
      name: 'Valrhona Grand Cru Soufflé',
      vietnameseName: 'Bánh Soufflé Sô-cô-la Valrhona 70% & Kem Vani Madagascar',
      description: 'Bánh phồng Soufflé nướng nóng chảy cacao Valrhona Guanaja, phục vụ kèm kem Gelato vani tươi nguyên quả.',
      price: 320000,
      categoryName: 'Tráng Miệng',
      courseType: 'Dessert',
      allergens: ['Trứng', 'Sữa', 'Gluten'],
      isAvailable: true,
      preparationTimeMinutes: 18,
    },
    {
      id: 'm6',
      name: 'Château Margaux Premier Grand Cru 2015',
      vietnameseName: 'Vang Đỏ Château Margaux Grand Cru',
      description: 'Niên vụ 2015 xuất sắc, hương thơm phức hợp lý chua đen, hoa violet, tuyết tùng và tannin mượt như nhung.',
      price: 24500000,
      categoryName: 'Vang Grand Cru',
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
          Mỗi đĩa món là một tác phẩm nghệ thuật vị giác do Bếp trưởng dày công sáng tạo, phục vụ theo nhịp điệu Course Fine Dining.
        </p>
      </div>

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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dark-border/60 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-dark-card text-neutral-400 border border-dark-border">
                {dish.categoryName} &bull; {dish.preparationTimeMinutes} phút chế biến
              </span>

              {dish.allergens.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Dị ứng: {dish.allergens.join(', ')}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EMenuPage
