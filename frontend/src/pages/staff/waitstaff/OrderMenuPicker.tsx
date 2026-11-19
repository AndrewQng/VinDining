import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Minus, Plus } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Money,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { MenuItemDto, OrderItemInput, TastingMenuDto } from '@/types'

export interface DraftSelection {
  selectedSetMenuId: string | null
  quantities: Record<string, number>
  notes: Record<string, string>
}

export interface OrderMenuPickerProps {
  menuItems: MenuItemDto[]
  tastingMenus?: TastingMenuDto[]
  guestCount: number
  allowSetMenu?: boolean
  submitLabel: (totalAmount: number, totalCount: number) => string
  submitDisabledReason?: string | null
  errorMessage?: string | null
  isSubmitting: boolean
  onSubmit: (payload: {
    tastingMenuId: string | null
    items: OrderItemInput[]
  }) => void
}

type PickerTab = 'ala-carte' | 'set-menu'

interface CourseSection {
  key: string
  title: string
  subtitle?: string
  items: MenuItemDto[]
}

function buildCourseSections(menuItems: MenuItemDto[]): CourseSection[] {
  const courseOne = menuItems.filter(
    (m) => m.courseType === 'Appetizer' || m.courseType === 'Beverage'
  )
  const courseTwo = menuItems.filter((m) => m.courseType === 'MainCourse')
  const courseThree = menuItems.filter((m) => m.courseType === 'Dessert')

  return [
    {
      key: 'course-1',
      title: 'Course 1 — Khai vị & Đồ uống',
      subtitle: 'Đồ uống phục vụ cùng Course 1',
      items: courseOne,
    },
    {
      key: 'course-2',
      title: 'Course 2 — Món chính',
      items: courseTwo,
    },
    {
      key: 'course-3',
      title: 'Course 3 — Tráng miệng',
      items: courseThree,
    },
  ].filter((sec) => sec.items.length > 0)
}

/** Shared mobile menu picker supporting A La Carte Course groups, optional Set Menu, notes, and SoldOut guards. */
export function OrderMenuPicker({
  menuItems,
  tastingMenus = [],
  guestCount,
  allowSetMenu = false,
  submitLabel,
  submitDisabledReason,
  errorMessage,
  isSubmitting,
  onSubmit,
}: OrderMenuPickerProps) {
  const [tab, setTab] = useState<PickerTab>('ala-carte')
  const [selectedSetMenuId, setSelectedSetMenuId] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [soldOutAlert, setSoldOutAlert] = useState<string | null>(null)

  const sections = useMemo(() => buildCourseSections(menuItems), [menuItems])

  const selectedSetMenu = useMemo(
    () => tastingMenus.find((m) => m.id === selectedSetMenuId) ?? null,
    [tastingMenus, selectedSetMenuId]
  )

  const { totalCount, totalAmount, draftedItems } = useMemo(() => {
    let count = selectedSetMenu ? guestCount * selectedSetMenu.items.length : 0
    let amount = selectedSetMenu ? selectedSetMenu.price * guestCount : 0
    const list: OrderItemInput[] = []

    for (const item of menuItems) {
      const qty = quantities[item.id] ?? 0
      if (qty <= 0 || item.status === 'SoldOut') continue
      count += qty
      amount += qty * item.price
      list.push({
        menuItemId: item.id,
        quantity: qty,
        note: notes[item.id]?.trim() || null,
      })
    }
    return { totalCount: count, totalAmount: amount, draftedItems: list }
  }, [menuItems, quantities, notes, selectedSetMenu, guestCount])

  const adjustQuantity = (item: MenuItemDto, delta: number) => {
    if (item.status === 'SoldOut') {
      setSoldOutAlert(
        `${item.name} tạm hết — vui lòng tư vấn món khác cho khách.`
      )
      return
    }
    setSoldOutAlert(null)
    setQuantities((prev) => {
      const next = Math.max(0, (prev[item.id] ?? 0) + delta)
      return { ...prev, [item.id]: next }
    })
  }

  const canSubmit =
    !isSubmitting &&
    !submitDisabledReason &&
    (Boolean(selectedSetMenuId) || draftedItems.length > 0)

  const handleConfirm = () => {
    if (!canSubmit) return
    onSubmit({
      tastingMenuId: selectedSetMenuId,
      items: draftedItems,
    })
  }

  return (
    <div className="space-y-4">
      {allowSetMenu && tastingMenus.length > 0 && (
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'ala-carte', label: 'Gọi món lẻ' },
            { value: 'set-menu', label: 'Set Menu' },
          ]}
          className="w-full"
        />
      )}

      {(errorMessage || soldOutAlert) && (
        <div
          role="alert"
          className="rounded-xl border border-warning/60 bg-warning/10 p-3 flex items-start gap-2.5 text-xs font-medium text-warning"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage ?? soldOutAlert}</span>
        </div>
      )}

      {tab === 'set-menu' && allowSetMenu ? (
        <div className="grid grid-cols-1 gap-3">
          {tastingMenus
            .filter((m) => m.isActive)
            .map((setMenu) => {
              const selected = selectedSetMenuId === setMenu.id
              return (
                <button
                  key={setMenu.id}
                  type="button"
                  onClick={() =>
                    setSelectedSetMenuId(selected ? null : setMenu.id)
                  }
                  className={cn(
                    'w-full min-h-[112px] text-left rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-between gap-2',
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-line bg-card hover:bg-card-hover'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink leading-5">
                        {setMenu.name}
                      </p>
                      <p className="text-xs text-accent font-semibold mt-0.5 tabular-nums">
                        <Money amount={setMenu.price} /> / khách (× {guestCount}{' '}
                        khách)
                      </p>
                    </div>
                    {selected && (
                      <CheckCircle2
                        className="w-5 h-5 text-accent shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="text-xs text-ink-muted line-clamp-2 min-h-[2rem]">
                    {setMenu.items.map((i) => i.menuItemName).join(' · ')}
                  </p>
                </button>
              )
            })}
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.key} className="space-y-2.5">
              <div className="space-y-0.5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-accent">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-[11px] text-ink-muted">{section.subtitle}</p>
                )}
              </div>

              <div className="space-y-2">
                {section.items.map((item) => {
                  const qty = quantities[item.id] ?? 0
                  const soldOut = item.status === 'SoldOut'
                  return (
                    <Card
                      key={item.id}
                      padding="sm"
                      className={cn('min-h-[72px] flex flex-col justify-center space-y-2', soldOut && 'opacity-70')}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-xs text-ink-muted">
                            <Money amount={item.price} />
                          </p>
                        </div>

                        {soldOut ? (
                          <button
                            type="button"
                            onClick={() => adjustQuantity(item, 1)}
                            className="min-h-[44px] px-2 flex items-center cursor-pointer"
                            aria-label={`${item.name} tạm hết`}
                          >
                            <StatusBadge status="SoldOut" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Giảm ${item.name}`}
                              disabled={qty === 0}
                              onClick={() => adjustQuantity(item, -1)}
                              className="min-w-[44px] min-h-[44px] rounded-lg border border-line bg-surface flex items-center justify-center text-ink hover:bg-card-hover disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span
                              data-testid={`qty-${item.id}`}
                              className="w-7 text-center text-sm font-bold tabular-nums text-ink"
                            >
                              {qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Tăng ${item.name}`}
                              onClick={() => adjustQuantity(item, 1)}
                              className="min-w-[44px] min-h-[44px] rounded-lg border border-line bg-surface flex items-center justify-center text-ink hover:bg-card-hover cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {qty > 0 && (
                        <Input
                          aria-label={`Ghi chú cho ${item.name}`}
                          placeholder="Ghi chú bếp (VD: Chín vừa, ít muối)..."
                          value={notes[item.id] ?? ''}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="min-h-[44px] text-xs"
                        />
                      )}
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="sticky bottom-[60px] z-20 -mx-4 bg-surface/95 backdrop-blur-xs border-t border-line px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-xs">
          <p className="text-ink-muted tabular-nums">{totalCount} món đã chọn</p>
          <p className="text-sm font-bold text-accent">
            <Money amount={totalAmount} />
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          className="min-h-[44px] shrink-0"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={handleConfirm}
        >
          {submitLabel(totalAmount, totalCount)}
        </Button>
      </div>
    </div>
  )
}
