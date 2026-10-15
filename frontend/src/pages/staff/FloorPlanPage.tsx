import { useState } from 'react'
import {
  Users,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  FileText,
  Filter,
} from 'lucide-react'
import type { Table, TableStatus, TableZone } from '@/types/table'
import { cn } from '@/lib/utils'

export function FloorPlanPage() {
  const [selectedZone, setSelectedZone] = useState<TableZone | 'All'>('All')
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | 'All'>('All')

  const initialTables: Table[] = [
    {
      id: 't1',
      tableNumber: 'M01',
      capacity: 2,
      zone: 'MainHall',
      status: 'Occupied',
      currentOrderId: 'ord_101',
      assignedWaitstaffName: 'Nguyễn Văn Phục Vụ',
    },
    {
      id: 't2',
      tableNumber: 'M02',
      capacity: 4,
      zone: 'MainHall',
      status: 'Available',
    },
    {
      id: 't3',
      tableNumber: 'M03',
      capacity: 4,
      zone: 'MainHall',
      status: 'Reserved',
      assignedWaitstaffName: 'Lê Thị Thu',
    },
    {
      id: 't4',
      tableNumber: 'M04',
      capacity: 6,
      zone: 'MainHall',
      status: 'Cleaning',
    },
    {
      id: 't5',
      tableNumber: 'VIP01',
      capacity: 8,
      zone: 'VIP',
      status: 'Occupied',
      currentOrderId: 'ord_102',
      assignedWaitstaffName: 'Nguyễn Văn Phục Vụ',
    },
    {
      id: 't6',
      tableNumber: 'VIP02',
      capacity: 10,
      zone: 'VIP',
      status: 'Available',
    },
    {
      id: 't7',
      tableNumber: 'B01',
      capacity: 2,
      zone: 'Balcony',
      status: 'Reserved',
    },
    {
      id: 't8',
      tableNumber: 'B02',
      capacity: 2,
      zone: 'Balcony',
      status: 'Available',
    },
    {
      id: 't9',
      tableNumber: 'T01',
      capacity: 4,
      zone: 'Terrace',
      status: 'Available',
    },
  ]

  const [tables, setTables] = useState<Table[]>(initialTables)

  const handleUpdateStatus = (tableId: string, newStatus: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
    )
  }

  const statusColorMap: Record<TableStatus, { bg: string; text: string; border: string; label: string }> = {
    Available: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'Sẵn Sàng (Available)',
    },
    Occupied: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-gold-500/40',
      label: 'Đang Phục Vụ (Occupied)',
    },
    Reserved: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      label: 'Đã Đặt Cọc (Reserved)',
    },
    Cleaning: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      label: 'Đang Dọn Dẹp (Cleaning)',
    },
    LockedForPayment: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      label: 'Chờ Thanh Toán',
    },
  }

  const filteredTables = tables.filter((t) => {
    const matchZone = selectedZone === 'All' || t.zone === selectedZone
    const matchStatus = selectedStatus === 'All' || t.status === selectedStatus
    return matchZone && matchStatus
  })

  // Counters
  const countAvailable = tables.filter((t) => t.status === 'Available').length
  const countOccupied = tables.filter((t) => t.status === 'Occupied').length
  const countReserved = tables.filter((t) => t.status === 'Reserved').length
  const countCleaning = tables.filter((t) => t.status === 'Cleaning').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Sơ Đồ Bàn Phục Vụ Thời Gian Thực</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Theo dõi vị trí bàn, tình trạng ca ăn và kích hoạt nhận khách / gọi món trực tiếp.
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium whitespace-nowrap">
            Trống: <strong>{countAvailable}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium whitespace-nowrap">
            Đang ăn: <strong>{countOccupied}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium whitespace-nowrap">
            Đã đặt: <strong>{countReserved}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium whitespace-nowrap">
            Chờ dọn: <strong>{countCleaning}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-dark-surface border border-dark-border">
        {/* Zone Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-neutral-400 px-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Khu vực:
          </span>
          {(['All', 'MainHall', 'VIP', 'Balcony', 'Terrace'] as const).map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={cn(
                'cursor-pointer px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                selectedZone === z
                  ? 'bg-gold-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-dark-card'
              )}
            >
              {z === 'All' ? 'Tất Cả' : z}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['All', 'Available', 'Occupied', 'Reserved', 'Cleaning'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={cn(
                'cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                selectedStatus === s
                  ? 'bg-neutral-200 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-dark-card'
              )}
            >
              {s === 'All' ? 'Tất Cả Trạng Thái' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTables.map((table) => {
          const config = statusColorMap[table.status]
          return (
            <div
              key={table.id}
              className={cn(
                'rounded-2xl border bg-dark-surface/90 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg',
                config.border
              )}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center font-black text-sm text-gold-400">
                      {table.tableNumber}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-200">{table.zone}</p>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-neutral-500" />
                        <span>Sức chứa: {table.capacity} khách</span>
                      </p>
                    </div>
                  </div>

                  <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold border', config.bg, config.text, config.border)}>
                    {config.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-neutral-400 mb-4 bg-dark-card/50 p-2.5 rounded-xl border border-dark-border/60">
                  {table.assignedWaitstaffName && (
                    <p className="flex justify-between">
                      <span>Phục vụ phụ trách:</span>
                      <strong className="text-neutral-300 font-medium">{table.assignedWaitstaffName}</strong>
                    </p>
                  )}
                  {table.currentOrderId && (
                    <p className="flex justify-between">
                      <span>Mã đơn Order:</span>
                      <strong className="text-gold-400 font-mono">{table.currentOrderId}</strong>
                    </p>
                  )}
                  {!table.assignedWaitstaffName && !table.currentOrderId && (
                    <p className="text-neutral-500 italic">Bàn trống sẵn sàng đón khách</p>
                  )}
                </div>
              </div>

              {/* Action Buttons based on status */}
              <div className="pt-2 border-t border-dark-border/60 flex items-center gap-2">
                {table.status === 'Available' && (
                  <button
                    onClick={() => handleUpdateStatus(table.id, 'Occupied')}
                    className="cursor-pointer flex-1 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Mở Bàn & Đón Khách</span>
                  </button>
                )}

                {table.status === 'Occupied' && (
                  <>
                    <button className="cursor-pointer flex-1 py-2 rounded-xl bg-dark-card hover:bg-dark-card-hover border border-dark-border text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gold-400" />
                      <span>Xem / Thêm Món</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(table.id, 'Cleaning')}
                      className="cursor-pointer px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <span>Tính Tiền</span>
                    </button>
                  </>
                )}

                {table.status === 'Reserved' && (
                  <button
                    onClick={() => handleUpdateStatus(table.id, 'Occupied')}
                    className="cursor-pointer flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check-in Khách Đặt Cọc</span>
                  </button>
                )}

                {table.status === 'Cleaning' && (
                  <button
                    onClick={() => handleUpdateStatus(table.id, 'Available')}
                    className="cursor-pointer flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Xác Nhận Đã Dọn Xong</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FloorPlanPage
