import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
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
 * M2 editor canvas: tables at their canonical 680x580 coordinates, scaled down to the container width.
 * The guest picker (G1.2) draws the same coordinates through `GuestRoomPlan`.
 */
export function FloorPlanCanvas<T extends FloorPlanTableBase>({
  tables,
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

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / FLOOR_CANVAS_W) : 1

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      onPointerMove={
        onPointerMove ? (e) => onPointerMove(e, scale) : undefined
      }
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-line bg-bg',
        className
      )}
      style={{ height: `${Math.round(FLOOR_CANVAS_H * scale)}px` }}
    >
      <div
        className="relative"
        style={{
          width: `${FLOOR_CANVAS_W}px`,
          height: `${FLOOR_CANVAS_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundImage: showGrid
            ? 'radial-gradient(circle, var(--line-strong) 1px, transparent 1px)'
            : undefined,
          backgroundSize: showGrid ? `${snapGrid}px ${snapGrid}px` : undefined,
        }}
      >
        {tables.map((table) => {
          const pos = getClampedTablePosition(table)
          return renderTable(table, { ...pos, scale })
        })}
      </div>
    </div>
  )
}
