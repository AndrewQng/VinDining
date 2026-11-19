export const FLOOR_CANVAS_W = 680
export const FLOOR_CANVAS_H = 580
export const FLOOR_SNAP_GRID = 20

export interface FloorPlanTableBase {
  id: string
  capacity: number
  posX: number
  posY: number
}

export interface TableGeometry {
  width: number
  height: number
  shapeClass: string
}

/** Resolves physical table dimensions and shape from seat count. */
export function getTableGeometry(capacity: number): TableGeometry {
  if (capacity <= 2) {
    return { width: 98, height: 88, shapeClass: 'rounded-full' }
  }
  if (capacity <= 4) {
    return { width: 114, height: 94, shapeClass: 'rounded-xl' }
  }
  if (capacity <= 6) {
    return { width: 130, height: 100, shapeClass: 'rounded-xl' }
  }
  return { width: 138, height: 106, shapeClass: 'rounded-2xl' }
}

/** Clamps table coordinates inside the logical canvas bounds for its seat-count geometry. */
export function getClampedTablePosition(
  table: FloorPlanTableBase,
  canvasW = FLOOR_CANVAS_W,
  canvasH = FLOOR_CANVAS_H
): { left: number; top: number } & TableGeometry {
  const geom = getTableGeometry(table.capacity)
  const left = Math.min(canvasW - geom.width - 16, Math.max(16, table.posX))
  const top = Math.min(canvasH - geom.height - 16, Math.max(16, table.posY))
  return { left, top, ...geom }
}
