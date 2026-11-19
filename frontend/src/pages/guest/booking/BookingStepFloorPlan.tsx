import { useRef, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { TABLE_ZONE_LABELS } from '@/domain'
import { FloorPlanCanvas } from '@/components/floor-plan/FloorPlanCanvas'
import { Button, Card, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { reservationApi } from '@/services/api'
import type {
  AvailableSlotDto,
  GuestTableAvailability,
  SlotTableDto,
  TableZone,
} from '@/types'

const GUEST_AVAILABILITY_LABELS: Record<GuestTableAvailability, string> = {
  available: 'Còn trống',
  taken: 'Đã có người đặt',
  tooSmall: 'Không đủ chỗ',
}

export interface BookingStepFloorPlanProps {
  date: string
  time: string
  partySize: number
  zone: TableZone
  selectedTableId: string | null
  onSelectTable: (table: SlotTableDto) => void
  onSwitchSuggestion: (nextTime: string, nextZone: TableZone) => void
  onBack: () => void
  onNext: () => void
}

/** Step 2 real-coordinate floor plan selector with keyboard navigation and G1.1x fallback suggestions. */
export function BookingStepFloorPlan({
  date,
  time,
  partySize,
  zone,
  selectedTableId,
  onSelectTable,
  onSwitchSuggestion,
  onBack,
  onNext,
}: BookingStepFloorPlanProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const {
    data: slots = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['booking-slots', date, partySize, zone],
    queryFn: () =>
      reservationApi.getAvailableSlots({ date, partySize, zone }),
    staleTime: 0,
  })

  const activeSlot = slots.find((s) => s.time === time) ?? slots[0]
  const zoneTables = activeSlot?.zoneTables ?? []
  const selectableTables = zoneTables
    .filter((t) => t.isSelectable)
    .sort((a, b) => (a.posY !== b.posY ? a.posY - b.posY : a.posX - b.posX))
  const hasSelectable = selectableTables.length > 0

  const { data: allZoneSlots = [] } = useQuery({
    queryKey: ['booking-all-slots', date, partySize],
    queryFn: () => reservationApi.getAvailableSlots({ date, partySize }),
    enabled: !isLoading && !isError && !hasSelectable,
    staleTime: 0,
  })

  const alternativeSuggestions = computeAlternatives(allZoneSlots, time, zone)

  const handleArrowNavigation = (
    current: SlotTableDto,
    e: KeyboardEvent<HTMLButtonElement>
  ) => {
    const dirMap: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }
    const dir = dirMap[e.key]
    if (!dir) return
    e.preventDefault()

    if (selectableTables.length <= 1) return

    let best: SlotTableDto | null = null
    let bestScore = Infinity

    for (const candidate of selectableTables) {
      if (candidate.id === current.id) continue
      const dx = candidate.posX - current.posX
      const dy = candidate.posY - current.posY
      const primary = dx * dir[0] + dy * dir[1]
      if (primary <= 0) continue
      const secondary = Math.abs(dx * dir[1] + dy * dir[0])
      const score = primary + secondary * 2
      if (score < bestScore) {
        bestScore = score
        best = candidate
      }
    }

    if (!best) {
      const idx = selectableTables.findIndex((t) => t.id === current.id)
      const step = dir[0] + dir[1] >= 0 ? 1 : -1
      best =
        selectableTables[
          (idx + step + selectableTables.length) % selectableTables.length
        ]
    }

    if (best) {
      buttonRefs.current[best.id]?.focus()
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-surface/95 backdrop-blur-md space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="bg-surface/95 backdrop-blur-md space-y-3">
        <p className="text-sm text-danger">Không thể tải sơ đồ bàn trống.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </Card>
    )
  }

  if (!hasSelectable) {
    return (
      <Card className="bg-surface/95 backdrop-blur-md space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center text-accent shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-semibold text-ink">
              Không còn bàn trống phù hợp
            </h2>
            <p className="text-sm text-ink-muted">
              Rất tiếc, khung giờ {time} tại khu vực {TABLE_ZONE_LABELS[zone]}{' '}
              hiện đã kín chỗ cho nhóm {partySize} khách. Quý khách vui lòng
              chọn khung giờ hoặc khu vực khác.
            </p>
          </div>
        </div>

        {alternativeSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-muted">
              Gợi ý khung giờ / khu vực còn bàn:
            </p>
            <div className="flex flex-wrap gap-2">
              {alternativeSuggestions.map((alt) => (
                <Button
                  key={`${alt.time}-${alt.zone}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => onSwitchSuggestion(alt.time, alt.zone)}
                >
                  {alt.time} · {TABLE_ZONE_LABELS[alt.zone]} ({alt.count} bàn)
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button variant="primary" onClick={onBack}>
            Chọn lại thời gian
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-surface/95 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-accent">
            Sơ đồ bàn ({TABLE_ZONE_LABELS[zone]})
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Chọn bàn còn trống và đủ {partySize} ghế trên sơ đồ (dùng phím mũi tên và Enter để chọn).
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft className="w-4 h-4" />}
          onClick={onBack}
        >
          Quay lại
        </Button>
      </div>

      {/* Small legend */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted"
        aria-label="Chú thích trạng thái bàn"
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-3 h-3 rounded-sm border-2 border-primary bg-card"
          />
          {GUEST_AVAILABILITY_LABELS.available}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-3 h-3 rounded-sm border border-dashed border-line-strong bg-surface opacity-60"
          />
          {GUEST_AVAILABILITY_LABELS.tooSmall}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-3 h-3 rounded-sm border border-line bg-surface opacity-50"
          />
          {GUEST_AVAILABILITY_LABELS.taken}
        </span>
      </div>

      <FloorPlanCanvas
        tables={zoneTables}
        fitContent
        role="radiogroup"
        ariaLabel={`Chọn bàn tại ${TABLE_ZONE_LABELS[zone]}`}
        renderTable={(table, { left, top, width, height, shapeClass }) => {
          const isSelected = table.id === selectedTableId
          const statusLabel = GUEST_AVAILABILITY_LABELS[table.availability]
          return (
            <button
              key={table.id}
              ref={(el) => {
                buttonRefs.current[table.id] = el
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Bàn ${table.tableNumber}, ${table.capacity} ghế, ${statusLabel}`}
              disabled={!table.isSelectable}
              onClick={() => onSelectTable(table)}
              onKeyDown={(e) => handleArrowNavigation(table, e)}
              data-testid={`guest-floor-node-${table.tableNumber}`}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              className={cn(
                'absolute p-2 border text-center flex flex-col items-center justify-center gap-0.5 transition-all select-none',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                shapeClass,
                isSelected
                  ? 'border-2 border-primary ring-2 ring-primary/30 bg-card shadow-md cursor-pointer'
                  : table.isSelectable
                    ? 'border-line-strong bg-card hover:border-primary hover:bg-card-hover cursor-pointer'
                    : table.availability === 'tooSmall'
                      ? 'border-dashed border-line-strong bg-surface/65 opacity-60 cursor-not-allowed'
                      : 'border-line bg-surface/55 opacity-55 cursor-not-allowed'
              )}
            >
              <span className="text-sm sm:text-base font-bold text-ink leading-tight">
                {table.tableNumber}
              </span>
              <span className="text-[11px] font-medium text-ink-muted tabular-nums leading-tight">
                {table.capacity} ghế
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight',
                  table.isSelectable ? 'text-accent' : 'text-ink-muted'
                )}
              >
                {statusLabel}
              </span>
            </button>
          )
        }}
      />

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-line">
        <Button variant="secondary" onClick={onBack}>
          Quay lại
        </Button>
        <Button disabled={!selectedTableId} onClick={onNext}>
          Tiếp tục chọn Set Menu
        </Button>
      </div>
    </Card>
  )
}

function computeAlternatives(
  slots: AvailableSlotDto[],
  currentTime: string,
  currentZone: TableZone
): { time: string; zone: TableZone; count: number }[] {
  const results: { time: string; zone: TableZone; count: number }[] = []
  const seen = new Set<string>()

  for (const slot of slots) {
    const byZone = new Map<TableZone, number>()
    for (const table of slot.availableTables) {
      byZone.set(table.zone, (byZone.get(table.zone) ?? 0) + 1)
    }
    for (const [z, count] of byZone.entries()) {
      if (slot.time === currentTime && z === currentZone) continue
      const key = `${slot.time}-${z}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ time: slot.time, zone: z, count })
    }
  }
  return results.slice(0, 6)
}
