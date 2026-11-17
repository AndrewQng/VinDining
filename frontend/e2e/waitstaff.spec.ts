import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const SHOTS_DIR =
  '/home/life/Documents/AGY-Proxy/Response/vindining_web_p1.txt/shots-p3'

function attachErrorGuard(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  return errors
}

async function saveShot(page: Page, filename: string) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
  await page.screenshot({
    path: path.join(SHOTS_DIR, filename),
    fullPage: true,
  })
}

async function loginAsWaitstaff(page: Page) {
  await page.goto('/dang-nhap')
  await page.getByRole('textbox', { name: /Tên đăng nhập/i }).fill('mai.tt')
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('VinDining@2026')
  await page.getByRole('button', { name: /Đăng nhập/i }).click()
  await expect(page).toHaveURL(/\/phuc-vu$/)
  await expect(page.getByText(/Trần Thị Mai · Phục vụ/i)).toBeVisible()
}

test.describe('VinDining Waitstaff Mobile App (W1–W9)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('1. Login -> W1 floor plan -> W2 check-in B05 (VD-7K3Q) -> W2b auto order -> W5/W5f/W5b activate Course 2', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await loginAsWaitstaff(page)

    // W1 Floor plan checks: zone tabs + statuses
    await expect(page.getByRole('tab', { name: /Sảnh chính/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /VIP/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Ban công/i })).toBeVisible()
    await expect(page.getByTestId('waitstaff-table-B05')).toBeVisible()
    await saveShot(page, '01-w1-floor-plan.png')

    // Tap B05 (Reserved) -> opens W2 sheet preloaded with VD-7K3Q
    await page.getByTestId('waitstaff-table-B05').click()
    await expect(page.getByText(/Nguyễn Văn An/i)).toBeVisible()
    await expect(page.getByText(/2\.160\.000/i)).toBeVisible()
    await expect(page.getByText(/Set Menu Thượng Hạng × 4/i)).toBeVisible()
    await saveShot(page, '02-w2-checkin-b05.png')

    await page
      .getByRole('button', { name: /Check-in khách vào bàn B05/i })
      .click()

    // W2b check-in detail
    await expect(page).toHaveURL(/\/phuc-vu\/ban\/tbl-b05/)
    await expect(
      page.getByText(/Đã tạo Order tự động · Course 1 đã gửi bếp/i)
    ).toBeVisible()
    await saveShot(page, '03-w2b-checkin-detail.png')

    // Go to W5 active order
    await page.getByRole('link', { name: /Xem Order đang phục vụ/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/order\/tbl-b05/)
    await expect(page.getByText(/Súp bào ngư thượng hạng/i)).toBeVisible()
    await expect(page.getByText(/Bò Wagyu A5 sốt nấm Truffle/i)).toBeVisible()
    // Ensure NO priority toggle on W5
    await expect(page.getByText(/Ưu tiên|Priority/i)).toHaveCount(0)
    await saveShot(page, '04-w5-active-order.png')

    // W5f modal -> confirm -> W5b
    await page.getByRole('button', { name: /Kích hoạt Course 2/i }).click()
    await expect(
      page.getByRole('heading', { name: /Kích hoạt nấu món/i })
    ).toBeVisible()
    await saveShot(page, '05-w5f-activate-modal.png')

    await page.getByRole('button', { name: /Kích hoạt nấu/i }).click()
    await expect(
      page.getByRole('button', { name: /Kích hoạt Course 3/i })
    ).toBeVisible()
    await saveShot(page, '06-w5b-course2-activated.png')

    expect(errors).toEqual([])
  })

  test('2. W2w walk-in B06 -> W3x SoldOut warning -> W3 create order with note & course rules', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await loginAsWaitstaff(page)

    await page.getByTestId('waitstaff-table-B06').click()
    await expect(
      page.getByRole('heading', { name: /Check-in khách vãng lai/i })
    ).toBeVisible()
    await saveShot(page, '07-w2w-walkin-b06.png')

    await page.getByRole('button', { name: /Check-in vãng lai/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/ban\/tbl-b06/)
    await expect(page.getByText(/Chưa có order/i)).toBeVisible()

    await page.getByRole('link', { name: /Tạo Order/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/tao-order\/tbl-b06/)

    // W3x trigger SoldOut alert when tapping Sò điệp Hokkaido áp chảo
    await page.getByRole('button', { name: /Sò điệp Hokkaido.*tạm hết/i }).click()
    await expect(
      page.getByText(/Sò điệp Hokkaido áp chảo tạm hết/i)
    ).toBeVisible()
    await saveShot(page, '09-w3x-soldout-warning.png')

    // Select items across Course 1, Course 2 (with note), and Course 3
    await page.getByRole('button', { name: /Tăng Súp bào ngư thượng hạng/i }).click()
    await page.getByRole('button', { name: /Tăng Nước khoáng có ga/i }).click()
    await page.getByRole('button', { name: /Tăng Bò Wagyu A5/i }).click()
    await page
      .getByLabel(/Ghi chú cho Bò Wagyu A5/i)
      .fill('Chín vừa')
    await page.getByRole('button', { name: /Tăng Bánh Soufflé/i }).click()
    await saveShot(page, '08-w3-create-order.png')

    await page.getByRole('button', { name: /Gửi đơn/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/order\/tbl-b06/)
    await expect(page.getByText(/Ghi chú: Chín vừa/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Kích hoạt Course 2/i })
    ).toBeVisible()

    expect(errors).toEqual([])
  })

  test('3. W6 add items respects Course status + W7 -> W7x conflict -> W7b successful table transfer', async ({
    page,
    context,
  }) => {
    const errors = attachErrorGuard(page)
    await loginAsWaitstaff(page)

    // Open B03 active order (MainCourse is Cooking, Dessert is OnHold)
    await page.getByTestId('waitstaff-table-B03').click()
    await expect(page).toHaveURL(/\/phuc-vu\/order\/tbl-b03/)

    await page.getByRole('button', { name: /Gọi thêm món/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/goi-them\/tbl-b03/)

    await page.getByRole('button', { name: /Tăng Vang đỏ/i }).click()
    await page.getByRole('button', { name: /Tăng Bò Wagyu A5/i }).click()
    await saveShot(page, '10-w6-add-items.png')

    await page.getByRole('button', { name: /Thêm vào order/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/order\/tbl-b03/)
    await expect(page.getByText(/1× Vang đỏ/i)).toBeVisible()
    await expect(page.getByText(/1× Bò Wagyu A5/i)).toBeVisible()

    // Transfer B03 -> select B06, simulate concurrent walk-in on B06 in Tab 2 -> W7x
    await page.getByRole('button', { name: /Đổi bàn/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/doi-ban\/tbl-b03/)
    await page.getByTestId('transfer-target-B06').click()
    await saveShot(page, '11-w7-transfer-table.png')

    const tab2 = await context.newPage()
    await tab2.goto('/phuc-vu')
    await tab2.getByTestId('waitstaff-table-B06').click()
    await tab2.getByRole('button', { name: /Check-in vãng lai/i }).click()
    await expect(tab2).toHaveURL(/\/phuc-vu\/ban\/tbl-b06/)
    await tab2.close()

    await page.getByRole('button', { name: /Xác nhận chuyển sang B06/i }).click()
    await expect(
      page.getByRole('heading', { name: /Bàn đích không còn trống/i })
    ).toBeVisible()
    await saveShot(page, '12-w7x-transfer-conflict.png')

    // Recover: pick C03 -> W7b success
    await page.getByRole('button', { name: /Chọn lại bàn khác/i }).click()
    await page.getByTestId('transfer-target-C03').click()
    await page.getByRole('button', { name: /Xác nhận chuyển sang C03/i }).click()

    await expect(
      page.getByRole('heading', { name: /Đổi bàn thành công!/i })
    ).toBeVisible()
    await expect(
      page.getByText(/Bàn B03 đã chuyển trạng thái sang Đang dọn/i)
    ).toBeVisible()
    await saveShot(page, '13-w7b-transfer-success.png')

    expect(errors).toEqual([])
  })

  test('4. W8x blocks checkout with 0 Served items (B08) and W8 -> W8b locks order (B03)', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await loginAsWaitstaff(page)

    // B08 has 0 Served items -> W8x
    await page.getByTestId('waitstaff-table-B08').click()
    await expect(page).toHaveURL(/\/phuc-vu\/order\/tbl-b08/)
    await page.getByRole('button', { name: /Yêu cầu tính tiền/i }).click()
    await expect(
      page.getByRole('heading', { name: /Chưa thể tính tiền/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /Đóng/i }).first().click()

    // Navigate back -> B03 has Served items -> W8 confirm -> W8b PaymentPending lock
    await page.getByRole('link', { name: /Quay lại/i }).click()
    await page.getByTestId('waitstaff-table-B03').click()
    await expect(page).toHaveURL(/\/phuc-vu\/order\/tbl-b03/)

    await page.getByRole('button', { name: /Yêu cầu tính tiền/i }).click()
    await expect(
      page.getByRole('heading', { name: /Yêu cầu tính tiền/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /Gửi yêu cầu/i }).click()

    await expect(
      page.getByText(/Đã gửi yêu cầu tính tiền về quầy thu ngân/i)
    ).toBeVisible()
    await expect(
      page.getByText(/Order đã khóa — không thể gọi thêm món/i)
    ).toBeVisible()
    await saveShot(page, '14-w8b-payment-pending.png')

    expect(errors).toEqual([])
  })

  test('5. W9 realtime notification from Guest QR E-Menu & complete -> W9b + dark/light check', async ({
    page,
    context,
  }) => {
    const errors = attachErrorGuard(page)
    await loginAsWaitstaff(page)

    // Go to Notifications (seeded: 2 active calls B03 & B08)
    await page.getByRole('link', { name: /Thông báo/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/thong-bao/)
    await expect(page.getByTestId('waitstaff-unread-badge')).toHaveText('2')

    // Guest QR Tab 2 calls "Gọi phục vụ" on B03 -> realtime arrival on Tab 1
    const guestTab = await context.newPage()
    await guestTab.goto('/menu/VD-QR-B03')
    await guestTab.getByRole('button', { name: /Gọi phục vụ/i }).click()
    await expect(
      guestTab.getByText(/Đã gửi yêu cầu: Gọi phục vụ/i)
    ).toBeVisible()
    await guestTab.close()

    await expect(page.getByTestId('waitstaff-unread-badge')).toHaveText('3')
    await expect(
      page.getByText(/Bàn B03 · Yêu cầu: Gọi phục vụ/i)
    ).toBeVisible()

    // Complete first request -> W9b "Đã hoàn tất" + badge decrements to 2
    await page
      .getByRole('button', { name: /Xác nhận đã phục vụ/i })
      .first()
      .click()
    await expect(page.getByText(/Đã hoàn tất/i)).toBeVisible()
    await expect(page.getByTestId('waitstaff-unread-badge')).toHaveText('2')
    await saveShot(page, '15-w9-notifications.png')

    // Toggle theme dark -> light cleanly with no console errors
    await page.getByRole('button', { name: /Chuyển sang giao diện sáng/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    expect(errors).toEqual([])
  })
})
