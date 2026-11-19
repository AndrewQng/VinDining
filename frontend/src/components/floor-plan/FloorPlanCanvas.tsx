import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  FLOOR_CANVAS_H,
  FLOOR_CANVAS_W,
  FLOOR_SNAP_GRID,
  getClampedTablePosition,
  type FloorPlanTableBase,
} from './floorPlanGeometry'

export interface FloorPlanCanvasProps<T extends FloorPlanTableBase> {
  tables: T[]
  fitContent?: boolean
  showGrid?: boolean
  snapGrid?: number
  role?: string
  ariaLabel?: string
  className?: string
  onPointerMove?: (e: PointerEvent<HTMLDivElement>, scale: number) => void
  onPointerUp?: () => void
  onPointerLeave?: () => void
  renderTable: (
    table: T,
    layout: { left: number; top: number; width: number; height: number; shapeClass: string; scale: number }
  ) => ReactNode
}

/**
 * Shared responsive 2D floor plan canvas used by both Manager M2 editor and Guest G1 booking.
 * Renders tables at their canonical posX/posY coordinates and scales proportionally to fit narrow screens.
 */
export function FloorPlanCanvas<T extends FloorPlanTableBase>({
  tables,
  fitContent = false,
  showGrid = false,
  snapGrid = FLOOR_SNAP_GRID,
  role,
  ariaLabel,
  className,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  renderTable,
}: FloorPlanCanvasProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setContainerWidth(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? el.clientWidth
      setContainerWidth(nextWidth)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { logicalW, logicalH } = useMemo(() => {
    if (!fitContent || tables.length === 0) {
      return { logicalW: FLOOR_CANVAS_W, logicalH: FLOOR_CANVAS_H }
    }
    let maxRight = 0
    let maxBottom = 0
    for (const t of tables) {
      const pos = getClampedTablePosition(t)
      maxRight = Math.max(maxRight, pos.left + pos.width)
      maxBottom = Math.max(maxBottom, pos.top + pos.height)
    }
    return {
      logicalW: Math.min(FLOOR_CANVAS_W, Math.max(400, maxRight + 32)),
      logicalH: Math.min(FLOOR_CANVAS_H, Math.max(300, maxBottom + 32)),
    }
  }, [fitContent, tables])

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / logicalW) : 1
  const scaledHeight = Math.round(logicalH * scale)

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      onPointerMove={onPointerMove ? (e) => onPointerMove(e, scale) : undefined}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-line bg-bg',
        className
      )}
      style={{ height: `${scaledHeight}px` }}
    >
      <div
        className="relative"
        style={{
          width: `${logicalW}px`,
          height: `${logicalH}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundImage: showGrid
            ? 'radial-gradient(circle, var(--line-strong) 1px, transparent 1px)'
            : undefined,
          backgroundSize: showGrid ? `${snapGrid}px ${snapGrid}px` : undefined,
        }}
      >
        {tables.map((table) => {
          const layout = getClampedTablePosition(table)
          return renderTable(table, { ...layout, scale })
        })}
      </div>
    </div>
  )
}
