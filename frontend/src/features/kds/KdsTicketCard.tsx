import React from 'react'
import { Flame, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KdsItem {
  id: string
  name: string
  quantity: number
  courseType: string
  status: 'Hold' | 'Fired' | 'Cooking' | 'Ready' | 'Remake'
  isRush?: boolean
  notes?: string | null
}

export interface KdsTicket {
  orderId: string
  tableNumber: string
  courseType: string
  waitstaffName: string
  elapsedMinutes: number
  items: KdsItem[]
  isRush?: boolean
}

interface KdsTicketCardProps {
  ticket: KdsTicket
  onStartCooking?: (orderId: string, itemId: string) => void
  onMarkReady?: (orderId: string, itemId: string) => void
  onCompleteCourse?: (orderId: string, courseType: string) => void
}

export const KdsTicketCard: React.FC<KdsTicketCardProps> = ({
  ticket,
  onStartCooking,
  onMarkReady,
  onCompleteCourse,
}) => {
  const isUrgent = ticket.isRush || ticket.elapsedMinutes > 20
  const isWarning = ticket.elapsedMinutes > 12 && !isUrgent

  return (
    <div
      className={cn(
        'flex flex-col bg-dark-surface rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg',
        ticket.isRush
          ? 'border-red-500 shadow-red-950/40 ring-1 ring-red-500/50'
          : isUrgent
            ? 'border-amber-500 shadow-amber-950/30'
            : 'border-dark-border'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'p-3 px-4 flex items-center justify-between border-b',
          ticket.isRush
            ? 'bg-red-500/20 border-red-500/30'
            : 'bg-dark-card border-dark-border'
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-black text-xl text-neutral-100">
            {ticket.tableNumber}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-dark-bg/60 text-gold-400 border border-gold-500/20">
            {ticket.courseType}
          </span>
          {ticket.isRush && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-current" />
              RUSH / LÀM LẠI
            </span>
          )}
        </div>

        {/* Elapsed Timer */}
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-lg',
            isUrgent
              ? 'bg-red-500/30 text-red-300'
              : isWarning
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-neutral-800 text-neutral-300'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{ticket.elapsedMinutes}m</span>
        </div>
      </div>

      {/* Waitstaff & Info Bar */}
      <div className="px-4 py-1.5 bg-dark-bg/40 text-[11px] text-neutral-400 border-b border-dark-border/50 flex justify-between">
        <span>Phục vụ: {ticket.waitstaffName}</span>
        <span>{ticket.items.length} món</span>
      </div>

      {/* Items list */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[360px]">
        {ticket.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-2',
              item.status === 'Ready'
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : item.status === 'Cooking'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : item.isRush
                    ? 'bg-red-950/20 border-red-500/30'
                    : 'bg-dark-card/60 border-dark-border/60'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-100 text-sm">
                  {item.quantity}x
                </span>
                <span className="font-medium text-neutral-200 text-sm truncate">
                  {item.name}
                </span>
              </div>

              {item.notes && (
                <div className="mt-1 flex items-start gap-1 text-amber-300 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>{item.notes}</span>
                </div>
              )}
            </div>

            {/* Quick Actions per Item */}
            <div className="flex items-center gap-1.5 shrink-0">
              {item.status === 'Hold' && (
                <span className="px-2 py-1 text-[11px] rounded bg-neutral-800 text-neutral-400">
                  Chờ bắn lệnh
                </span>
              )}
              {item.status === 'Fired' && (
                <button
                  onClick={() => onStartCooking?.(ticket.orderId, item.id)}
                  className="cursor-pointer px-2.5 py-1 text-xs rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-neutral-950 transition-colors"
                >
                  Nấu
                </button>
              )}
              {item.status === 'Cooking' && (
                <button
                  onClick={() => onMarkReady?.(ticket.orderId, item.id)}
                  className="cursor-pointer px-2.5 py-1 text-xs rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Xong
                </button>
              )}
              {item.status === 'Ready' && (
                <span className="px-2 py-1 text-xs rounded-lg font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Chờ Pass
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Footer Action */}
      <div className="p-3 bg-dark-card border-t border-dark-border">
        <button
          onClick={() => onCompleteCourse?.(ticket.orderId, ticket.courseType)}
          className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          Hoàn tất món / Pass Station
        </button>
      </div>
    </div>
  )
}
export default KdsTicketCard
