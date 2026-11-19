import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const SHOTS_DIR =
  '/home/life/Documents/AGY-Proxy/Response/vindining_web_p1.txt/shots-p4'

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

async function saveShot(page: Page, filename: string, fullPage = false) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true })
  await page.screenshot({
    path: path.join(SHOTS_DIR, filename),
    fullPage,
  })
}

async function loginAs(
  page: Page,
  username: string,
  expectedPath: RegExp
) {
  await page.goto('/dang-nhap')
  await page.getByRole('textbox', { name: /Tên đăng nhập/i }).fill(username)
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('VinDining@2026')
  await page.getByRole('button', { name: /Đăng nhập/i }).click()
  await expect(page).toHaveURL(expectedPath)
}

test.describe('Phase 4: Quầy Pass (E1) + KDS Bếp (K1) + Phase 2/3 Verification Shots', () => {
  test('1. Waiter activates Course 2 on B05 -> KDS & Pass show B05 Course 2 live without reload', async ({
    context,
  }) => {
    // Waiter logs in first cleanly in Tab 1 (mobile), KDS in Tab 2 (1920x1080), Pass in Tab 3 (1194x834)
    const waiterPage = await context.newPage()
    await waiterPage.setViewportSize({ width: 390, height: 844 })
    const waiterErrors = attachErrorGuard(waiterPage)
    await loginAs(waiterPage, 'mai.tt', /\/phuc-vu$/)

    const kdsPage = await context.newPage()
    await kdsPage.setViewportSize({ width: 1920, height: 1080 })
    const kdsErrors = attachErrorGuard(kdsPage)
    await kdsPage.goto('/kds')
    await expect(kdsPage.getByRole('heading', { name: 'KDS BẾP' })).toBeVisible()
    await expect(
      kdsPage.getByTestId('kds-ticket-B03-Course2-cooking')
    ).toBeVisible()
    await saveShot(kdsPage, 'k1-dark.png')

    const passPage = await context.newPage()
    await passPage.setViewportSize({ width: 1194, height: 834 })
    const passErrors = attachErrorGuard(passPage)
    await loginAs(passPage, 'quan.lm', /\/dieu-phoi$/)
    await expect(
      passPage.getByTestId('pass-ticket-B03-Course2-cooking')
    ).toBeVisible()
    await saveShot(passPage, 'e1-dark.png')

    // Confirm B05 Course 2 is NOT present yet on KDS or Pass
    await expect(kdsPage.getByTestId('kds-ticket-B05-Course2-cooking')).toHaveCount(0)
    await expect(
      passPage.getByTestId('pass-ticket-B05-Course2-cooking')
    ).toHaveCount(0)

    // Waiter checks in B05 (VD-7K3Q) and activates Course 2
    await waiterPage.getByTestId('waitstaff-table-B05').click()
    await waiterPage
      .getByRole('button', { name: /Check-in khách vào bàn B05/i })
      .click()
    await waiterPage.getByRole('link', { name: /Xem Order đang phục vụ/i }).click()
    await waiterPage.getByRole('button', { name: /Kích hoạt Course 2/i }).click()
    await waiterPage.getByRole('button', { name: /Kích hoạt nấu/i }).click()

    // Live updates appear on KDS & Pass without reload
    await expect(
      kdsPage.getByTestId('kds-ticket-B05-Course2-cooking')
    ).toBeVisible()
    await expect(
      passPage.getByTestId('pass-ticket-B05-Course2-cooking')
    ).toBeVisible()

    expect(waiterErrors).toEqual([])
    expect(kdsErrors).toEqual([])
    expect(passErrors).toEqual([])
  })

  test('2. Pass serves B05 Course 1 -> Waiter W9 receives "Món đã sẵn sàng tại quầy Pass" -> KDS ticket disappears', async ({
    context,
  }) => {
    const waiterPage = await context.newPage()
    await waiterPage.setViewportSize({ width: 390, height: 844 })
    const waiterErrors = attachErrorGuard(waiterPage)
    await loginAs(waiterPage, 'mai.tt', /\/phuc-vu$/)

    // Check in B05 first so B05 Course 1 is cooking
    await waiterPage.getByTestId('waitstaff-table-B05').click()
    await waiterPage
      .getByRole('button', { name: /Check-in khách vào bàn B05/i })
      .click()
    await waiterPage.getByRole('link', { name: /Thông báo/i }).click()
    await expect(waiterPage).toHaveURL(/\/phuc-vu\/thong-bao/)

    const kdsPage = await context.newPage()
    await kdsPage.setViewportSize({ width: 1920, height: 1080 })
    const kdsErrors = attachErrorGuard(kdsPage)
    await kdsPage.goto('/kds')
    await expect(
      kdsPage.getByTestId('kds-ticket-B05-Course1-cooking')
    ).toBeVisible()

    const passPage = await context.newPage()
    await passPage.setViewportSize({ width: 1194, height: 834 })
    const passErrors = attachErrorGuard(passPage)
    await loginAs(passPage, 'quan.lm', /\/dieu-phoi$/)
    const b05Pass = passPage.getByTestId('pass-ticket-B05-Course1-cooking')
    await expect(b05Pass).toBeVisible()

    // Expediter confirms served on B05 Course 1
    await b05Pass.getByRole('button', { name: /Xác nhận đi món/i }).click()
    await expect(passPage.getByTestId('pass-feedback-banner')).toContainText(
      /B05.*Đã ra món/i
    )
    await expect(
      passPage.getByTestId('pass-ticket-B05-Course1-cooking')
    ).toHaveCount(0)
    await saveShot(passPage, 'e1b-dark.png')

    // Waiter W9 receives live alert & KDS removes B05 Course 1 ticket
    await expect(
      waiterPage.getByText(/Món đã sẵn sàng tại quầy Pass/i)
    ).toBeVisible()
    await saveShot(waiterPage, 'w9-pass-ready-dark.png')
    await expect(
      kdsPage.getByTestId('kds-ticket-B05-Course1-cooking')
    ).toHaveCount(0)

    // E2 Lịch sử tab on Pass shows newly served B05 Course 1 live + remake history + table filter
    await passPage.getByRole('tab', { name: /Lịch sử/i }).click()
    const b05Hist = passPage.getByTestId('pass-history-B05-Course1')
    await expect(b05Hist).toBeVisible()
    await expect(b05Hist).toContainText('Lê Minh Quân')
    await expect(
      passPage.getByTestId('pass-history-B01-Course2')
    ).toContainText('Làm lại ×1')

    await passPage.getByLabel('Lọc theo bàn').selectOption('B01')
    await expect(passPage.getByTestId('pass-history-B01-Course2')).toBeVisible()
    await expect(passPage.getByTestId('pass-history-B05-Course1')).toHaveCount(0)

    expect(waiterErrors).toEqual([])
    expect(kdsErrors).toEqual([])
    expect(passErrors).toEqual([])
  })

  test('3. Pass requests remake on cooking item -> KDS moves it to Làm lại lane', async ({
    context,
  }) => {
    const kdsPage = await context.newPage()
    await kdsPage.setViewportSize({ width: 1920, height: 1080 })
    const kdsErrors = attachErrorGuard(kdsPage)
    await kdsPage.goto('/kds')
    await expect(
      kdsPage.getByTestId('kds-ticket-B03-Course2-cooking')
    ).toBeVisible()

    const passPage = await context.newPage()
    await passPage.setViewportSize({ width: 1194, height: 834 })
    const passErrors = attachErrorGuard(passPage)
    await loginAs(passPage, 'quan.lm', /\/dieu-phoi$/)

    const b08Card = passPage.getByTestId('pass-ticket-B08-Course2-cooking')
    await b08Card.getByRole('button', { name: /Yêu cầu làm lại/i }).click()
    await expect(
      passPage.getByRole('heading', { name: 'Yêu cầu làm lại món' })
    ).toBeVisible()
    await expect(
      passPage.getByText('Yêu cầu bếp làm lại món này?')
    ).toBeVisible()
    await expect(passPage.getByRole('textbox')).toHaveCount(0)
    await saveShot(passPage, 'e1r-dark.png')

    await passPage.getByRole('button', { name: 'Gửi yêu cầu làm lại' }).click()
    await expect(passPage.getByTestId('pass-feedback-banner')).toContainText(
      /Đã gửi yêu cầu làm lại · B08/i
    )

    // KDS immediately shows B08 Course 2 (now 2 items) inside Làm lại lane and waiter's "Medium rare" note survives
    await expect(
      kdsPage
        .getByTestId('kds-lane-remake')
        .getByTestId('kds-ticket-B08-Course2-remake')
    ).toContainText(/Medium rare/i)

    expect(kdsErrors).toEqual([])
    expect(passErrors).toEqual([])
  })

  test('4. /kds?demo=full paginates (Trang 1 / N), repeats Làm lại, has no data controls, and captures SLA shots', async ({
    context,
  }) => {
    const kdsPage = await context.newPage()
    await kdsPage.setViewportSize({ width: 1920, height: 1080 })
    const kdsErrors = attachErrorGuard(kdsPage)

    await kdsPage.goto('/kds?demo=full')
    await expect(kdsPage.getByTestId('kds-page-indicator')).toHaveText(
      /Trang 1 \/ 2/
    )
    // Only the 2 pager buttons on the entire KDS board
    await expect(kdsPage.getByRole('button')).toHaveCount(2)
    await expect(
      kdsPage
        .getByTestId('kds-lane-remake')
        .getByTestId('kds-ticket-B08-Course2-remake')
    ).toBeVisible()
    await saveShot(kdsPage, 'k1p-page1-dark.png')

    // Go to Page 2 -> Làm lại lane still visible & repeated
    await kdsPage.getByRole('button', { name: /Trang sau/i }).click()
    await expect(kdsPage.getByTestId('kds-page-indicator')).toHaveText(
      /Trang 2 \/ 2/
    )
    await expect(
      kdsPage
        .getByTestId('kds-lane-remake')
        .getByTestId('kds-ticket-B08-Course2-remake')
    ).toBeVisible()
    await saveShot(kdsPage, 'k1p-page2-dark.png')

    // Responsive 1280x720 screenshot
    await kdsPage.setViewportSize({ width: 1280, height: 720 })
    await kdsPage.getByRole('button', { name: /Trang trước/i }).click()
    await saveShot(kdsPage, 'k1-1280-dark.png')

    // Light theme 1920x1080 KDS
    await kdsPage.setViewportSize({ width: 1920, height: 1080 })
    await kdsPage.evaluate(() => localStorage.setItem('vd-theme', 'light'))
    await kdsPage.reload()
    await expect(kdsPage.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(
      kdsPage.getByTestId('kds-lane-remake').locator('article').first()
    ).toBeVisible()
    await kdsPage.waitForTimeout(250)
    await saveShot(kdsPage, 'k1-light.png')

    // Pass with warning + overdue tickets (?demo=full)
    const passPage = await context.newPage()
    await passPage.setViewportSize({ width: 1194, height: 834 })
    await passPage.addInitScript(() => localStorage.setItem('vd-theme', 'dark'))
    await loginAs(passPage, 'quan.lm', /\/dieu-phoi$/)
    await passPage.goto('/dieu-phoi?demo=full')
    await expect(passPage.locator('[data-sla-status="overdue"]')).toBeVisible()
    await expect(
      passPage.locator('[data-sla-status="warning"]').first()
    ).toBeVisible()
    await saveShot(passPage, 'e1-warning-overdue-dark.png')

    await passPage.getByRole('button', { name: /Chuyển sang giao diện sáng/i }).click()
    await expect(passPage.locator('html')).toHaveAttribute('data-theme', 'light')
    await passPage.waitForTimeout(250)
    await saveShot(passPage, 'e1-light.png')

    expect(kdsErrors).toEqual([])
  })

  test('5. Waitstaff token calling Pass serve route gets 403 and UI blocks /dieu-phoi', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await loginAs(page, 'mai.tt', /\/phuc-vu$/)

    // Route protection blocks Waitstaff from viewing /dieu-phoi
    await page.goto('/dieu-phoi')
    await expect(
      page.getByRole('heading', { name: 'Không có quyền truy cập' })
    ).toBeVisible()

    // Direct API call with Waitstaff token rejects with HTTP 403
    const status = await page.evaluate(async () => {
      const { apiClient } = await import('/src/services/api/client.ts')
      try {
        await apiClient.patch('/orders/ord-b03/items/oi-b03-3/serve')
        return 200
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number } }
        return ax.response?.status ?? 0
      }
    })
    expect(status).toBe(403)
    expect(errors).toEqual([])
  })

  test('6. Fixes & remaining screenshots: Mở lại phục vụ, W1 status filter, light & Phase 2/3 views', async ({
    context,
  }) => {
    // Staff captures (390x844)
    const waiter = await context.newPage()
    await waiter.setViewportSize({ width: 390, height: 844 })
    const wErrors = attachErrorGuard(waiter)
    await loginAs(waiter, 'mai.tt', /\/phuc-vu$/)

    // W8x dark screenshot on B08
    await waiter.getByTestId('waitstaff-table-B08').click()
    await waiter.getByRole('button', { name: /Yêu cầu tính tiền/i }).click()
    await expect(
      waiter.getByRole('heading', { name: /Chưa thể tính tiền/i })
    ).toBeVisible()
    await saveShot(waiter, 'w8x-dark.png')
    await waiter.getByRole('button', { name: /Đóng/i }).first().click()

    // W8b dark screenshot with Mở lại phục vụ button on B04, then reopen to Occupied
    await waiter.getByRole('link', { name: /Quay lại/i }).click()
    await waiter.getByTestId('waitstaff-table-B04').click()
    await waiter.getByRole('button', { name: 'Xem Order (đã khóa)' }).click()
    await expect(
      waiter.getByRole('button', { name: 'Mở lại phục vụ' })
    ).toBeVisible()
    await saveShot(waiter, 'w8b-reopen-dark.png')

    // Reopen via W6 locked banner after flipping B04 -> PaymentPending? Already unlocked only after click: test W6 locked light first!
    await waiter.getByRole('button', { name: /Chuyển sang giao diện sáng/i }).click()
    await waiter.waitForTimeout(250)
    await waiter.goto('/phuc-vu/goi-them/tbl-b04')
    await expect(
      waiter.getByText(/Order đã khóa — không thể gọi thêm món/i)
    ).toBeVisible()
    await waiter.waitForTimeout(200)
    await saveShot(waiter, 'w6-locked-light.png')

    // Click "Mở lại phục vụ" on locked W6 -> unlocks W6 immediately!
    await waiter.getByRole('button', { name: 'Mở lại phục vụ' }).click()
    await expect(waiter.getByText(/Vang đỏ \(ly\)/i)).toBeVisible()

    // W1 light & W1 filtered light
    await waiter.goto('/phuc-vu')
    await expect(waiter.getByTestId('waitstaff-table-B01')).toBeVisible()
    await saveShot(waiter, 'w1-light.png')

    await waiter.getByRole('button', { name: /Đang phục vụ \(/i }).click()
    await expect(waiter.getByTestId('waitstaff-table-B03')).toBeVisible()
    await saveShot(waiter, 'w1-filter-light.png')

    // Guest screenshots (dark)
    const guest = await context.newPage()
    const gErrors = attachErrorGuard(guest)
    await guest.addInitScript(() => localStorage.setItem('vd-theme', 'dark'))

    await guest.setViewportSize({ width: 1440, height: 900 })
    await guest.goto('/dat-ban')
    await guest.getByTestId('booking-nav-next').click()
    await expect(guest.getByText(/Còn trống/i).first()).toBeVisible()
    await saveShot(guest, 'g1-floorplan-guest-desktop-dark.png')

    await guest.setViewportSize({ width: 390, height: 844 })
    await guest.goto('/menu/VD-QR-B03')
    await expect(guest.getByText(/Gọi phục vụ/i)).toBeVisible()
    await saveShot(guest, 'g3-menu-mobile-dark.png')

    await guest.goto('/menu/INVALID-QR-999')
    await expect(
      guest.getByRole('heading', { name: 'Không thể mở thực đơn' })
    ).toBeVisible()
    await saveShot(guest, 'g3-invalid-mobile-dark.png')

    expect(wErrors).toEqual([])
    expect(gErrors).toEqual([])
  })
})
