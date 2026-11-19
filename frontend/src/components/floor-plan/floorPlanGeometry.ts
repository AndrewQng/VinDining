export const FLOOR_CANVAS_W = 680
export const FLOOR_CANVAS_H = 580
export const FLOOR_SNAP_GRID = 20

const FIT_PADDING = 28
const FIT_MAX_SCALE = 1.6
const FIT_MAX_HEIGHT = 620

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

export interface FittedFloorTransform {
  scale: number
  contentWidth: number
  contentHeight: number
  scaledWidth: number
  scaledHeight: number
  offsetX: number
  originX: number
  originY: number
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

/** Computes bounding-box view transform (scale + horizontal centering) without mutating M2 coordinates. */
export function computeFittedFloorTransform(
  tables: readonly FloorPlanTableBase[],
  containerWidth: number
): FittedFloorTransform {
  if (tables.length === 0) {
    const scale = containerWidth > 0 ? Math.min(1, containerWidth / FLOOR_CANVAS_W) : 1
    const scaledWidth = Math.round(FLOOR_CANVAS_W * scale)
    return {
      scale,
      contentWidth: FLOOR_CANVAS_W,
      contentHeight: FLOOR_CANVAS_H,
      scaledWidth,
      scaledHeight: Math.round(FLOOR_CANVAS_H * scale),
      offsetX: Math.max(0, Math.round((containerWidth - scaledWidth) / 2)),
      originX: 0,
      originY: 0,
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const table of tables) {
    const pos = getClampedTablePosition(table)
    minX = Math.min(minX, pos.left)
    minY = Math.min(minY, pos.top)
    maxX = Math.max(maxX, pos.left + pos.width)
    maxY = Math.max(maxY, pos.top + pos.height)
  }

  const contentWidth = maxX - minX + FIT_PADDING * 2
  const contentHeight = maxY - minY + FIT_PADDING * 2
  const availableW = containerWidth > 0 ? containerWidth : contentWidth
  const scale = Math.min(
    FIT_MAX_SCALE,
    availableW / contentWidth,
    FIT_MAX_HEIGHT / contentHeight
  )
  const scaledWidth = Math.round(contentWidth * scale)
  const scaledHeight = Math.round(contentHeight * scale)
  const offsetX =
    containerWidth > 0
      ? Math.max(0, Math.round((containerWidth - scaledWidth) / 2))
      : 0

  return {
    scale,
    contentWidth,
    contentHeight,
    scaledWidth,
    scaledHeight,
    offsetX,
    originX: minX - FIT_PADDING,
    originY: minY - FIT_PADDING,
  }
}
