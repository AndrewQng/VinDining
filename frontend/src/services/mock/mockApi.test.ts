import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ALL_MOCK_ROUTES,
  DEMO_STAFF_ACCOUNTS,
  getMockDb,
  installMockAdapter,
  resetMockDb,
  runExpiryScan,
} from './index'
import { getHistorical120DayData } from './historicalSeed'
import {
  createInitialMockDb,
  MOCK_DB_VERSION,
  MOCK_SEED_VERSION,
} from './seed'

function createTestClient(nowProvider: () => Date = () => new Date()) {
  const client = axios.create({ baseURL: 'http://localhost/api' })
  installMockAdapter(client, { minLatencyMs: 0, maxLatencyMs: 0, nowProvider })
  return client
}

async function loginAs(
  client: ReturnType<typeof createTestClient>,
  username: string,
  password = 'VinDining@2026'
): Promise<string> {
  const res = await client.post<{ token: string }>('/auth/login', {
    username,
    password,
  })
  return res.data.token
}

describe('Mock API router & RBAC', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('registers all 59 unique routes from docs/api.md', () => {
    expect(ALL_MOCK_ROUTES).toHaveLength(59)
    const ids = new Set(ALL_MOCK_ROUTES.map((r) => r.id))
    expect(ids.size).toBe(59)
  })

  it('enforces 401 for unauthenticated staff calls and 403 for disallowed roles', async () => {
    const client = createTestClient()

    await expect(client.get('/tables')).rejects.toMatchObject({
      response: { status: 401 },
    })

    const waitstaffToken = await loginAs(client, 'mai.tt')
    await expect(
      client.get('/manager/staff', {
        headers: { Authorization: `Bearer ${waitstaffToken}` },
      })
    ).rejects.toMatchObject({ response: { status: 403 } })

    const managerToken = await loginAs(client, 'long.dh')
    const staffList = await client.get('/manager/staff', {
      headers: { Authorization: `Bearer ${managerToken}` },
    })
    expect(staffList.status).toBe(200)
    expect(staffList.data).toHaveLength(DEMO_STAFF_ACCOUNTS.length)
  })

  it('locks staff account on 5th failed login and unlocks after 15 minutes', async () => {
    let now = new Date('2026-11-06T10:00:00.000Z')
    const client = createTestClient(() => now)

    for (let i = 0; i < 4; i += 1) {
      await expect(
        client.post('/auth/login', { username: 'mai.tt', password: 'wrong' })
      ).rejects.toMatchObject({ response: { status: 401 } })
    }

    await expect(
      client.post('/auth/login', { username: 'mai.tt', password: 'wrong' })
    ).rejects.toMatchObject({
      response: {
        status: 423,
        data: { code: 'ACCOUNT_LOCKED', remainingMinutes: 15 },
      },
    })

    // Even correct password is blocked while locked
    await expect(
      client.post('/auth/login', {
        username: 'mai.tt',
        password: 'VinDining@2026',
      })
    ).rejects.toMatchObject({ response: { status: 423 } })

    // Advance 15 minutes -> unlocks
    now = new Date('2026-11-06T10:15:01.000Z')
    const loginOk = await client.post('/auth/login', {
      username: 'mai.tt',
      password: 'VinDining@2026',
    })
    expect(loginOk.status).toBe(200)
    expect(loginOk.data.user.role).toBe('Waitstaff')
  })
})

describe('Mock API §10 end-to-end stories', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('executes B05 (VD-7K3Q) check-in -> course firing -> serve -> invoice 6.156.000 ₫', async () => {
    const client = createTestClient()
    const waitstaffToken = await loginAs(client, 'mai.tt')
    const expediterToken = await loginAs(client, 'quan.lm')
    const cashierToken = await loginAs(client, 'ha.pt')

    const checkIn = await client.post(
      '/tables/tbl-b05/check-in',
      { reservationCode: 'VD-7K3Q' },
      { headers: { Authorization: `Bearer ${waitstaffToken}` } }
    )
    const order = checkIn.data.order
    expect(order.items).toHaveLength(3)
    expect(order.items[0].status).toBe('Cooking')
    expect(order.items[1].status).toBe('OnHold')
    expect(order.items[2].status).toBe('OnHold')

    await client.post(
      `/orders/${order.id}/fire-course`,
      { courseType: 'MainCourse' },
      { headers: { Authorization: `Bearer ${waitstaffToken}` } }
    )
    await client.post(
      `/orders/${order.id}/fire-course`,
      { courseType: 'Dessert' },
      { headers: { Authorization: `Bearer ${waitstaffToken}` } }
    )

    for (const item of order.items) {
      await client.patch(
        `/orders/${order.id}/items/${item.id}/serve`,
        {},
        { headers: { Authorization: `Bearer ${expediterToken}` } }
      )
    }

    const preview = await client.get('/invoices/preview/tbl-b05', {
      headers: { Authorization: `Bearer ${cashierToken}` },
    })
    expect(preview.data).toMatchObject({
      subtotal: 7_200_000,
      serviceCharge: 360_000,
      vatAmount: 756_000,
      totalAmount: 8_316_000,
      deductedDeposit: 2_160_000,
      amountDue: 6_156_000,
      hasUnservedItems: false,
    })
  })

  it('computes B04 below-deposit invoice preview as 0 ₫', async () => {
    const client = createTestClient()
    const cashierToken = await loginAs(client, 'ha.pt')
    const preview = await client.get('/invoices/preview/tbl-b04', {
      headers: { Authorization: `Bearer ${cashierToken}` },
    })
    expect(preview.data).toMatchObject({
      subtotal: 240_000,
      totalAmount: 277_200,
      deductedDeposit: 1_000_000,
      amountDue: 0,
    })
  })

  it('creates hold reservation, handles VNPAY IPN, and expires holds after 17 min', async () => {
    const baseTime = new Date('2026-11-06T12:00:00.000Z')
    const client = createTestClient(() => baseTime)

    const created = await client.post('/reservations', {
      tableId: 'tbl-b06',
      reservationTime: '2026-11-06T19:00:00.000Z',
      partySize: 4,
      preOrderedTastingMenuId: 'set-hai-san',
      fullName: 'Nguyễn Văn An',
      phoneNumber: '0901 234 567',
      email: 'an.nguyen@email.com',
    })
    expect(created.status).toBe(201)
    expect(created.data.depositAmount).toBe(1_500_000)

    const code = created.data.reservation.bookingCode
    const ipn = await client.post('/payments/vnpay-ipn', {
      bookingCode: code,
      transactionId: 'VNP-OK-123',
      paymentMethod: 'VietQR',
      responseCode: '00',
    })
    expect(ipn.data.reservation.status).toBe('Reserved')

    // Concurrent booking on the same table and overlapping slot returns 409
    await expect(
      client.post('/reservations', {
        tableId: 'tbl-b06',
        reservationTime: '2026-11-06T19:30:00.000Z',
        partySize: 4,
        preOrderedTastingMenuId: null,
        fullName: 'Khách Thứ Hai',
        phoneNumber: '0902 222 333',
        email: 'khach2@email.com',
      })
    ).rejects.toMatchObject({
      response: {
        status: 409,
        data: { message: 'Bàn vừa có khách khác đặt, vui lòng chọn bàn khác' },
      },
    })

    // Existing seeded hold on tbl-b07 expires after 17+ minutes
    const after18Min = new Date(Date.now() + 18 * 60_000)
    const released = runExpiryScan(after18Min)
    expect(released).toBeGreaterThanOrEqual(1)
  })

  it('supports Waitstaff check-in by phone, Set Menu order, course-aware add items, transfer conflict, and checkout guard', async () => {
    const client = createTestClient()
    const token = await loginAs(client, 'mai.tt')
    const headers = { Authorization: `Bearer ${token}` }

    // 1. Check in B05 via phone number -> auto-creates Set Menu order (Course 1 Cooking, Course 2/3 OnHold)
    const checkIn = await client.post(
      '/tables/tbl-b05/check-in',
      { reservationCode: '0901 234 567' },
      { headers }
    )
    expect(checkIn.data.table.status).toBe('Occupied')
    expect(checkIn.data.order?.items).toHaveLength(3)
    expect(checkIn.data.order.items[0].status).toBe('Cooking')
    expect(checkIn.data.order.items[1].status).toBe('OnHold')
    expect(checkIn.data.order.items[2].status).toBe('OnHold')

    // 2. B03 has MainCourse Cooking & Dessert OnHold -> adding MainCourse cooks now, Dessert stays OnHold
    const added = await client.post(
      '/orders/ord-b03/items',
      {
        items: [
          { menuItemId: 'item-wagyu', quantity: 1, note: 'Medium' },
          { menuItemId: 'item-souffle', quantity: 1 },
        ],
      },
      { headers }
    )
    const addedWagyu = added.data.items.find(
      (i: { menuItemId: string; status: string }) => i.menuItemId === 'item-wagyu'
    )
    const addedSouffle = added.data.items.find(
      (i: { menuItemId: string; status: string }) => i.menuItemId === 'item-souffle'
    )
    expect(addedWagyu.status).toBe('Cooking')
    expect(addedSouffle.status).toBe('OnHold')

    // 3. B08 has 0 Served items -> request-checkout returns 409; B03 has Served items -> succeeds & locks
    await expect(
      client.post('/tables/tbl-b08/request-checkout', {}, { headers })
    ).rejects.toMatchObject({ response: { status: 409 } })

    const reqCheckout = await client.post(
      '/tables/tbl-b03/request-checkout',
      {},
      { headers }
    )
    expect(reqCheckout.data.status).toBe('PaymentPending')

    await expect(
      client.post(
        '/orders/ord-b03/items',
        { items: [{ menuItemId: 'item-nuoc-khoang', quantity: 1 }] },
        { headers }
      )
    ).rejects.toMatchObject({ response: { status: 409 } })

    // 4. Transfer to a non-Available target returns 409
    await expect(
      client.post(
        '/tables/tbl-b05/transfer',
        { targetTableId: 'tbl-b08' },
        { headers }
      )
    ).rejects.toMatchObject({
      response: { status: 409, data: { message: 'Bàn đích không còn trống' } },
    })

    // 5. Creating walk-in order with Set Menu + SoldOut item returns 400
    await client.post('/tables/tbl-b06/walk-in', { guestCount: 2 }, { headers })
    await expect(
      client.post(
        '/orders',
        {
          tableId: 'tbl-b06',
          guestCount: 2,
          items: [{ menuItemId: 'item-so-diep', quantity: 1 }],
        },
        { headers }
      )
    ).rejects.toMatchObject({ response: { status: 400 } })

    const setOrder = await client.post(
      '/orders',
      {
        tableId: 'tbl-b06',
        guestCount: 2,
        tastingMenuId: 'set-hai-san',
        items: [],
      },
      { headers }
    )
    expect(setOrder.status).toBe(201)
    expect(setOrder.data.items).toHaveLength(3)
  })

  it('rejects Waitstaff and Cashier from serving or remaking Pass items with 403', async () => {
    const client = createTestClient()
    const waiterToken = await loginAs(client, 'mai.tt')
    const cashierToken = await loginAs(client, 'ha.pt')
    const expediterToken = await loginAs(client, 'quan.lm')

    await expect(
      client.patch(
        '/orders/ord-b03/items/oi-b03-3/serve',
        {},
        { headers: { Authorization: `Bearer ${waiterToken}` } }
      )
    ).rejects.toMatchObject({ response: { status: 403 } })

    await expect(
      client.post(
        '/orders/ord-b03/items/oi-b03-3/remake',
        {},
        { headers: { Authorization: `Bearer ${cashierToken}` } }
      )
    ).rejects.toMatchObject({ response: { status: 403 } })

    const remade = await client.post(
      '/orders/ord-b03/items/oi-b03-3/remake',
      {},
      { headers: { Authorization: `Bearer ${expediterToken}` } }
    )
    expect(remade.status).toBe(200)
    expect(remade.data.isRemake).toBe(true)
  })

  it('serves all 4 §10 Set Menus and computes Tinh Hoa & Đặc Tuyển booking deposits', async () => {
    const client = createTestClient()
    const setsRes = await client.get('/menu/tasting-menus')
    expect(setsRes.status).toBe(200)
    expect(setsRes.data).toHaveLength(4)
    expect(
      setsRes.data.map((s: { id: string; price: number; imageUrl: string }) => ({
        id: s.id,
        price: s.price,
        imageUrl: s.imageUrl,
      }))
    ).toEqual([
      { id: 'set-thuong-hang', price: 1_800_000, imageUrl: 'set_thuong_hang.jpg' },
      { id: 'set-hai-san', price: 1_250_000, imageUrl: 'set_hai_san.jpg' },
      { id: 'set-tinh-hoa', price: 1_190_000, imageUrl: 'dish_sup_bao_ngu.jpg' },
      { id: 'set-dac-tuyen', price: 1_850_000, imageUrl: 'dish_wagyu.jpg' },
    ])

    const tinhHoaBooking = await client.post('/reservations', {
      tableId: 'tbl-b06',
      reservationTime: '2026-11-08T19:00:00.000Z',
      partySize: 4,
      preOrderedTastingMenuId: 'set-tinh-hoa',
      fullName: 'Nguyễn Văn An',
      phoneNumber: '0901 234 567',
      email: 'an.nguyen@email.com',
    })
    expect(tinhHoaBooking.data.depositAmount).toBe(1_428_000)

    const dacTuyenBooking = await client.post('/reservations', {
      tableId: 'tbl-v01',
      reservationTime: '2026-11-08T19:00:00.000Z',
      partySize: 4,
      preOrderedTastingMenuId: 'set-dac-tuyen',
      fullName: 'Nguyễn Văn An',
      phoneNumber: '0901 234 567',
      email: 'an.nguyen@email.com',
    })
    expect(dacTuyenBooking.data.depositAmount).toBe(2_220_000)
  })

  it('serves today Pass history on GET /orders/pass/history with RBAC and newest-first order', async () => {
    const client = createTestClient()
    await expect(client.get('/orders/pass/history')).rejects.toMatchObject({
      response: { status: 401 },
    })

    const waiterToken = await loginAs(client, 'mai.tt')
    await expect(
      client.get('/orders/pass/history', {
        headers: { Authorization: `Bearer ${waiterToken}` },
      })
    ).rejects.toMatchObject({ response: { status: 403 } })

    const expediterToken = await loginAs(client, 'quan.lm')
    const res = await client.get('/orders/pass/history', {
      headers: { Authorization: `Bearer ${expediterToken}` },
    })
    expect(res.status).toBe(200)
    expect(res.data.length).toBeGreaterThanOrEqual(5)
    expect(res.data[0].servedByName).toBe('Lê Minh Quân')
    for (let i = 1; i < res.data.length; i += 1) {
      expect(Date.parse(res.data[i - 1].servedAt)).toBeGreaterThanOrEqual(
        Date.parse(res.data[i].servedAt)
      )
    }

    const b01Only = await client.get('/orders/pass/history', {
      params: { tableNumber: 'B01' },
      headers: { Authorization: `Bearer ${expediterToken}` },
    })
    expect(b01Only.data.every((item: { tableNumber: string }) => item.tableNumber === 'B01')).toBe(true)
    expect(b01Only.data.some((item: { remakeCount: number }) => item.remakeCount === 1)).toBe(true)
  })

  it('excludes automatic >= 4h refunds from GET /manager/refunds and returns exception decisions', async () => {
    const client = createTestClient()
    const created = await client.post('/reservations', {
      tableId: 'tbl-b06',
      reservationTime: new Date(Date.now() + 30 * 3_600_000).toISOString(),
      partySize: 2,
      fullName: 'Khách Hủy Sớm',
      phoneNumber: '0988776655',
      email: 'early@email.com',
    })
    await client.post('/payments/vnpay-ipn', {
      bookingCode: created.data.reservation.bookingCode,
      transactionId: 'VNP-EARLY-001',
      paymentMethod: 'Card',
      responseCode: '00',
    })
    const autoCancel = await client.post('/reservations/cancel', {
      bookingCode: created.data.reservation.bookingCode,
      phoneNumber: '0988776655',
      reason: 'Hủy trước 30 tiếng để test tự động hoàn 100%',
    })
    expect(autoCancel.data.refunded).toBe(true)
    expect(autoCancel.data.reservation.status).toBe('Cancelled_Refunded')

    const mgrToken = await loginAs(client, 'long.dh')
    const refundsRes = await client.get('/manager/refunds', {
      headers: { Authorization: `Bearer ${mgrToken}` },
    })
    expect(refundsRes.status).toBe(200)
    const codes = refundsRes.data.map(
      (r: { reservation: { bookingCode: string } }) => r.reservation.bookingCode
    )
    expect(codes).not.toContain(created.data.reservation.bookingCode)
    expect(codes).toContain('VD-2C8N')
    expect(codes).toContain('VD-8P4K')
    expect(codes).toContain('VD-5E1M')
    expect(codes).toContain('VD-6R2T')

    const approvedSeed = refundsRes.data.find(
      (r: { reservation: { bookingCode: string } }) =>
        r.reservation.bookingCode === 'VD-5E1M'
    )
    expect(approvedSeed.decisionAction).toBe('ManualRefundApproved')
    expect(approvedSeed.processedAt).toBeTruthy()
  })

  it('restricts all person names and guest phones in static seed and 120-day history to §10 identities', () => {
    const allowedNames = new Set([
      'Nguyễn Văn An',
      'Trần Thị Mai',
      'Lê Minh Quân',
      'Phạm Thu Hà',
      'Đỗ Hoàng Long',
    ])
    const now = new Date()
    const seed = createInitialMockDb(now)
    const history = getHistorical120DayData(now)

    const observedNames = new Set<string>()
    const addName = (name?: string | null) => {
      if (name && name.trim()) observedNames.add(name.trim())
    }

    for (const staff of seed.staffs) addName(staff.fullName)
    for (const table of seed.tables) addName(table.assignedStaffName)

    for (const res of [...seed.reservations, ...history.reservations]) {
      addName(res.guest.fullName)
      expect(res.guest.phoneNumber).toBe('0901 234 567')
    }
    for (const order of [...seed.orders, ...history.orders]) {
      addName(order.createByName)
    }
    for (const inv of [...seed.invoices, ...history.invoices]) {
      addName(inv.settleByName)
      addName(inv.waiterName)
    }
    for (const fb of [...seed.feedbacks, ...history.feedbacks]) {
      addName(fb.guestName)
    }

    const unexpected = Array.from(observedNames).filter(
      (name) => !allowedNames.has(name)
    )
    expect(unexpected).toEqual([])
  })

  it('reseeds persisted mock DB when version is legacy or fingerprint mismatches and exposes 4 sets', () => {
    expect(MOCK_DB_VERSION).toBe(2)
    expect(MOCK_SEED_VERSION.startsWith('2-')).toBe(true)

    const store = new Map<string, string>()
    const prevStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v)
        },
        removeItem: (k: string) => {
          store.delete(k)
        },
        clear: () => {
          store.clear()
        },
      },
    })

    try {
      // 1. Old numeric version (1) with stale 2-set catalog
      localStorage.setItem(
        'vd-mock-db',
        JSON.stringify({ version: 1, tastingMenus: [{ id: 'old-1' }, { id: 'old-2' }] })
      )
      const upgradedFromV1 = getMockDb()
      expect(upgradedFromV1.version).toBe(MOCK_SEED_VERSION)
      expect(upgradedFromV1.tastingMenus).toHaveLength(4)

      // 2. Stale fingerprint (matching v2 prefix but different hash)
      localStorage.setItem(
        'vd-mock-db',
        JSON.stringify({ version: '2-00000000', tastingMenus: [{ id: 'stale-1' }] })
      )
      const reseededFromHash = getMockDb()
      expect(reseededFromHash.version).toBe(MOCK_SEED_VERSION)
      expect(reseededFromHash.tastingMenus).toHaveLength(4)
    } finally {
      if (prevStorage) {
        Object.defineProperty(globalThis, 'localStorage', prevStorage)
      } else {
        delete (globalThis as { localStorage?: unknown }).localStorage
      }
      resetMockDb()
    }
  })
})
