import { useRef, type ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import { Card, ThemedImage } from '@/components/ui'
import { TABLE_ZONE_LABELS } from '@/domain'
import { cn } from '@/lib/utils'
import type { TableZone } from '@/types'
import { BOOKING_TIMES } from '../bookingState'
import {
  BOOKING_ZONES,
  countFreeTables,
  useBookingAvailability,
  ZONE_PHOTOS,
} from './useBookingAvailability'

const DAY_TILES = 7
const MAX_PARTY = 10
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const monthFormat = new Intl.DateTimeFormat('vi-VN', { month: 'short' })

export interface TimeZoneValue {
  date: string
  time: string
  partySize: number
  zone: TableZone
}

export interface BookingStepTimeZoneProps extends TimeZoneValue {
  onChange: (patch: Partial<TimeZoneValue>) => void
  now?: Date
}

function toKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function isPastSlot(date: string, time: string, now: Date): boolean {
  return new Date(`${date}T${time}:00`).getTime() <= now.getTime()
}

/** G1.1 Chọn thời gian & khu vực: day tiles, time slots with free-table counts, party size, zone photos. */
export function BookingStepTimeZone({
  date,
  time,
  partySize,
  zone,
  onChange,
  now = new Date(),
}: BookingStepTimeZoneProps) {
  const { data: slots } = useBookingAvailability(date, partySize)
  const pickerRef = useRef<HTMLInputElement>(null)
  const todayKey = toKey(now)

  const days = (() => {
    const start = fromKey(todayKey)
    return Array.from({ length: DAY_TILES }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      const key = toKey(d)
      const lastSlotGone = i === 0 && isPastSlot(key, BOOKING_TIMES[BOOKING_TIMES.length - 1], now)
      return {
        key,
        top: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : WEEKDAYS[d.getDay()],
        day: d.getDate(),
        month: monthFormat.format(d),
        disabled: lastSlotGone,
      }
    })
  })()

  const otherDate = days.some((d) => d.key === date) ? null : fromKey(date)

  const openPicker = () => {
    const input = pickerRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <Card
      className="bg-surface/95 backdrop-blur-md space-y-5"
      data-testid="booking-step-time-zone"
    >
      <h2 className="text-base font-semibold text-accent">Chọn thời gian & khu vực</h2>

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-[88px_minmax(0,1fr)]">
        <RowLabel id="tz-date">Ngày</RowLabel>
        <div role="group" aria-labelledby="tz-date" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {days.map((d) => (
            <Tile
              key={d.key}
              selected={d.key === date}
              disabled={d.disabled}
              onClick={() => onChange({ date: d.key })}
              testId={`tz-day-${d.key}`}
            >
              <span className="text-[11px] leading-4 text-ink-muted">{d.top}</span>
              <span className="text-lg font-semibold leading-6 tabular-nums">{d.day}</span>
              <span className="text-[11px] leading-4 text-ink-muted">{d.month}</span>
            </Tile>
          ))}
          <div className="relative">
            <Tile
              selected={Boolean(otherDate)}
              onClick={openPicker}
              testId="tz-day-other"
            >
              <span className="text-[11px] leading-4 text-ink-muted">Ngày khác</span>
              {otherDate ? (
                <>
                  <span className="text-lg font-semibold leading-6 tabular-nums">
                    {otherDate.getDate()}
                  </span>
                  <span className="text-[11px] leading-4 text-ink-muted">
                    {monthFormat.format(otherDate)}
                  </span>
                </>
              ) : (
                <>
                  <CalendarDays className="my-0.5 h-5 w-5 text-ink-muted" aria-hidden="true" />
                  <span className="text-[11px] leading-4">&nbsp;</span>
                </>
              )}
            </Tile>
            <input
              ref={pickerRef}
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              min={todayKey}
              value={date}
              onChange={(e) => e.target.value && onChange({ date: e.target.value })}
              className="pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-0"
            />
          </div>
        </div>

        <RowLabel id="tz-time">Giờ</RowLabel>
        <div role="group" aria-labelledby="tz-time" className="grid grid-cols-5 gap-2">
          {BOOKING_TIMES.map((t) => {
            const past = isPastSlot(date, t, now)
            const count = slots ? countFreeTables(slots, t) : null
            const disabled = past || count === 0
            return (
              <Tile
                key={t}
                selected={t === time}
                disabled={disabled}
                onClick={() => onChange({ time: t })}
                testId={`tz-time-${t}`}
              >
                <span className="text-[15px] font-semibold leading-6 tabular-nums">{t}</span>
                <span className="text-[11px] leading-4 tabular-nums text-ink-muted">
                  {past ? (
                    'Đã qua'
                  ) : count === null ? (
                    ' '
                  ) : count > 0 ? (
                    <>
                      {count} bàn<span className="hidden sm:inline"> trống</span>
                    </>
                  ) : (
                    'Hết bàn'
                  )}
                </span>
              </Tile>
            )
          })}
        </div>

        <RowLabel id="tz-party">Số khách</RowLabel>
        <div role="group" aria-labelledby="tz-party" className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: MAX_PARTY }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={n === partySize}
              aria-label={`${n} khách`}
              onClick={() => onChange({ partySize: n })}
              data-testid={`tz-party-${n}`}
              className={cn(
                'h-10 rounded-lg border text-sm font-semibold tabular-nums transition-colors duration-150 cursor-pointer',
                n === partySize
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line bg-card text-ink hover:bg-card-hover'
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <RowLabel id="tz-zone">Khu vực</RowLabel>
        <div role="group" aria-labelledby="tz-zone" className="grid grid-cols-3 gap-2 sm:gap-3">
          {BOOKING_ZONES.map((z) => {
            const count = slots ? countFreeTables(slots, time, z) : null
            const selected = z === zone
            const disabled = count === 0 && !selected
            return (
              <button
                key={z}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onChange({ zone: z })}
                data-testid={`tz-zone-${z}`}
                className={cn(
                  'group overflow-hidden rounded-lg border bg-card text-left transition-colors duration-150',
                  selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-line hover:border-line-strong',
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                )}
              >
                <ThemedImage
                  name={ZONE_PHOTOS[z]}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
                <span className="block px-2.5 py-2 sm:px-3">
                  <span className="block truncate text-[13px] font-semibold leading-5 text-ink sm:text-sm">
                    {TABLE_ZONE_LABELS[z]}
                  </span>
                  <span className="block truncate text-[11px] leading-4 tabular-nums text-ink-muted">
                    {count === null ? ' ' : count > 0 ? `${count} bàn trống` : `Hết bàn lúc ${time}`}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function RowLabel({ id, children }: { id: string; children: string }) {
  return (
    <span id={id} className="text-sm font-medium text-ink-muted sm:pt-2.5">
      {children}
    </span>
  )
}

function Tile({
  selected,
  disabled = false,
  onClick,
  testId,
  children,
}: {
  selected: boolean
  disabled?: boolean
  onClick: () => void
  testId: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex w-full flex-col items-center justify-center whitespace-nowrap rounded-lg border px-0.5 py-2 transition-colors duration-150',
        selected
          ? 'border-primary bg-primary/15 text-ink ring-1 ring-primary'
          : 'border-line bg-card text-ink hover:bg-card-hover',
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
      )}
    >
      {children}
    </button>
  )
}
