import type { GuestTableAvailability, TableZone } from '@/types'
import { getClampedTablePosition, type FloorPlanTableBase } from './floorPlanGeometry'

/**
 * Guest floor plan geometry (G1.2). Tables keep the M2 editor's coordinate system:
 * a table's centre is the centre of its M2 box. Everything is computed in canvas
 * units first, then rotated (portrait) and scaled to pixels.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface RoomLandmarks {
  /** Label of the long wall drawn at the top of the room (before rotation). */
  wall?: string
  entrance: string
  aisle: boolean
}

export const ZONE_LANDMARKS: Record<TableZone, RoomLandmarks> = {
  MainHall: { wall: 'Cửa sổ', entrance: 'Lối vào', aisle: true },
  VIP: { entrance: 'Lối vào', aisle: false },
  Balcony: { wall: 'Lan can', entrance: 'Lối vào', aisle: false },
}

export const AISLE_LABEL = 'Lối đi'

export const GUEST_AVAILABILITY_LABELS: Record<GuestTableAvailability, string> = {
  available: 'Còn trống',
  taken: 'Đã có người đặt',
  tooSmall: 'Không đủ chỗ',
}

const CHAIR_W = 20
const CHAIR_D = 10
const CHAIR_GAP = 4
const CHAIR_BAND = CHAIR_GAP + CHAIR_D
const PAD_X = 28
const PAD_TOP = 28
const PAD_BOTTOM = 28
const ENTRANCE_INSET = 24
const ENTRANCE_W = 84
const ROW_TOLERANCE = 40
const MAX_SCALE = 1.2
const PORTRAIT_GAIN = 1.15

interface SurfaceSpec {
  w: number
  h: number
  round: boolean
  long: number
  ends: number
}

/** Table top size by seat count, in canvas units, plus how many chairs go on each long side and each end. */
export function getGuestTableSurface(capacity: number): SurfaceSpec {
  if (capacity <= 2) return { w: 64, h: 64, round: true, long: 1, ends: 0 }
  if (capacity <= 4) return { w: 88, h: 62, round: false, long: 2, ends: 0 }
  if (capacity <= 6) return { w: 118, h: 62, round: false, long: 3, ends: 0 }
  if (capacity <= 8) return { w: 146, h: 62, round: false, long: 4, ends: 0 }
  const long = Math.ceil((capacity - 2) / 2)
  return { w: 42 + long * 32, h: 66, round: false, long, ends: 1 }
}

export interface PlacedTable<T> {
  table: T
  /** Footprint (table + chairs) in room pixels. */
  box: Rect
  /** Table top, relative to `box`. */
  surface: Rect & { round: boolean }
  /** Chairs, relative to `box`. */
  chairs: Rect[]
  /** Centre in room pixels, used for arrow-key navigation. */
  cx: number
  cy: number
}

export interface RoomLayout<T> {
  orientation: 'landscape' | 'portrait'
  scale: number
  /** Outer size, label bands included. */
  width: number
  height: number
  /** The room's walls inside the outer box. */
  room: Rect
  tables: PlacedTable<T>[]
  wall: { label: string; line: Rect; labelX: number; labelY: number } | null
  aisle: { line: Rect; labelX: number; labelY: number } | null
  entrance: { label: string; gap: Rect; labelX: number; labelY: number }
}

interface UnitTable<T> {
  table: T
  cx: number
  cy: number
  fw: number
  fh: number
  surface: Rect & { round: boolean }
  chairs: Rect[]
}

function buildUnitTable<T extends FloorPlanTableBase>(table: T): UnitTable<T> {
  const m2 = getClampedTablePosition(table)
  const cx = m2.left + m2.width / 2
  const cy = m2.top + m2.height / 2
  const spec = getGuestTableSurface(table.capacity)
  const fw = spec.w + (spec.ends ? CHAIR_BAND * 2 : 0)
  const fh = spec.h + CHAIR_BAND * 2
  const sx = spec.ends ? CHAIR_BAND : 0
  const surface = { x: sx, y: CHAIR_BAND, w: spec.w, h: spec.h, round: spec.round }

  const chairs: Rect[] = []
  const topCount = spec.round ? 1 : spec.long
  const bottomCount = spec.round
    ? Math.min(1, table.capacity - 1)
    : Math.min(spec.long, table.capacity - topCount - spec.ends * 2)
  const place = (count: number, y: number) => {
    for (let i = 0; i < count; i += 1) {
      const centre = sx + ((i + 0.5) * spec.w) / count
      chairs.push({ x: centre - CHAIR_W / 2, y, w: CHAIR_W, h: CHAIR_D })
    }
  }
  place(topCount, 0)
  place(Math.max(0, bottomCount), fh - CHAIR_D)
  if (spec.ends) {
    const y = CHAIR_BAND + spec.h / 2 - CHAIR_W / 2
    chairs.push({ x: 0, y, w: CHAIR_D, h: CHAIR_W })
    chairs.push({ x: fw - CHAIR_D, y, w: CHAIR_D, h: CHAIR_W })
  }

  return { table, cx, cy, fw, fh, surface, chairs }
}

interface UnitRoom<T> {
  width: number
  height: number
  tables: (UnitTable<T> & { box: Rect })[]
  wall: { label: string; line: Rect } | null
  aisle: { line: Rect; labelX: number; labelY: number } | null
  entrance: { label: string; gap: Rect; labelX: number; labelY: number }
}

/** Lays the zone out in canvas units, landscape, origin at the room's top-left corner. */
export function buildUnitRoom<T extends FloorPlanTableBase>(
  tables: readonly T[],
  landmarks: RoomLandmarks
): UnitRoom<T> {
  const units = tables.map(buildUnitTable)
  if (units.length === 0) {
    const width = 320
    const height = 200
    return {
      width,
      height,
      tables: [],
      wall: landmarks.wall ? { label: landmarks.wall, line: { x: 0, y: 0, w: width, h: 0 } } : null,
      aisle: null,
      entrance: {
        label: landmarks.entrance,
        gap: { x: ENTRANCE_INSET, y: height, w: ENTRANCE_W, h: 0 },
        labelX: ENTRANCE_INSET + ENTRANCE_W / 2,
        labelY: height - 14,
      },
    }
  }

  const minX = Math.min(...units.map((u) => u.cx - u.fw / 2))
  const maxX = Math.max(...units.map((u) => u.cx + u.fw / 2))
  const minY = Math.min(...units.map((u) => u.cy - u.fh / 2))
  const maxY = Math.max(...units.map((u) => u.cy + u.fh / 2))
  const width = Math.round(maxX - minX + PAD_X * 2)
  const height = Math.round(maxY - minY + PAD_TOP + PAD_BOTTOM)
  const ox = PAD_X - minX
  const oy = PAD_TOP - minY

  const placed = units.map((u) => ({
    ...u,
    cx: u.cx + ox,
    cy: u.cy + oy,
    box: { x: u.cx + ox - u.fw / 2, y: u.cy + oy - u.fh / 2, w: u.fw, h: u.fh },
  }))

  let aisle: UnitRoom<T>['aisle'] = null
  if (landmarks.aisle) {
    const rows: (typeof placed)[] = []
    for (const t of [...placed].sort((a, b) => a.cy - b.cy)) {
      const row = rows[rows.length - 1]
      if (row && Math.abs(row[0].cy - t.cy) <= ROW_TOLERANCE) row.push(t)
      else rows.push([t])
    }
    let best: { gap: number; y: number } | null = null
    for (let i = 0; i < rows.length - 1; i += 1) {
      const bottom = Math.max(...rows[i].map((t) => t.box.y + t.box.h))
      const top = Math.min(...rows[i + 1].map((t) => t.box.y))
      const gap = top - bottom
      if (gap > 24 && (!best || gap > best.gap)) best = { gap, y: (top + bottom) / 2 }
    }
    if (best) {
      aisle = {
        line: { x: 16, y: best.y, w: width - 32, h: 0 },
        labelX: width / 2,
        labelY: best.y,
      }
    }
  }

  return {
    width,
    height,
    tables: placed,
    wall: landmarks.wall ? { label: landmarks.wall, line: { x: 0, y: 0, w: width, h: 0 } } : null,
    aisle,
    entrance: {
      label: landmarks.entrance,
      gap: { x: ENTRANCE_INSET, y: height, w: ENTRANCE_W, h: 0 },
      labelX: ENTRANCE_INSET + ENTRANCE_W / 2,
      labelY: height - 14,
    },
  }
}

/**
 * Rotates a rect 90° clockwise inside a box of height `boxH` (y grows downwards):
 * the top wall ends up on the right, so table numbers still read top to bottom.
 */
export function rotateRectCw(r: Rect, boxH: number): Rect {
  return { x: boxH - (r.y + r.h), y: r.x, w: r.h, h: r.w }
}

function scaleRect(r: Rect, s: number): Rect {
  return { x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s }
}

/** Pixels kept outside the walls for the wall and entrance labels. */
export const LABEL_BAND = 20

/** Picks the orientation that gives the biggest tables inside `availW × availH` pixels. */
export function chooseRoomFit(
  room: { width: number; height: number },
  availW: number,
  availH: number,
  maxScale = MAX_SCALE
): { orientation: 'landscape' | 'portrait'; scale: number } {
  // Landscape keeps label bands above and below the room, portrait left and right.
  const landscape = Math.min(maxScale, availW / room.width, (availH - LABEL_BAND * 2) / room.height)
  const portrait = Math.min(maxScale, (availW - LABEL_BAND * 2) / room.height, availH / room.width)
  if (portrait > landscape * PORTRAIT_GAIN) {
    return { orientation: 'portrait', scale: portrait }
  }
  return { orientation: 'landscape', scale: landscape }
}

/** Full guest layout in pixels for one zone, label bands included. */
export function layoutGuestRoom<T extends FloorPlanTableBase>(
  tables: readonly T[],
  landmarks: RoomLandmarks,
  availW: number,
  availH: number,
  forced?: { orientation: 'landscape' | 'portrait'; scale: number }
): RoomLayout<T> {
  const room = buildUnitRoom(tables, landmarks)
  const fit = forced ?? chooseRoomFit(room, availW, availH)
  const s = Math.max(0.1, fit.scale)
  const portrait = fit.orientation === 'portrait'
  const offX = portrait ? LABEL_BAND : 0
  const offY = portrait ? 0 : LABEL_BAND

  const shift = (r: Rect): Rect => ({ ...r, x: r.x + offX, y: r.y + offY })
  const orientRect = (r: Rect) => shift(scaleRect(portrait ? rotateRectCw(r, room.height) : r, s))
  const orientPoint = (x: number, y: number) =>
    portrait
      ? { x: (room.height - y) * s + offX, y: x * s + offY }
      : { x: x * s + offX, y: y * s + offY }
  const orientLocal = (r: Rect, boxH: number) => scaleRect(portrait ? rotateRectCw(r, boxH) : r, s)

  const placed: PlacedTable<T>[] = room.tables.map((t) => {
    const c = orientPoint(t.cx, t.cy)
    const surfaceLocal = orientLocal(t.surface, t.fh)
    return {
      table: t.table,
      box: orientRect(t.box),
      surface: { ...surfaceLocal, round: t.surface.round },
      chairs: t.chairs.map((ch) => orientLocal(ch, t.fh)),
      cx: c.x,
      cy: c.y,
    }
  })

  const roomW = (portrait ? room.height : room.width) * s
  const roomH = (portrait ? room.width : room.height) * s
  const width = roomW + offX * 2
  const height = roomH + offY * 2
  const gap = orientRect(room.entrance.gap)
  const aisleLabel = room.aisle ? orientPoint(room.aisle.labelX, room.aisle.labelY) : null

  return {
    orientation: fit.orientation,
    scale: s,
    width,
    height,
    room: { x: offX, y: offY, w: roomW, h: roomH },
    tables: placed,
    wall: room.wall
      ? {
          label: room.wall.label,
          line: orientRect(room.wall.line),
          labelX: portrait ? width - LABEL_BAND / 2 : width / 2,
          labelY: portrait ? height / 2 : LABEL_BAND / 2,
        }
      : null,
    aisle:
      room.aisle && aisleLabel
        ? { line: orientRect(room.aisle.line), labelX: aisleLabel.x, labelY: aisleLabel.y }
        : null,
    entrance: {
      label: room.entrance.label,
      gap,
      labelX: portrait ? LABEL_BAND / 2 : gap.x + gap.w / 2,
      labelY: portrait ? gap.y + gap.h / 2 : height - LABEL_BAND / 2,
    },
  }
}
