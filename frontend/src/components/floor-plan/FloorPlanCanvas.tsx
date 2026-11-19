import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  FLOOR_CANVAS_H,
  FLOOR_CANVAS_W,
  FLOOR_SNAP_GRID,
  computeFittedFloorTransform,
  getClampedTablePosition,
  type FloorPlanTableBase,
} from './floorPlanGeometry'

export interface FloorPlanCanvasProps<T extends FloorPlanTableBase> {
  tables: T[]
  fit?: boolean
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
 * M2 keeps exact canonical 680x580 coordinates; G1 opts into `fit` to scale and center a zone's tables.
 */
export function FloorPlanCanvas<T extends FloorPlanTableBase>({
  tables,
  fit = false,
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

  const transform = useMemo(() => {
    if (fit) {
      return computeFittedFloorTransform(tables, containerWidth)
    }
    const scale =
      containerWidth > 0 ? Math.min(1, containerWidth / FLOOR_CANVAS_W) : 1
    const scaledWidth = Math.round(FLOOR_CANVAS_W * scale)
    return {
      scale,
      contentWidth: FLOOR_CANVAS_W,
      contentHeight: FLOOR_CANVAS_H,
      scaledWidth,
      scaledHeight: Math.round(FLOOR_CANVAS_H * scale),
      offsetX: 0,
      originX: 0,
      originY: 0,
    }
  }, [fit, tables, containerWidth])

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      onPointerMove={
        onPointerMove ? (e) => onPointerMove(e, transform.scale) : undefined
      }
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-line bg-bg',
        className
      )}
      style={{ height: `${transform.scaledHeight}px` }}
    >
      <div
        className="relative"
        style={{
          width: `${transform.contentWidth}px`,
          height: `${transform.contentHeight}px`,
          marginLeft: `${transform.offsetX}px`,
          transform: `scale(${transform.scale})`,
          transformOrigin: 'top left',
          backgroundImage: showGrid
            ? 'radial-gradient(circle, var(--line-strong) 1px, transparent 1px)'
            : undefined,
          backgroundSize: showGrid ? `${snapGrid}px ${snapGrid}px` : undefined,
        }}
      >
        {tables.map((table) => {
          const pos = getClampedTablePosition(table)
          return renderTable(table, {
            ...pos,
            left: pos.left - transform.originX,
            top: pos.top - transform.originY,
            scale: transform.scale,
          })
        })}
      </div>
    </div>
  )
}
