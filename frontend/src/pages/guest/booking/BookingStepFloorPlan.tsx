import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { TABLE_ZONE_LABELS } from '@/domain'
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

/** Step 2 floor plan selector with G1.1x empty-table fallback suggestions. */
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
  const hasSelectable = zoneTables.some((t) => t.isSelectable)

  const { data: allZoneSlots = [] } = useQuery({
    queryKey: ['booking-all-slots', date, partySize],
    queryFn: () => reservationApi.getAvailableSlots({ date, partySize }),
    enabled: !isLoading && !isError && !hasSelectable,
    staleTime: 0,
  })

  const alternativeSuggestions = computeAlternatives(allZoneSlots, time, zone)

  if (isLoading) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-danger">Không thể tải sơ đồ bàn trống.</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Thử lại
        </Button>
      </Card>
    )
  }

  if (!hasSelectable) {
    return (
      <Card className="space-y-5">
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
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-accent">
            Sơ đồ bàn ({TABLE_ZONE_LABELS[zone]})
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Chỉ những bàn còn trống và đủ {partySize} ghế mới có thể chọn.
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

      <div
        role="radiogroup"
        aria-label={`Chọn bàn tại ${TABLE_ZONE_LABELS[zone]}`}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {zoneTables.map((table) => {
          const isSelected = table.id === selectedTableId
          return (
            <button
              key={table.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!table.isSelectable}
              onClick={() => onSelectTable(table)}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-colors space-y-2',
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-card-hover cursor-pointer'
                  : table.isSelectable
                    ? 'border-line bg-card hover:bg-card-hover cursor-pointer'
                    : 'border-line bg-card/40 opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-ink">
                  {table.tableNumber}
                </span>
                <span className="text-xs text-ink-muted">
                  {table.capacity} ghế
                </span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium',
                  table.availability === 'available'
                    ? 'border-primary/40 text-accent bg-card'
                    : 'border-line text-ink-muted bg-card'
                )}
              >
                {GUEST_AVAILABILITY_LABELS[table.availability]}
              </span>
            </button>
          )
        })}
      </div>

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
