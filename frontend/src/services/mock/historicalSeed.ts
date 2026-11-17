import { calculateInvoiceTotals } from '@/domain'
import type {
  FeedbackDto,
  InvoiceDto,
  OrderDto,
  OrderItemDto,
  PaymentMethod,
  ReservationDto,
  TableZone,
} from '@/types'

export interface HistoricalSeedBundle {
  reservations: ReservationDto[]
  orders: OrderDto[]
  invoices: InvoiceDto[]
  feedbacks: FeedbackDto[]
}

interface DishSpec {
  id: string
  name: string
  courseType: OrderItemDto['courseType']
  price: number
  prep: number
}

const DEMO_DISHES: readonly DishSpec[] = [
  { id: 'item-wagyu', name: 'Bò Wagyu A5 sốt nấm Truffle', courseType: 'MainCourse', price: 1_250_000, prep: 25 },
  { id: 'item-ca-tuyet', name: 'Cá tuyết nướng Miso mật ong', courseType: 'MainCourse', price: 680_000, prep: 20 },
  { id: 'item-sup-bao-ngu', name: 'Súp bào ngư thượng hạng', courseType: 'Appetizer', price: 350_000, prep: 12 },
  { id: 'item-goi-tom-hum', name: 'Gỏi tôm hùm sốt chanh leo', courseType: 'Appetizer', price: 420_000, prep: 10 },
  { id: 'item-souffle', name: 'Bánh Soufflé sô-cô-la', courseType: 'Dessert', price: 220_000, prep: 15 },
  { id: 'item-panna-cotta', name: 'Panna cotta chanh dây', courseType: 'Dessert', price: 180_000, prep: 8 },
  { id: 'item-vang-do', name: 'Vang đỏ (ly)', courseType: 'Beverage', price: 450_000, prep: 0 },
  { id: 'item-nuoc-khoang', name: 'Nước khoáng có ga', courseType: 'Beverage', price: 120_000, prep: 0 },
]

const TABLE_POOL: ReadonlyArray<{ id: string; num: string; zone: TableZone }> = [
  { id: 'tbl-b01', num: 'B01', zone: 'MainHall' },
  { id: 'tbl-b03', num: 'B03', zone: 'MainHall' },
  { id: 'tbl-b05', num: 'B05', zone: 'MainHall' },
  { id: 'tbl-v01', num: 'V01', zone: 'VIP' },
  { id: 'tbl-v02', num: 'V02', zone: 'VIP' },
  { id: 'tbl-v03', num: 'V03', zone: 'VIP' },
  { id: 'tbl-c01', num: 'C01', zone: 'Balcony' },
  { id: 'tbl-c03', num: 'C03', zone: 'Balcony' },
]

const COMMENTS: readonly string[] = [
  'Bò Wagyu nướng đúng độ, phục vụ tinh tế và lên món đều nhịp.',
  'Không gian VIP yên tĩnh, cá tuyết Miso rất vừa miệng.',
  'Trải nghiệm xứng đáng, đội ngũ phục vụ chu đáo từ lúc đón khách.',
  'Súp bào ngư đậm đà, tráng miệng trình bày đẹp.',
  'Bàn ban công thoáng mát, nhân viên hỗ trợ nhanh.',
  'Set Menu cân đối, rượu vang kết hợp hài hòa.',
]

const METHODS: readonly PaymentMethod[] = ['VietQR', 'Card', 'Cash']

/**
 * Generates deterministic 120-day dining history (>= 2 days old) using strictly
 * §10 dishes, prices, and tables so reports M5 / M5x compute authentic metrics.
 */
export function buildHistorical120DayData(now: Date): HistoricalSeedBundle {
  const reservations: ReservationDto[] = []
  const orders: OrderDto[] = []
  const invoices: InvoiceDto[] = []
  const feedbacks: FeedbackDto[] = []

  const daysBackOffsets = [
    2, 3, 4, 5, 7, 9, 11, 14, 17, 20, 23, 26,
    31, 35, 39, 44, 49, 54, 59,
    64, 70, 76, 82, 88, 94, 101, 108, 115,
  ]

  daysBackOffsets.forEach((daysBack, idx) => {
    const slotDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysBack,
      19,
      (idx % 2) * 30,
      0,
      0
    )
    const slotIso = slotDate.toISOString()
    const closedIso = new Date(slotDate.getTime() + 95 * 60_000).toISOString()
    const tbl = TABLE_POOL[idx % TABLE_POOL.length]
    const guestCount = idx % 3 === 0 ? 4 : idx % 3 === 1 ? 6 : 2
    const mainDish = DEMO_DISHES[idx % 2]
    const starterDish = DEMO_DISHES[2 + (idx % 2)]
    const dessertDish = DEMO_DISHES[4 + (idx % 2)]
    const drinkDish = DEMO_DISHES[6 + (idx % 2)]

    const orderId = `ord-hist-${idx + 1}`
    const items: OrderItemDto[] = [
      {
        id: `oi-hist-${idx + 1}-1`,
        orderId,
        menuItemId: starterDish.id,
        tastingMenuId: null,
        itemName: starterDish.name,
        courseType: starterDish.courseType,
        quantity: guestCount,
        unitPrice: starterDish.price,
        status: 'Served',
        note: null,
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        prepTimeMinutes: starterDish.prep,
        cookingStartedAt: slotIso,
        servedAt: new Date(slotDate.getTime() + 14 * 60_000).toISOString(),
        servedById: 'staff-expediter-1',
      },
      {
        id: `oi-hist-${idx + 1}-2`,
        orderId,
        menuItemId: mainDish.id,
        tastingMenuId: null,
        itemName: mainDish.name,
        courseType: mainDish.courseType,
        quantity: guestCount,
        unitPrice: mainDish.price,
        status: 'Served',
        note: null,
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        prepTimeMinutes: mainDish.prep,
        cookingStartedAt: new Date(slotDate.getTime() + 25 * 60_000).toISOString(),
        servedAt: new Date(slotDate.getTime() + 50 * 60_000).toISOString(),
        servedById: 'staff-expediter-1',
      },
      {
        id: `oi-hist-${idx + 1}-3`,
        orderId,
        menuItemId: dessertDish.id,
        tastingMenuId: null,
        itemName: dessertDish.name,
        courseType: dessertDish.courseType,
        quantity: Math.max(2, Math.floor(guestCount / 2)),
        unitPrice: dessertDish.price,
        status: 'Served',
        note: null,
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        prepTimeMinutes: dessertDish.prep,
        cookingStartedAt: new Date(slotDate.getTime() + 60 * 60_000).toISOString(),
        servedAt: new Date(slotDate.getTime() + 75 * 60_000).toISOString(),
        servedById: 'staff-expediter-1',
      },
      {
        id: `oi-hist-${idx + 1}-4`,
        orderId,
        menuItemId: drinkDish.id,
        tastingMenuId: null,
        itemName: drinkDish.name,
        courseType: drinkDish.courseType,
        quantity: guestCount,
        unitPrice: drinkDish.price,
        status: 'Served',
        note: null,
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        prepTimeMinutes: drinkDish.prep,
        cookingStartedAt: slotIso,
        servedAt: new Date(slotDate.getTime() + 5 * 60_000).toISOString(),
        servedById: 'staff-expediter-1',
      },
    ]

    const depositAmount = guestCount * 500_000
    const totals = calculateInvoiceTotals(items, depositAmount)
    const invoiceId = `inv-hist-${idx + 1}`

    orders.push({
      id: orderId,
      tableId: tbl.id,
      tableNumber: tbl.num,
      reservationId: `res-hist-${idx + 1}`,
      createById: 'staff-waitstaff-1',
      createByName: 'Trần Thị Mai',
      status: 'Paid',
      guestCount,
      openedAt: slotIso,
      closedAt: closedIso,
      items,
    })

    invoices.push({
      id: invoiceId,
      orderId,
      tableId: tbl.id,
      tableNumber: tbl.num,
      settleById: 'staff-cashier-1',
      settleByName: 'Phạm Thu Hà',
      guestCount,
      waiterName: 'Trần Thị Mai',
      items,
      ...totals,
      paymentMethod: METHODS[idx % METHODS.length],
      isPaid: true,
      surveyToken: `survey-hist-${idx + 1}`,
      surveySentAt: closedIso,
      createdAt: closedIso,
    })

    const isCancelled = idx % 7 === 0
    reservations.push({
      id: `res-hist-${idx + 1}`,
      bookingCode: `VD-H${String(idx + 10).padStart(3, '0')}`,
      guest: {
        id: `guest-hist-${idx + 1}`,
        fullName: 'Nguyễn Văn An',
        phoneNumber: '0901 234 567',
        email: 'an.nguyen@email.com',
      },
      tableId: tbl.id,
      tableNumber: tbl.num,
      zone: tbl.zone,
      reservationTime: slotIso,
      partySize: guestCount,
      preOrderedTastingMenuId: null,
      preOrderedTastingMenuName: null,
      durationMinutes: 120,
      status: isCancelled ? 'Cancelled_Refunded' : 'Reserved',
      note: null,
      cancelledAt: isCancelled ? new Date(slotDate.getTime() - 6 * 3600_000).toISOString() : null,
      cancelledReason: isCancelled ? 'Thay đổi kế hoạch gia đình' : null,
      holdExpiresAt: null,
      reminderSentAt: null,
      createdAt: new Date(slotDate.getTime() - 24 * 3600_000).toISOString(),
      deposit: {
        id: `dep-hist-${idx + 1}`,
        reservationId: `res-hist-${idx + 1}`,
        amount: depositAmount,
        transactionId: `VNP-H-${idx + 1}`,
        paymentMethod: 'VietQR',
        status: isCancelled ? 'Refunded' : 'Paid',
        paidAt: new Date(slotDate.getTime() - 23 * 3600_000).toISOString(),
        refundAmount: isCancelled ? depositAmount : null,
        createdAt: new Date(slotDate.getTime() - 24 * 3600_000).toISOString(),
      },
    })

    if (idx % 3 === 0) {
      feedbacks.push({
        id: `fb-hist-${idx + 1}`,
        reservationId: `res-hist-${idx + 1}`,
        invoiceId,
        guestName: 'Nguyễn Văn An',
        tableNumber: tbl.num,
        foodRating: idx % 2 === 0 ? 5 : 4,
        ambienceRating: 5,
        serviceRating: idx % 4 === 0 ? 4 : 5,
        comment: COMMENTS[idx % COMMENTS.length],
        createdAt: new Date(slotDate.getTime() + 130 * 60_000).toISOString(),
      })
    }
  })

  return { reservations, orders, invoices, feedbacks }
}
