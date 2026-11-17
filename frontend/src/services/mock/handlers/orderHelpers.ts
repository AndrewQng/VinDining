import { allocateSetMenuUnitPrices, getInitialOrderItemStatus } from '@/domain'
import type { OrderItemDto } from '@/types'
import { nextMockId } from '../db'
import type { MockDatabase } from '../seed'

/** Expands a tasting Set Menu into OrderItemDto entries priced via residual-safe allocation. */
export function expandSetMenuOrderItems(
  db: MockDatabase,
  orderId: string,
  tastingMenuId: string,
  guestCount: number,
  nowIso: string
): { items?: OrderItemDto[]; error?: string } {
  const setMenu = db.tastingMenus.find(
    (m) => m.id === tastingMenuId && m.isActive
  )
  if (!setMenu) {
    return { error: 'Không tìm thấy Set Menu đã chọn' }
  }

  const rawPrices: number[] = []
  for (const component of setMenu.items) {
    const menuItem = db.menuItems.find((m) => m.id === component.menuItemId)
    if (!menuItem) {
      return { error: `Không tìm thấy món "${component.menuItemName}" trong thực đơn` }
    }
    if (menuItem.status === 'SoldOut') {
      return { error: `Món "${menuItem.name}" hiện đang tạm hết` }
    }
    rawPrices.push(menuItem.price)
  }

  const unitPrices = allocateSetMenuUnitPrices(setMenu.price, rawPrices)
  const items: OrderItemDto[] = setMenu.items.map((component, idx) => {
    const status = getInitialOrderItemStatus(component.courseType)
    return {
      id: nextMockId('oi'),
      orderId,
      menuItemId: component.menuItemId,
      tastingMenuId: setMenu.id,
      itemName: component.menuItemName,
      courseType: component.courseType,
      quantity: guestCount,
      unitPrice: unitPrices[idx] ?? 0,
      status,
      note: null,
      isRemake: false,
      remakeCount: 0,
      isPriority: false,
      prepTimeMinutes: component.prepTimeMinutes,
      cookingStartedAt: status === 'Cooking' ? nowIso : null,
      servedAt: null,
      servedById: null,
    }
  })

  return { items }
}
