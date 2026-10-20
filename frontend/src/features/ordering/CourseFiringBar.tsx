import React from 'react'
import { Flame, CheckCircle, Clock } from 'lucide-react'
import type { CourseType } from '@/types/menu'
import { cn } from '@/lib/utils'

interface CourseFiringBarProps {
  orderId: string
  activeCourses: {
    courseType: CourseType
    title: string
    isFired: boolean
    status: 'Hold' | 'Fired' | 'Cooking' | 'Ready' | 'Served'
    itemCount: number
  }[]
  onFireCourse: (courseType: CourseType) => void
  disabled?: boolean
}

export const CourseFiringBar: React.FC<CourseFiringBarProps> = ({
  activeCourses,
  onFireCourse,
  disabled = false,
}) => {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-gold-400" />
          <h3 className="font-serif font-bold text-neutral-100 text-sm">
            Điều phối Course Firing (Nhịp dùng bữa)
          </h3>
        </div>
        <span className="text-xs text-neutral-400">
          Kích hoạt khi khách dùng 60-70% đợt trước
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {activeCourses.map((c) => {
          const isHold = c.status === 'Hold' || !c.isFired
          const isServed = c.status === 'Served'

          return (
            <div
              key={c.courseType}
              className={cn(
                'flex flex-col justify-between p-3.5 rounded-xl border transition-all',
                isServed
                  ? 'bg-neutral-900/60 border-neutral-800 opacity-75'
                  : isHold
                    ? 'bg-dark-surface border-dark-border hover:border-gold-500/50'
                    : 'bg-amber-950/20 border-amber-500/30 ring-1 ring-amber-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-neutral-100">{c.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-dark-bg text-neutral-300 font-medium">
                  {c.itemCount} món
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs mb-3">
                {isServed ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Đã phục vụ xong
                  </span>
                ) : isHold ? (
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Trạng thái: Đang giữ (HOLD)
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Bếp đang nấu...
                  </span>
                )}
              </div>

              {isHold && !isServed && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onFireCourse(c.courseType)}
                  className="cursor-pointer py-2 px-3 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Bắn lệnh nấu ({c.title})
                </button>
              )}

              {!isHold && !isServed && (
                <div className="text-center py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  Đã phát tín hiệu KDS
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default CourseFiringBar
