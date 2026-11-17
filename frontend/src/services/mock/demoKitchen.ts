import type { OrderDto, OrderItemDto } from '@/types'
import { getMockDb, saveMockDb } from './db'

function makeDemoItem(
  orderId: string,
  idx: number,
  partial: Pick<
    OrderItemDto,
    | 'menuItemId'
    | 'itemName'
    | 'courseType'
    | 'quantity'
    | 'unitPrice'
    | 'status'
    | 'prepTimeMinutes'
    | 'cookingStartedAt'
  > & { note?: string | null }
): OrderItemDto {
  return {
    id: `oi-demo-${orderId}-${idx}`,
    orderId,
    menuItemId: partial.menuItemId,
    tastingMenuId: null,
    itemName: partial.itemName,
    courseType: partial.courseType,
    quantity: partial.quantity,
    unitPrice: partial.unitPrice,
    status: partial.status,
    note: partial.note ?? null,
    isRemake: false,
    remakeCount: 0,
    isPriority: false,
    prepTimeMinutes: partial.prepTimeMinutes,
    cookingStartedAt: partial.cookingStartedAt,
    servedAt: null,
    servedById: null,
  }
}

/**
 * Populates mock DB with extra active orders across tables so KDS & Pass demonstrate
 * 2-page overflow (`Trang 1 / 2`) alongside overdue, warning (>=80%), and remake tickets.
 * Triggered only via `?demo=full` in mock mode (never shown as product UI).
 */
export function seedFullKitchenDemo(now: Date = new Date()): void {
  const db = getMockDb()
  if (db.orders.some((o) => o.id === 'ord-demo-kds-b01')) {
    return
  }

  const minsAgo = (m: number) =>
    new Date(now.getTime() - m * 60_000).toISOString()

  const extraOrders: OrderDto[] = [
    {
      id: 'ord-demo-kds-b01',
      tableId: 'tbl-b01',
      tableNumber: 'B01',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 2,
      openedAt: minsAgo(15),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-b01', 1, {
          menuItemId: 'item-goi-tom-hum',
          itemName: 'Gỏi tôm hùm sốt chanh leo',
          courseType: 'Appetizer',
          quantity: 2,
          unitPrice: 420_000,
          status: 'Cooking',
          prepTimeMinutes: 10,
          cookingStartedAt: minsAgo(12), // 12/10 = overdue (+02:00)
        }),
        makeDemoItem('ord-demo-kds-b01', 2, {
          menuItemId: 'item-wagyu',
          itemName: 'Bò Wagyu A5 sốt nấm Truffle',
          courseType: 'MainCourse',
          quantity: 2,
          unitPrice: 1_250_000,
          status: 'OnHold',
          prepTimeMinutes: 25,
          cookingStartedAt: null,
          note: 'Chín vừa',
        }),
      ],
    },
    {
      id: 'ord-demo-kds-b06',
      tableId: 'tbl-b06',
      tableNumber: 'B06',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 6,
      openedAt: minsAgo(8),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-b06', 1, {
          menuItemId: 'item-sup-bao-ngu',
          itemName: 'Súp bào ngư thượng hạng',
          courseType: 'Appetizer',
          quantity: 6,
          unitPrice: 350_000,
          status: 'Cooking',
          prepTimeMinutes: 12,
          cookingStartedAt: minsAgo(6),
        }),
        makeDemoItem('ord-demo-kds-b06', 2, {
          menuItemId: 'item-ca-tuyet',
          itemName: 'Cá tuyết nướng Miso mật ong',
          courseType: 'MainCourse',
          quantity: 6,
          unitPrice: 680_000,
          status: 'OnHold',
          prepTimeMinutes: 20,
          cookingStartedAt: null,
        }),
      ],
    },
    {
      id: 'ord-demo-kds-v01',
      tableId: 'tbl-v01',
      tableNumber: 'V01',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 6,
      openedAt: minsAgo(20),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-v01', 1, {
          menuItemId: 'item-wagyu',
          itemName: 'Bò Wagyu A5 sốt nấm Truffle',
          courseType: 'MainCourse',
          quantity: 6,
          unitPrice: 1_250_000,
          status: 'Cooking',
          prepTimeMinutes: 25,
          cookingStartedAt: minsAgo(10),
        }),
        makeDemoItem('ord-demo-kds-v01', 2, {
          menuItemId: 'item-souffle',
          itemName: 'Bánh Soufflé sô-cô-la',
          courseType: 'Dessert',
          quantity: 6,
          unitPrice: 220_000,
          status: 'OnHold',
          prepTimeMinutes: 15,
          cookingStartedAt: null,
        }),
      ],
    },
    {
      id: 'ord-demo-kds-v02',
      tableId: 'tbl-v02',
      tableNumber: 'V02',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 4,
      openedAt: minsAgo(14),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-v02', 1, {
          menuItemId: 'item-souffle',
          itemName: 'Bánh Soufflé sô-cô-la',
          courseType: 'Dessert',
          quantity: 4,
          unitPrice: 220_000,
          status: 'Cooking',
          prepTimeMinutes: 15,
          cookingStartedAt: minsAgo(7),
        }),
      ],
    },
    {
      id: 'ord-demo-kds-c01',
      tableId: 'tbl-c01',
      tableNumber: 'C01',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 2,
      openedAt: minsAgo(11),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-c01', 1, {
          menuItemId: 'item-sup-bao-ngu',
          itemName: 'Súp bào ngư thượng hạng',
          courseType: 'Appetizer',
          quantity: 2,
          unitPrice: 350_000,
          status: 'Cooking',
          prepTimeMinutes: 12,
          cookingStartedAt: minsAgo(4),
        }),
      ],
    },
    {
      id: 'ord-demo-kds-c02',
      tableId: 'tbl-c02',
      tableNumber: 'C02',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 2,
      openedAt: minsAgo(9),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-c02', 1, {
          menuItemId: 'item-panna-cotta',
          itemName: 'Panna cotta chanh dây',
          courseType: 'Dessert',
          quantity: 2,
          unitPrice: 180_000,
          status: 'Cooking',
          prepTimeMinutes: 8,
          cookingStartedAt: minsAgo(3),
        }),
      ],
    },
    {
      id: 'ord-demo-kds-c03',
      tableId: 'tbl-c03',
      tableNumber: 'C03',
      reservationId: null,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Active',
      guestCount: 4,
      openedAt: minsAgo(6),
      closedAt: null,
      items: [
        makeDemoItem('ord-demo-kds-c03', 1, {
          menuItemId: 'item-ca-tuyet',
          itemName: 'Cá tuyết nướng Miso mật ong',
          courseType: 'MainCourse',
          quantity: 4,
          unitPrice: 680_000,
          status: 'Cooking',
          prepTimeMinutes: 20,
          cookingStartedAt: minsAgo(2),
        }),
        makeDemoItem('ord-demo-kds-c03', 2, {
          menuItemId: 'item-panna-cotta',
          itemName: 'Panna cotta chanh dây',
          courseType: 'Dessert',
          quantity: 4,
          unitPrice: 180_000,
          status: 'OnHold',
          prepTimeMinutes: 8,
          cookingStartedAt: null,
        }),
      ],
    },
  ]

  db.orders.push(...extraOrders)
  for (const ord of extraOrders) {
    const tbl = db.tables.find((t) => t.id === ord.tableId)
    if (tbl) {
      tbl.status = 'Occupied'
      tbl.currentOrderId = ord.id
      tbl.guestCount = ord.guestCount
    }
  }
  saveMockDb(db)
}
