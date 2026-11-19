import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import type { GuestTableAvailability } from '@/types'
import {
  AISLE_LABEL,
  GUEST_AVAILABILITY_LABELS,
  type PlacedTable, type Rect, type RoomLayout,
} from './guestRoomLayout'

export interface GuestPlanTable {
  id: string
  tableNumber: string
  capacity: number
  posX: number
  posY: number
  availability: GuestTableAvailability
  isSelectable: boolean
}

export interface GuestRoomPlanProps<T extends GuestPlanTable> {
  layout: RoomLayout<T>
  selectedId: string | null
  onSelect: (table: T) => void
  ariaLabel: string
}

const LABEL_FONT = 11
const LABEL_CHAR_W = 6.4

/** G1.2 guest floor plan: the room with its landmarks and one radio button per table. */
export function GuestRoomPlan<T extends GuestPlanTable>({
  layout,
  selectedId,
  onSelect,
  ariaLabel,
}: GuestRoomPlanProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const selectable = layout.tables.filter((p) => p.table.isSelectable)
  const tabStopId =
    (selectedId && selectable.some((p) => p.table.id === selectedId) && selectedId) ||
    selectable[0]?.table.id ||
    null

  const moveFocus = (from: PlacedTable<T>, e: KeyboardEvent<HTMLButtonElement>) => {
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }
    const dir = dirs[e.key]
    if (!dir) return
    e.preventDefault()
    let best: PlacedTable<T> | null = null
    let bestScore = Infinity
    for (const cand of selectable) {
      if (cand.table.id === from.table.id) continue
      const dx = cand.cx - from.cx
      const dy = cand.cy - from.cy
      const along = dx * dir[0] + dy * dir[1]
      if (along <= 1) continue
      const across = Math.abs(dx * dir[1] + dy * dir[0])
      const score = along + across * 2
      if (score < bestScore) {
        bestScore = score
        best = cand
      }
    }
    if (best) refs.current[best.table.id]?.focus()
  }

  const { width: W, height: H } = layout
  const portrait = layout.orientation === 'portrait'

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      data-testid="guest-room"
      data-orientation={layout.orientation}
      className="relative"
      style={{ width: `${W}px`, height: `${H}px` }}
    >
      <svg
        aria-hidden="true"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 overflow-visible"
      >
        <rect
          x={layout.room.x}
          y={layout.room.y}
          width={layout.room.w}
          height={layout.room.h}
          fill="var(--bg)"
        />
        <RoomWalls layout={layout} />
        {layout.wall && (
          <>
            <line
              x1={layout.wall.line.x}
              y1={layout.wall.line.y}
              x2={layout.wall.line.x + layout.wall.line.w}
              y2={layout.wall.line.y + layout.wall.line.h}
              stroke="var(--accent)"
              strokeOpacity={0.55}
              strokeWidth={4}
            />
            <PlanLabel
              text={layout.wall.label}
              x={layout.wall.labelX}
              y={layout.wall.labelY}
              vertical={portrait}
            />
          </>
        )}
        {layout.aisle && (
          <>
            <line
              x1={layout.aisle.line.x}
              y1={layout.aisle.line.y}
              x2={layout.aisle.line.x + layout.aisle.line.w}
              y2={layout.aisle.line.y + layout.aisle.line.h}
              stroke="var(--line-strong)"
              strokeDasharray="6 6"
            />
            <PlanLabel
              text={AISLE_LABEL}
              x={layout.aisle.labelX}
              y={layout.aisle.labelY}
              vertical={portrait}
              chip
            />
          </>
        )}
        <PlanLabel
          text={layout.entrance.label}
          x={layout.entrance.labelX}
          y={layout.entrance.labelY}
          vertical={portrait}
        />
      </svg>

      {layout.tables.map((p) => (
        <TableButton
          key={p.table.id}
          placed={p}
          selected={p.table.id === selectedId}
          tabbable={p.table.id === tabStopId}
          onSelect={onSelect}
          onArrow={moveFocus}
          buttonRef={(el) => {
            refs.current[p.table.id] = el
          }}
        />
      ))}
    </div>
  )
}

function RoomWalls({ layout }: { layout: RoomLayout<unknown> }) {
  const { x: X, y: Y, w: RW, h: RH } = layout.room
  const W = X + RW
  const H = Y + RH
  const g = layout.entrance.gap
  const stroke = { stroke: 'var(--line-strong)', strokeWidth: 2, fill: 'none' }
  // The entrance is a gap in the bottom wall (landscape) or the left wall (portrait).
  const onLeft = g.w === 0
  const d = onLeft
    ? `M ${X} ${g.y} L ${X} ${Y} L ${W} ${Y} L ${W} ${H} L ${X} ${H} L ${X} ${g.y + g.h}`
    : `M ${g.x} ${H} L ${X} ${H} L ${X} ${Y} L ${W} ${Y} L ${W} ${H} L ${g.x + g.w} ${H}`
  const ticks = onLeft
    ? [
        [X, g.y, X + 8, g.y],
        [X, g.y + g.h, X + 8, g.y + g.h],
      ]
    : [
        [g.x, H - 8, g.x, H],
        [g.x + g.w, H - 8, g.x + g.w, H],
      ]
  return (
    <>
      <path d={d} {...stroke} />
      {ticks.map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} {...stroke} />
      ))}
    </>
  )
}

function PlanLabel({
  text,
  x,
  y,
  vertical,
  chip = false,
}: {
  text: string
  x: number
  y: number
  vertical: boolean
  chip?: boolean
}) {
  const w = text.length * LABEL_CHAR_W + 12
  const h = LABEL_FONT + 8
  return (
    <g transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}>
      {chip && <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill="var(--bg)" />}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={LABEL_FONT}
        fill="var(--ink-subtle)"
      >
        {text}
      </text>
    </g>
  )
}

function TableButton<T extends GuestPlanTable>({
  placed,
  selected,
  tabbable,
  onSelect,
  onArrow,
  buttonRef,
}: {
  placed: PlacedTable<T>
  selected: boolean
  tabbable: boolean
  onSelect: (table: T) => void
  onArrow: (from: PlacedTable<T>, e: KeyboardEvent<HTMLButtonElement>) => void
  buttonRef: (el: HTMLButtonElement | null) => void
}) {
  const { table, box, surface, chairs } = placed
  const status = GUEST_AVAILABILITY_LABELS[table.availability]
  const compact = Math.min(surface.w, surface.h) < 40
  const state = selected
    ? 'selected'
    : table.isSelectable
      ? 'available'
      : table.availability === 'tooSmall'
        ? 'tooSmall'
        : 'taken'

  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`Bàn ${table.tableNumber}, ${table.capacity} ghế, ${status}`}
      title={`Bàn ${table.tableNumber} · ${status}`}
      disabled={!table.isSelectable}
      tabIndex={tabbable ? 0 : -1}
      onClick={() => onSelect(table)}
      onKeyDown={(e) => onArrow(placed, e)}
      data-testid={`guest-floor-node-${table.tableNumber}`}
      data-state={state}
      className={cn(
        'group absolute rounded-lg outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        table.isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'
      )}
      style={rectStyle(box)}
    >
      {chairs.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'absolute rounded-[3px] transition-colors duration-150',
            state === 'selected' && 'bg-primary',
            state === 'available' && 'bg-success/80 group-hover:bg-primary',
            state === 'tooSmall' && 'bg-line-strong/70',
            state === 'taken' && 'bg-line'
          )}
          style={rectStyle(c)}
        />
      ))}
      <span
        aria-hidden="true"
        className={cn(
          'absolute flex flex-col items-center justify-center leading-none transition-colors duration-150',
          surface.round ? 'rounded-full' : 'rounded-md',
          state === 'selected' && 'border-2 border-primary bg-primary/15',
          state === 'available' &&
            'border border-line-strong bg-card group-hover:border-primary',
          state === 'tooSmall' && 'border border-dashed border-line-strong bg-transparent',
          state === 'taken' && 'border border-line bg-surface table-hatch'
        )}
        style={rectStyle(surface)}
      >
        <span
          className={cn(
            'text-[13px] font-semibold tabular-nums',
            state === 'selected' && 'text-accent',
            state === 'available' && 'text-ink',
            (state === 'tooSmall' || state === 'taken') && 'text-ink-subtle'
          )}
        >
          {table.tableNumber}
        </span>
        {!compact && (
          <span
            className={cn(
              'mt-1 text-[10.5px] tabular-nums',
              state === 'taken' ? 'text-ink-subtle' : 'text-ink-muted'
            )}
          >
            {table.capacity} ghế
          </span>
        )}
      </span>
    </button>
  )
}

function rectStyle(r: Rect) {
  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.w}px`,
    height: `${r.h}px`,
  }
}
