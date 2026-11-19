import { describe, expect, it } from 'vitest'
import { createInitialMockDb } from '@/services/mock/seed'
import type { TableZone } from '@/types'
import {
  buildUnitRoom,
  getGuestTableSurface,
  LABEL_BAND,
  layoutGuestRoom,
  rotateRectCw,
  ZONE_LANDMARKS,
  type Rect,
} from './guestRoomLayout'

const tablesOf = (zone: TableZone) =>
  createInitialMockDb().tables.filter((t) => t.zone === zone && t.isActive)

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

describe('guest floor plan layout (G1.2)', () => {
  it('draws one chair per seat for every table size', () => {
    for (let capacity = 1; capacity <= 10; capacity += 1) {
      const room = buildUnitRoom([{ id: 't', capacity, posX: 100, posY: 100 }], ZONE_LANDMARKS.VIP)
      expect(room.tables[0].chairs, `capacity ${capacity}`).toHaveLength(capacity)
    }
    expect(getGuestTableSurface(2).round).toBe(true)
    expect(getGuestTableSurface(8).w).toBeGreaterThan(getGuestTableSurface(4).w)
  })

  it('lays Sảnh chính out as two rows along the window with an aisle between them', () => {
    const layout = layoutGuestRoom(tablesOf('MainHall'), ZONE_LANDMARKS.MainHall, 688, 520)
    expect(layout.orientation).toBe('landscape')
    expect(layout.tables).toHaveLength(8)
    const byNumber = Object.fromEntries(layout.tables.map((p) => [p.table.tableNumber, p]))
    for (const [a, b] of [
      ['B01', 'B05'],
      ['B04', 'B08'],
    ]) {
      expect(byNumber[a].cy).toBeLessThan(byNumber[b].cy)
    }
    expect(byNumber.B01.cx).toBeLessThan(byNumber.B04.cx)
    expect(layout.wall?.label).toBe('Cửa sổ')
    expect(layout.aisle).not.toBeNull()
    expect(layout.aisle!.line.y).toBeGreaterThan(byNumber.B01.box.y + byNumber.B01.box.h)
    expect(layout.aisle!.line.y).toBeLessThan(byNumber.B05.box.y)
  })

  it.each(['MainHall', 'VIP', 'Balcony'] as TableZone[])(
    'keeps every %s table inside the room and apart from the others at desktop and phone sizes',
    (zone) => {
      for (const [w, h] of [
        [688, 520],
        [316, 440],
        [296, 300],
      ]) {
        const layout = layoutGuestRoom(tablesOf(zone), ZONE_LANDMARKS[zone], w, h)
        expect(layout.width).toBeLessThanOrEqual(w + 0.5)
        expect(layout.height).toBeLessThanOrEqual(h + 0.5)
        const { room } = layout
        for (const p of layout.tables) {
          expect(p.box.x).toBeGreaterThanOrEqual(room.x)
          expect(p.box.y).toBeGreaterThanOrEqual(room.y)
          expect(p.box.x + p.box.w).toBeLessThanOrEqual(room.x + room.w + 0.01)
          expect(p.box.y + p.box.h).toBeLessThanOrEqual(room.y + room.h + 0.01)
        }
        for (let i = 0; i < layout.tables.length; i += 1) {
          for (let j = i + 1; j < layout.tables.length; j += 1) {
            expect(overlaps(layout.tables[i].box, layout.tables[j].box)).toBe(false)
          }
        }
      }
    }
  )

  it('turns a wide room to portrait on a phone, window on the right and numbers top to bottom', () => {
    const layout = layoutGuestRoom(tablesOf('MainHall'), ZONE_LANDMARKS.MainHall, 316, 440)
    expect(layout.orientation).toBe('portrait')
    const landscape = layoutGuestRoom(tablesOf('MainHall'), ZONE_LANDMARKS.MainHall, 316, 440, {
      orientation: 'landscape',
      scale: Math.min(316 / buildUnitRoom(tablesOf('MainHall'), ZONE_LANDMARKS.MainHall).width, 1),
    })
    expect(layout.scale).toBeGreaterThan(landscape.scale)

    const n = Object.fromEntries(layout.tables.map((p) => [p.table.tableNumber, p]))
    expect(n.B01.cy).toBeLessThan(n.B02.cy)
    expect(n.B02.cy).toBeLessThan(n.B04.cy)
    expect(n.B05.cy).toBeLessThan(n.B08.cy)
    // Window side (B01–B04) is the right column, the aisle side the left one.
    expect(n.B01.cx).toBeGreaterThan(n.B05.cx)
    expect(layout.wall!.line.w).toBe(0)
    expect(layout.wall!.line.x).toBeCloseTo(layout.width - LABEL_BAND, 0)
    // Rotated tables keep their chairs inside the footprint.
    for (const p of layout.tables) {
      for (const c of p.chairs) {
        expect(c.x).toBeGreaterThanOrEqual(-0.01)
        expect(c.y).toBeGreaterThanOrEqual(-0.01)
        expect(c.x + c.w).toBeLessThanOrEqual(p.box.w + 0.01)
        expect(c.y + c.h).toBeLessThanOrEqual(p.box.h + 0.01)
      }
    }
  })

  it('rotates rects clockwise', () => {
    expect(rotateRectCw({ x: 10, y: 0, w: 20, h: 5 }, 100)).toEqual({ x: 95, y: 10, w: 5, h: 20 })
  })
})
