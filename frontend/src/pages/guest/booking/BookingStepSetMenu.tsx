import { Check } from 'lucide-react'
import { calculateDepositAmount, COURSE_TYPE_LABELS } from '@/domain'
import { Card, Money } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { TastingMenuDto } from '@/types'

export interface BookingStepSetMenuProps {
  tastingMenus: TastingMenuDto[]
  partySize: number
  selectedSetId: string | null
  onSelectSet: (setId: string | null) => void
}

/** Step 3 optional Set Menu pre-order selector with layout-stable selection states. */
export function BookingStepSetMenu({
  tastingMenus,
  partySize,
  selectedSetId,
  onSelectSet,
}: BookingStepSetMenuProps) {
  const noSetDeposit = calculateDepositAmount({ guestCount: partySize })

  return (
    <Card className="bg-surface/95 backdrop-blur-md space-y-5">
      <h2 className="text-base font-semibold text-accent">Chọn Set Menu</h2>

      <div
        data-testid="booking-set-grid"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {tastingMenus.map((set) => {
          const isSelected = selectedSetId === set.id
          const setTotal = set.price * partySize
          const deposit = calculateDepositAmount({
            guestCount: partySize,
            setMenuPricePerGuest: set.price,
          })

          return (
            <button
              key={set.id}
              type="button"
              data-testid="booking-set-card"
              onClick={() => onSelectSet(set.id)}
              aria-pressed={isSelected}
              className={cn(
                'p-4 rounded-xl border text-left transition-colors cursor-pointer grid grid-rows-[auto_1fr_auto] md:row-span-3 md:grid-rows-[subgrid] gap-y-3 h-full',
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-card'
                  : 'border-line bg-card hover:bg-card-hover'
              )}
            >
              <div className="space-y-1 w-full">
                <span className="block w-full">
                  <span
                    data-testid="booking-set-name"
                    className="font-serif text-lg font-semibold text-ink leading-7"
                  >
                    {set.name}
                  </span>
                </span>
                <span
                  data-testid="booking-set-price"
                  className="block text-xs font-semibold text-accent"
                >
                  <Money amount={set.price} tone="accent" /> / khách
                </span>
              </div>

              <ul className="space-y-1 text-xs text-ink-muted">
                {set.items
                  .slice()
                  .sort((a, b) => a.courseOrder - b.courseOrder)
                  .map((item) => (
                    <li key={item.id}>
                      • {COURSE_TYPE_LABELS[item.courseType]}:{' '}
                      {item.menuItemName}
                    </li>
                  ))}
              </ul>

              <div className="pt-3 border-t border-line space-y-1 w-full self-end">
                <p className="text-xs font-semibold text-ink">
                  {set.name} × {partySize} khách ={' '}
                  <Money amount={setTotal} tone="accent" />
                </p>
                <p className="text-xs text-ink-muted">
                  Thanh toán sau bữa ăn, cọc 30%:{' '}
                  <Money amount={deposit} tone="default" /> (trừ vào hóa đơn)
                </p>
                <div className="h-5 pt-0.5 flex items-center">
                  <span
                    aria-hidden={!isSelected}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium text-accent transition-opacity duration-150 motion-reduce:transition-none',
                      isSelected
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none select-none'
                    )}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Đã chọn cho {partySize} khách
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        data-testid="booking-no-set-option"
        onClick={() => onSelectSet(null)}
        aria-pressed={selectedSetId === null}
        className={cn(
          'w-full p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-4',
          selectedSetId === null
            ? 'border-primary ring-1 ring-primary bg-card'
            : 'border-line bg-card hover:bg-card-hover'
        )}
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">Gọi món tại nhà hàng</p>
          <p className="text-xs text-ink-muted">
            Cọc 500.000 ₫ mỗi khách (<Money amount={noSetDeposit} />)
          </p>
        </div>
        <Check
          aria-hidden="true"
          className={cn(
            'w-4 h-4 text-accent shrink-0 transition-opacity duration-150 motion-reduce:transition-none',
            selectedSetId === null ? 'opacity-100' : 'opacity-0'
          )}
        />
      </button>
    </Card>
  )
}
