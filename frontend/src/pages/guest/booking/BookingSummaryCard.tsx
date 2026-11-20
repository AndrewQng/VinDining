import { useMemo } from 'react'
import { calculateDepositAmount, formatDate, TABLE_ZONE_LABELS } from '@/domain'
import { Card, Money } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/useThemeStore'
import type { TastingMenuDto } from '@/types'
import { type BookingDraft } from '../bookingState'
import { ZONE_PHOTOS } from './useBookingAvailability'

export interface BookingSummaryCardProps {
  draft: BookingDraft
  selectedSet: TastingMenuDto | null
  tastingMenus: TastingMenuDto[]
}

/** Fixed-height booking summary card with 16:9 zone/set preview photo and single-line rows. */
export function BookingSummaryCard({
  draft,
  selectedSet,
  tastingMenus,
}: BookingSummaryCardProps) {
  const theme = useThemeStore((s) => s.theme)
  const deposit = calculateDepositAmount({
    guestCount: draft.partySize,
    setMenuPricePerGuest: selectedSet?.price ?? null,
  })

  const activePhoto = selectedSet?.imageUrl
    ? selectedSet.imageUrl.replace(/^.*\//, '')
    : ZONE_PHOTOS[draft.zone]

  const photoAlt = selectedSet
    ? selectedSet.name
    : TABLE_ZONE_LABELS[draft.zone]

  const candidatePhotos = useMemo(() => {
    const names = new Set<string>(Object.values(ZONE_PHOTOS))
    for (const set of tastingMenus) {
      if (set.imageUrl) {
        names.add(set.imageUrl.replace(/^.*\//, ''))
      }
    }
    return Array.from(names)
  }, [tastingMenus])

  const dateText = formatDate(draft.date)
  const guestsText = `${draft.partySize} khách`
  const zoneText = TABLE_ZONE_LABELS[draft.zone]
  const tableText = draft.tableNumber
    ? `Bàn ${draft.tableNumber} (${draft.tableCapacity} ghế)`
    : 'Chưa chọn'
  const menuText = selectedSet
    ? selectedSet.name
    : draft.step === 'time-zone' || draft.step === 'table'
      ? 'Chưa chọn'
      : 'Gọi món tại nhà hàng'

  const rows = [
    { label: 'Ngày', value: dateText, tabular: false },
    { label: 'Giờ', value: draft.time, tabular: true },
    { label: 'Số khách', value: guestsText, tabular: false },
    { label: 'Khu vực', value: zoneText, tabular: false },
    { label: 'Bàn', value: tableText, tabular: false },
    { label: 'Thực đơn', value: menuText, tabular: false },
  ]

  const depositNote = selectedSet
    ? '30% giá Set Menu, trừ vào hóa đơn.'
    : '500.000 ₫ mỗi khách, hoặc 30% giá Set Menu.'

  return (
    <Card
      data-testid="booking-summary-card"
      className="bg-surface/95 backdrop-blur-md space-y-4"
    >
      <h2 className="text-base font-semibold text-accent">Tóm tắt đặt bàn</h2>

      <div
        data-testid="booking-summary-photo"
        className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-card"
      >
        {candidatePhotos.map((photo) => {
          const isCurrent = photo === activePhoto
          return (
            <img
              key={photo}
              src={`/images/${theme}/${photo}`}
              alt={isCurrent ? photoAlt : ''}
              aria-hidden={!isCurrent || undefined}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ease-out motion-reduce:transition-none',
                isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
            />
          )
        })}
      </div>

      <ul className="space-y-2 text-sm text-ink-muted">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3">
            <span className="shrink-0">{row.label}</span>
            <span
              title={row.value}
              className={cn(
                'min-w-0 flex-1 text-right text-ink font-medium truncate leading-5',
                row.tabular && 'tabular-nums'
              )}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="pt-3 border-t border-line space-y-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-muted">Tiền cọc giữ chỗ</span>
          <Money
            amount={deposit}
            tone="accent"
            className="text-base font-semibold shrink-0"
          />
        </div>
        <p
          data-testid="booking-summary-deposit-note"
          title={depositNote}
          className="text-xs text-ink-subtle leading-5 truncate"
        >
          {depositNote}
        </p>
      </div>
    </Card>
  )
}
