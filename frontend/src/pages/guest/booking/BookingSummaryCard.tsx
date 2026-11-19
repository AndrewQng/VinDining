import { calculateDepositAmount, formatDate, TABLE_ZONE_LABELS } from '@/domain'
import { Card, Money } from '@/components/ui'
import type { TastingMenuDto } from '@/types'
import { type BookingDraft } from '../bookingState'

export interface BookingSummaryCardProps {
  draft: BookingDraft
  selectedSet: TastingMenuDto | null
}

/** Sticky desktop summary panel displaying current booking parameters and deposit. */
export function BookingSummaryCard({
  draft,
  selectedSet,
}: BookingSummaryCardProps) {
  const deposit = calculateDepositAmount({
    guestCount: draft.partySize,
    setMenuPricePerGuest: selectedSet?.price ?? null,
  })

  return (
    <Card className="bg-surface/95 backdrop-blur-md lg:sticky lg:top-24 space-y-4">
      <h2 className="text-base font-semibold text-accent">Tóm tắt đặt bàn</h2>
      <ul className="space-y-2 text-sm text-ink-muted">
        <li className="flex justify-between gap-2">
          <span>Ngày</span>
          <span className="text-ink font-medium text-right">
            {formatDate(draft.date)}
          </span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Giờ</span>
          <span className="text-ink font-medium tabular-nums">{draft.time}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Số lượng khách</span>
          <span className="text-ink font-medium">{draft.partySize} khách</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Khu vực</span>
          <span className="text-ink font-medium">
            {TABLE_ZONE_LABELS[draft.zone]}
          </span>
        </li>
        {draft.tableNumber && (
          <li className="flex justify-between gap-2">
            <span>Bàn đã chọn</span>
            <span className="text-ink font-medium">
              Bàn {draft.tableNumber} ({draft.tableCapacity} ghế)
            </span>
          </li>
        )}
        <li className="flex justify-between gap-2">
          <span>Thực đơn</span>
          <span className="text-ink font-medium text-right">
            {selectedSet ? selectedSet.name : 'Gọi món tại nhà hàng'}
          </span>
        </li>
      </ul>

      <div className="pt-3 border-t border-line space-y-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-muted">Tiền cọc giữ chỗ</span>
          <Money amount={deposit} tone="accent" className="text-base font-semibold" />
        </div>
        <p className="text-xs text-ink-subtle">
          {selectedSet
            ? '30% giá Set Menu (trừ trực tiếp vào hóa đơn khi dùng bữa).'
            : '500.000 ₫ / khách · hoặc 30% giá Set Menu nếu chọn trước.'}
        </p>
      </div>
    </Card>
  )
}
