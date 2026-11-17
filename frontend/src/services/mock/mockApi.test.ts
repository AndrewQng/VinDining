import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ALL_MOCK_ROUTES,
  DEMO_STAFF_ACCOUNTS,
  installMockAdapter,
  resetMockDb,
  runExpiryScan,
} from './index'

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
})
