import { calculateDepositAmount, calculateInvoiceTotals } from '@/domain'
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

interface TableSpec {
  id: string
  num: string
  zone: TableZone
  capacity: number
}

interface SetSpec {
  id: string
  name: string
  price: number
  courses: ReadonlyArray<{
    menuItemId: string
    name: string
    courseType: 'Appetizer' | 'MainCourse' | 'Dessert'
    unitPrice: number
    prep: number
  }>
}

const EVENING_SLOTS: ReadonlyArray<readonly [number, number]> = [
  [18, 0],
  [18, 30],
  [19, 0],
  [19, 30],
  [20, 0],
]

const APPETIZERS: readonly DishSpec[] = [
  { id: 'item-sup-bao-ngu', name: 'Súp bào ngư thượng hạng', courseType: 'Appetizer', price: 350_000, prep: 12 },
  { id: 'item-goi-tom-hum', name: 'Gỏi tôm hùm sốt chanh leo', courseType: 'Appetizer', price: 420_000, prep: 10 },
]

const MAINS: readonly DishSpec[] = [
  { id: 'item-wagyu', name: 'Bò Wagyu A5 sốt nấm Truffle', courseType: 'MainCourse', price: 1_250_000, prep: 25 },
  { id: 'item-ca-tuyet', name: 'Cá tuyết nướng Miso mật ong', courseType: 'MainCourse', price: 680_000, prep: 20 },
]

const DESSERTS: readonly DishSpec[] = [
  { id: 'item-souffle', name: 'Bánh Soufflé sô-cô-la', courseType: 'Dessert', price: 220_000, prep: 15 },
  { id: 'item-panna-cotta', name: 'Panna cotta chanh dây', courseType: 'Dessert', price: 180_000, prep: 8 },
]

const BEVERAGES: readonly DishSpec[] = [
  { id: 'item-vang-do', name: 'Vang đỏ (ly)', courseType: 'Beverage', price: 450_000, prep: 0 },
  { id: 'item-nuoc-khoang', name: 'Nước khoáng có ga', courseType: 'Beverage', price: 120_000, prep: 0 },
]

const SET_MENUS: readonly SetSpec[] = [
  {
    id: 'set-thuong-hang',
    name: 'Set Menu Thượng Hạng',
    price: 1_800_000,
    courses: [
      { menuItemId: 'item-sup-bao-ngu', name: 'Súp bào ngư thượng hạng', courseType: 'Appetizer', unitPrice: 350_000, prep: 12 },
      { menuItemId: 'item-wagyu', name: 'Bò Wagyu A5 sốt nấm Truffle', courseType: 'MainCourse', unitPrice: 1_230_000, prep: 25 },
      { menuItemId: 'item-souffle', name: 'Bánh Soufflé sô-cô-la', courseType: 'Dessert', unitPrice: 220_000, prep: 15 },
    ],
  },
  {
    id: 'set-hai-san',
    name: 'Set Menu Hải Sản',
    price: 1_250_000,
    courses: [
      { menuItemId: 'item-goi-tom-hum', name: 'Gỏi tôm hùm sốt chanh leo', courseType: 'Appetizer', unitPrice: 420_000, prep: 10 },
      { menuItemId: 'item-ca-tuyet', name: 'Cá tuyết nướng Miso mật ong', courseType: 'MainCourse', unitPrice: 650_000, prep: 20 },
      { menuItemId: 'item-panna-cotta', name: 'Panna cotta chanh dây', courseType: 'Dessert', unitPrice: 180_000, prep: 8 },
    ],
  },
]

const ALL_TABLES: readonly TableSpec[] = [
  { id: 'tbl-b01', num: 'B01', zone: 'MainHall', capacity: 2 },
  { id: 'tbl-b02', num: 'B02', zone: 'MainHall', capacity: 2 },
  { id: 'tbl-b03', num: 'B03', zone: 'MainHall', capacity: 4 },
  { id: 'tbl-b04', num: 'B04', zone: 'MainHall', capacity: 4 },
  { id: 'tbl-b05', num: 'B05', zone: 'MainHall', capacity: 4 },
  { id: 'tbl-b06', num: 'B06', zone: 'MainHall', capacity: 6 },
  { id: 'tbl-b07', num: 'B07', zone: 'MainHall', capacity: 6 },
  { id: 'tbl-b08', num: 'B08', zone: 'MainHall', capacity: 8 },
  { id: 'tbl-v01', num: 'V01', zone: 'VIP', capacity: 6 },
  { id: 'tbl-v02', num: 'V02', zone: 'VIP', capacity: 8 },
  { id: 'tbl-v03', num: 'V03', zone: 'VIP', capacity: 10 },
  { id: 'tbl-c01', num: 'C01', zone: 'Balcony', capacity: 2 },
  { id: 'tbl-c02', num: 'C02', zone: 'Balcony', capacity: 2 },
  { id: 'tbl-c03', num: 'C03', zone: 'Balcony', capacity: 4 },
  { id: 'tbl-c04', num: 'C04', zone: 'Balcony', capacity: 4 },
]

const GUEST_NAMES: readonly string[] = [
  'Nguyễn Văn An',
  'Trần Minh Khôi',
  'Lê Thảo Vy',
  'Phạm Quốc Bảo',
  'Hoàng Gia Hân',
  'Vũ Đức Anh',
  'Đặng Ngọc Linh',
  'Bùi Quang Huy',
]

const COMMENTS: readonly string[] = [
  'Bò Wagyu nướng đúng độ, phục vụ tinh tế và lên món đều nhịp.',
  'Không gian VIP yên tĩnh, cá tuyết Miso rất vừa miệng.',
  'Trải nghiệm xứng đáng, đội ngũ phục vụ chu đáo từ lúc đón khách.',
  'Súp bào ngư đậm đà, tráng miệng trình bày đẹp.',
  'Bàn ban công thoáng mát, nhân viên hỗ trợ nhanh.',
  'Set Menu cân đối, rượu vang kết hợp hài hòa.',
]

const CANCEL_REASONS_REFUNDED: readonly string[] = [
  'Thay đổi kế hoạch gia đình trước giờ hẹn',
  'Khách điều chỉnh lịch họp sang ngày khác',
]

const CANCEL_REASONS_FORFEITED: readonly string[] = [
  'Khách báo thay đổi lịch công tác đột xuất',
  'Hủy sát giờ hẹn ngoài khung hoàn cọc quy định',
]

const METHODS: readonly PaymentMethod[] = ['VietQR', 'Card', 'Cash']

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

function pickPartySize(capacity: number, rng: () => number): number {
  if (capacity <= 2) return capacity === 1 ? 1 : rng() < 0.8 ? 2 : 1
  const minGuests = Math.max(2, Math.floor(capacity * 0.5))
  return minGuests + Math.floor(rng() * (capacity - minGuests + 1))
}

function buildOrderItemsForDinner(
  orderId: string,
  slotDate: Date,
  partySize: number,
  chosenSet: SetSpec | null,
  rng: () => number
): OrderItemDto[] {
  const slotIso = slotDate.toISOString()
  const items: OrderItemDto[] = []
  let idx = 1

  if (chosenSet) {
    for (const c of chosenSet.courses) {
      const startOffset =
        c.courseType === 'Appetizer' ? 0 : c.courseType === 'MainCourse' ? 24 : 58
      const endOffset = startOffset + Math.max(8, c.prep)
      items.push({
        id: `oi-${orderId}-${idx++}`,
        orderId,
        menuItemId: c.menuItemId,
        tastingMenuId: chosenSet.id,
        itemName: c.name,
        courseType: c.courseType,
        quantity: partySize,
        unitPrice: c.unitPrice,
        status: 'Served',
        note: null,
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        prepTimeMinutes: c.prep,
        cookingStartedAt: new Date(slotDate.getTime() + startOffset * 60_000).toISOString(),
        servedAt: new Date(slotDate.getTime() + endOffset * 60_000).toISOString(),
        servedById: 'staff-expediter-1',
      })
    }
    if (rng() < 0.7) {
      const drink = pick(BEVERAGES, rng)
      items.push({
        id: `oi-${orderId}-${idx++}`,
        orderId,
        menuItemId: drink.id,
        tastingMenuId: null,
        itemName: drink.name,
        courseType: 'Beverage',
        quantity: partySize,
        unitPrice: drink.price,
        status: 'Served',
        note: null,
        isRemake: false,
        remakeCount: 0,
        isPriority: false,
        prepTimeMinutes: 0,
        cookingStartedAt: slotIso,
        servedAt: new Date(slotDate.getTime() + 6 * 60_000).toISOString(),
        servedById: 'staff-expediter-1',
      })
    }
    return items
  }

  const starter = pick(APPETIZERS, rng)
  const main = pick(MAINS, rng)
  const dessert = pick(DESSERTS, rng)
  const drink = pick(BEVERAGES, rng)

  const courseEntries: Array<{
    dish: DishSpec
    qty: number
    startMin: number
    endMin: number
  }> = [
    { dish: drink, qty: partySize, startMin: 0, endMin: 5 },
    { dish: starter, qty: Math.max(1, Math.ceil(partySize * 0.75)), startMin: 2, endMin: 14 },
    { dish: main, qty: partySize, startMin: 22, endMin: 46 },
    { dish: dessert, qty: Math.max(1, Math.floor(partySize / 2)), startMin: 56, endMin: 72 },
  ]

  for (const entry of courseEntries) {
    items.push({
      id: `oi-${orderId}-${idx++}`,
      orderId,
      menuItemId: entry.dish.id,
      tastingMenuId: null,
      itemName: entry.dish.name,
      courseType: entry.dish.courseType,
      quantity: entry.qty,
      unitPrice: entry.dish.price,
      status: 'Served',
      note: null,
      isRemake: false,
      remakeCount: 0,
      isPriority: false,
      prepTimeMinutes: entry.dish.prep,
      cookingStartedAt: new Date(slotDate.getTime() + entry.startMin * 60_000).toISOString(),
      servedAt: new Date(slotDate.getTime() + entry.endMin * 60_000).toISOString(),
      servedById: 'staff-expediter-1',
    })
  }
  return items
}

/**
 * Generates deterministic 120-evening history (strictly §10 slots, dishes, prices,
 * weekday occupancy variance, cancellations, and feedbacks) without bloating bundle size.
 */
function buildHistorical120DayData(now: Date): HistoricalSeedBundle {
  const rng = createSeededRng(20261117)
  const reservations: ReservationDto[] = []
  const orders: OrderDto[] = []
  const invoices: InvoiceDto[] = []
  const feedbacks: FeedbackDto[] = []

  let dinnerSeq = 1
  let cancelSeq = 1

  for (let daysBack = 120; daysBack >= 1; daysBack--) {
    const dayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysBack
    )
    const dow = dayDate.getDay()
    const isWeekend = dow === 0 || dow === 5 || dow === 6
    const fillRatio = isWeekend
      ? 0.65 + rng() * 0.25
      : 0.35 + rng() * 0.2

    // 15 tables x 2 non-overlapping evening seatings = 30 slots
    const candidateSlots: Array<{ table: TableSpec; wave: 0 | 1 }> = []
    for (const table of ALL_TABLES) {
      candidateSlots.push({ table, wave: 0 })
      candidateSlots.push({ table, wave: 1 })
    }
    shuffle(candidateSlots, rng)

    const targetDinners = Math.max(
      1,
      Math.round(candidateSlots.length * fillRatio)
    )
    const chosenDinners = candidateSlots.slice(0, targetDinners)
    const remainingSlots = candidateSlots.slice(targetDinners)

    const doubleBookedTables = new Set<string>()
    const seenByTable = new Set<string>()
    for (const s of chosenDinners) {
      if (seenByTable.has(s.table.id)) {
        doubleBookedTables.add(s.table.id)
      } else {
        seenByTable.add(s.table.id)
      }
    }

    for (const slotChoice of chosenDinners) {
      const idx = dinnerSeq++
      const [slotH, slotM] = doubleBookedTables.has(slotChoice.table.id)
        ? slotChoice.wave === 0
          ? ([18, 0] as const)
          : ([20, 0] as const)
        : pick(EVENING_SLOTS, rng)

      const slotDate = new Date(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate(),
        slotH,
        slotM,
        0,
        0
      )
      const slotIso = slotDate.toISOString()
      const closedIso = new Date(slotDate.getTime() + 95 * 60_000).toISOString()
      const guestCount = pickPartySize(slotChoice.table.capacity, rng)
      const guestName = pick(GUEST_NAMES, rng)
      const useSetMenu = rng() < 0.4
      const chosenSet = useSetMenu ? pick(SET_MENUS, rng) : null

      const resId = `res-hist-${idx}`
      const orderId = `ord-hist-${idx}`
      const invoiceId = `inv-hist-${idx}`
      const depositAmount = calculateDepositAmount({
        guestCount,
        setMenuPricePerGuest: chosenSet?.price ?? null,
      })
      const items = buildOrderItemsForDinner(
        orderId,
        slotDate,
        guestCount,
        chosenSet,
        rng
      )
      const totals = calculateInvoiceTotals(items, depositAmount)

      reservations.push({
        id: resId,
        bookingCode: `VD-H${String(idx).padStart(4, '0')}`,
        guest: {
          id: `guest-hist-${idx}`,
          fullName: guestName,
          phoneNumber: `0901${String(100000 + (idx % 899999))}`,
          email: `khach.${idx}@email.com`,
        },
        tableId: slotChoice.table.id,
        tableNumber: slotChoice.table.num,
        zone: slotChoice.table.zone,
        reservationTime: slotIso,
        partySize: guestCount,
        preOrderedTastingMenuId: chosenSet?.id ?? null,
        preOrderedTastingMenuName: chosenSet?.name ?? null,
        durationMinutes: 120,
        status: 'Reserved',
        note: null,
        cancelledAt: null,
        cancelledReason: null,
        holdExpiresAt: null,
        reminderSentAt: null,
        createdAt: new Date(slotDate.getTime() - 24 * 3600_000).toISOString(),
        deposit: {
          id: `dep-hist-${idx}`,
          reservationId: resId,
          amount: depositAmount,
          transactionId: `VNP-H-${idx}`,
          paymentMethod: rng() < 0.65 ? 'VietQR' : 'Card',
          status: 'Paid',
          paidAt: new Date(slotDate.getTime() - 23 * 3600_000).toISOString(),
          refundAmount: null,
          createdAt: new Date(slotDate.getTime() - 24 * 3600_000).toISOString(),
        },
      })

      orders.push({
        id: orderId,
        tableId: slotChoice.table.id,
        tableNumber: slotChoice.table.num,
        reservationId: resId,
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
        tableId: slotChoice.table.id,
        tableNumber: slotChoice.table.num,
        settleById: 'staff-cashier-1',
        settleByName: 'Phạm Thu Hà',
        guestCount,
        waiterName: 'Trần Thị Mai',
        items,
        ...totals,
        paymentMethod: pick(METHODS, rng),
        isPaid: true,
        surveyToken: `survey-hist-${idx}`,
        surveySentAt: closedIso,
        createdAt: closedIso,
      })

      if (rng() < 0.3) {
        feedbacks.push({
          id: `fb-hist-${idx}`,
          reservationId: resId,
          invoiceId,
          guestName,
          tableNumber: slotChoice.table.num,
          foodRating: rng() < 0.65 ? 5 : 4,
          ambienceRating: rng() < 0.7 ? 5 : 4,
          serviceRating: rng() < 0.6 ? 5 : 4,
          comment: pick(COMMENTS, rng),
          createdAt: new Date(slotDate.getTime() + 135 * 60_000).toISOString(),
        })
      }
    }

    // Add ~8% historical cancellations across refunded and forfeited outcomes
    const cancelTarget = Math.min(
      remainingSlots.length,
      Math.max(1, Math.round(targetDinners * 0.085))
    )
    for (let c = 0; c < cancelTarget; c++) {
      const slotChoice = remainingSlots[c]
      const idx = cancelSeq++
      const [slotH, slotM] = pick(EVENING_SLOTS, rng)
      const slotDate = new Date(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate(),
        slotH,
        slotM,
        0,
        0
      )
      const guestCount = pickPartySize(slotChoice.table.capacity, rng)
      const chosenSet = rng() < 0.35 ? pick(SET_MENUS, rng) : null
      const depositAmount = calculateDepositAmount({
        guestCount,
        setMenuPricePerGuest: chosenSet?.price ?? null,
      })
      const isRefunded = idx % 2 === 1
      const resId = `res-hist-c-${idx}`

      reservations.push({
        id: resId,
        bookingCode: `VD-C${String(idx).padStart(4, '0')}`,
        guest: {
          id: `guest-hist-c-${idx}`,
          fullName: pick(GUEST_NAMES, rng),
          phoneNumber: `0902${String(100000 + (idx % 899999))}`,
          email: `huy.${idx}@email.com`,
        },
        tableId: slotChoice.table.id,
        tableNumber: slotChoice.table.num,
        zone: slotChoice.table.zone,
        reservationTime: slotDate.toISOString(),
        partySize: guestCount,
        preOrderedTastingMenuId: chosenSet?.id ?? null,
        preOrderedTastingMenuName: chosenSet?.name ?? null,
        durationMinutes: 120,
        status: isRefunded ? 'Cancelled_Refunded' : 'RefundRejected',
        note: null,
        cancelledAt: new Date(
          slotDate.getTime() - (isRefunded ? 6 : 2) * 3600_000
        ).toISOString(),
        cancelledReason: isRefunded
          ? pick(CANCEL_REASONS_REFUNDED, rng)
          : pick(CANCEL_REASONS_FORFEITED, rng),
        holdExpiresAt: null,
        reminderSentAt: null,
        createdAt: new Date(slotDate.getTime() - 28 * 3600_000).toISOString(),
        deposit: {
          id: `dep-hist-c-${idx}`,
          reservationId: resId,
          amount: depositAmount,
          transactionId: `VNP-HC-${idx}`,
          paymentMethod: rng() < 0.5 ? 'VietQR' : 'Card',
          status: isRefunded ? 'Refunded' : 'Forfeited',
          paidAt: new Date(slotDate.getTime() - 27 * 3600_000).toISOString(),
          refundAmount: isRefunded ? depositAmount : 0,
          createdAt: new Date(slotDate.getTime() - 28 * 3600_000).toISOString(),
        },
      })
    }
  }

  return { reservations, orders, invoices, feedbacks }
}

let cachedDayKey: string | null = null
let cachedBundle: HistoricalSeedBundle | null = null

/** Memoizes deterministic 120-day history per calendar day to avoid localStorage 5MB quota overflow. */
export function getHistorical120DayData(now: Date = new Date()): HistoricalSeedBundle {
  const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  if (cachedDayKey === dayKey && cachedBundle) {
    return cachedBundle
  }
  cachedDayKey = dayKey
  cachedBundle = buildHistorical120DayData(now)
  return cachedBundle
}
