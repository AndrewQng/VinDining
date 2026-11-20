import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BOOKING_TIMES } from '../bookingState'
import { GuestRoomPlan } from '@/components/floor-plan/GuestRoomPlan'
import {
  GUEST_AVAILABILITY_LABELS,
  layoutGuestRoom,
  ZONE_LANDMARKS,
  type RoomLayout,
} from '@/components/floor-plan/guestRoomLayout'
import { Button, Card, Skeleton } from '@/components/ui'
import { TABLE_ZONE_LABELS } from '@/domain'
import { cn } from '@/lib/utils'
import type { SlotTableDto, TableZone } from '@/types'
import {
  BOOKING_ZONES,
  countFreeTables,
  getZoneTables,
  useBookingAvailability,
} from './useBookingAvailability'
import { useStableViewportHeight } from './useStableViewportHeight'

/** Space kept under the plan inside the viewport: legend row + card padding. */
const BELOW_PLAN = 76
const MIN_PLAN_H = 240

export interface BookingStepTableProps {
  date: string
  time: string
  partySize: number
  zone: TableZone
  selectedTableId: string | null
  onSelectTable: (table: SlotTableDto) => void
  onChangeZone: (zone: TableZone) => void
  onChangeTime: (time: string) => void
}

/** G1.2 Chọn bàn: the zone's real floor plan, fitted so every table is on screen. */
export function BookingStepTable({
  date,
  time,
  partySize,
  zone,
  selectedTableId,
  onSelectTable,
  onChangeZone,
  onChangeTime,
}: BookingStepTableProps) {
  const { data: slots, isError, refetch, isPlaceholderData } = useBookingAvailability(
    date,
    partySize
  )
  const viewportH = useStableViewportHeight()
  const planRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState({ width: 0, top: 0 })

  useLayoutEffect(() => {
    const el = planRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      const next = { width: Math.floor(el.clientWidth), top: Math.round(rect.top + window.scrollY) }
      setFrame((prev) => (prev.width === next.width && prev.top === next.top ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const availH = Math.max(MIN_PLAN_H, viewportH - frame.top - BELOW_PLAN)

  const layouts = useMemo(() => {
    if (!slots || frame.width === 0) return null
    const byZone = {} as Record<TableZone, RoomLayout<SlotTableDto>>
    for (const z of BOOKING_ZONES) {
      byZone[z] = layoutGuestRoom(getZoneTables(slots, time, z), ZONE_LANDMARKS[z], frame.width, availH)
    }
    return byZone
  }, [slots, time, frame.width, availH])

  // One height for all zones, so switching zone never moves the legend or the page.
  const planH = layouts
    ? Math.ceil(Math.max(...BOOKING_ZONES.map((z) => layouts[z].height)))
    : Math.min(availH, 360)

  const layout = layouts?.[zone] ?? null
  const freeHere = slots ? countFreeTables(slots, time, zone) : 0
  const otherTimes = slots
    ? BOOKING_TIMES.filter((t) => t !== time)
        .map((t) => ({ time: t, count: countFreeTables(slots, t, zone) }))
        .filter((s) => s.count > 0)
    : []

  return (
    <Card className="bg-surface/95 backdrop-blur-md space-y-4" data-testid="booking-step-table">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-accent">Chọn bàn</h2>
        <div
          role="group"
          aria-label="Khu vực"
          className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-bg p-1 sm:w-[360px]"
        >
          {BOOKING_ZONES.map((z) => {
            const count = slots ? countFreeTables(slots, time, z) : null
            const active = z === zone
            return (
              <button
                key={z}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeZone(z)}
                data-testid={`table-zone-${z}`}
                className={cn(
                  'flex flex-col items-center justify-center rounded-md px-2 py-1.5 transition-colors duration-150 cursor-pointer',
                  active
                    ? 'bg-card text-ink ring-1 ring-primary'
                    : 'text-ink-muted hover:text-ink hover:bg-card-hover'
                )}
              >
                <span className="text-sm font-medium leading-5">{TABLE_ZONE_LABELS[z]}</span>
                <span className="text-[11px] leading-4 tabular-nums text-ink-muted">
                  {count === null ? ' ' : count > 0 ? `${count} bàn trống` : 'Hết bàn'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        ref={planRef}
        data-testid="guest-plan-frame"
        className={cn(
          'flex w-full items-center justify-center transition-opacity duration-150',
          isPlaceholderData && 'opacity-60'
        )}
        style={{ height: `${planH}px` }}
      >
        {isError ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-danger">Không tải được sơ đồ bàn.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : layout ? (
          <GuestRoomPlan
            layout={layout}
            selectedId={selectedTableId}
            onSelect={onSelectTable}
            ariaLabel={`Sơ đồ bàn ${TABLE_ZONE_LABELS[zone]}`}
          />
        ) : (
          <Skeleton className="h-full w-full rounded-xl" />
        )}
      </div>

      <div className="min-h-10 flex items-center">
        {slots && freeHere === 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2" role="status">
            <p className="text-sm text-ink">
              Hết bàn cho {partySize} khách lúc {time}.
            </p>
            {otherTimes.map((s) => (
              <Button
                key={s.time}
                variant="secondary"
                size="sm"
                onClick={() => onChangeTime(s.time)}
              >
                {s.time} · {s.count} bàn
              </Button>
            ))}
          </div>
        ) : (
          <ul
            aria-label="Chú thích"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted"
          >
            <LegendItem state="selected" label="Bàn bạn chọn" />
            <LegendItem state="available" label={GUEST_AVAILABILITY_LABELS.available} />
            <LegendItem state="taken" label={GUEST_AVAILABILITY_LABELS.taken} />
            <LegendItem state="tooSmall" label={GUEST_AVAILABILITY_LABELS.tooSmall} />
          </ul>
        )}
      </div>
    </Card>
  )
}

function LegendItem({
  state,
  label,
}: {
  state: 'selected' | 'available' | 'taken' | 'tooSmall'
  label: string
}) {
  const chair = cn(
    'absolute left-1/2 h-[3px] w-2.5 -translate-x-1/2 rounded-[1px]',
    state === 'selected' && 'bg-primary',
    state === 'available' && 'bg-success/80',
    state === 'tooSmall' && 'bg-line-strong/70',
    state === 'taken' && 'bg-line'
  )
  return (
    <li className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="relative inline-block h-[18px] w-4">
        <span className={cn(chair, 'top-0')} />
        <span
          className={cn(
            'absolute inset-x-0 top-[5px] h-2 rounded-[2px]',
            state === 'selected' && 'border-2 border-primary bg-primary/15',
            state === 'available' && 'border border-line-strong bg-card',
            state === 'tooSmall' && 'border border-dashed border-line-strong',
            state === 'taken' && 'border border-line bg-surface table-hatch'
          )}
        />
        <span className={cn(chair, 'bottom-0')} />
      </span>
      {label}
    </li>
  )
}
