import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const SHOTS_DIR =
  '/home/life/Documents/AGY-Proxy/Response/vindining_web_p1.txt/shots-p5a'

function attachErrorGuard(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
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

test.describe('Phase 5a: Cashier POS (/thu-ngan/*, C1–C4 + Hóa đơn hôm nay)', () => {
  test('1–4. Full Waiter checkout -> Cashier C1/C2/C2p/C3/C3b -> live W1 Cleaning -> B04 0 ₫ -> Hóa đơn hôm nay -> Light mode', async ({
    context,
  }) => {
    // Prepare B05 (Check-in by Waiter + fire all courses + serve all courses on Pass)
    const waiterPage = await context.newPage()
    await waiterPage.setViewportSize({ width: 390, height: 844 })
    const waiterErrors = attachErrorGuard(waiterPage)
    await loginAs(waiterPage, 'mai.tt', /\/phuc-vu$/)

    await waiterPage.getByTestId('waitstaff-table-B05').click()
    await waiterPage
      .getByRole('button', { name: /Check-in khách vào bàn B05/i })
      .click()
    await waiterPage
      .getByRole('link', { name: /Xem Order đang phục vụ/i })
      .click()
    await expect(waiterPage).toHaveURL(/\/phuc-vu\/order\/tbl-b05$/)

    // Waiter fires Course 2 and Course 3
    await waiterPage.getByRole('button', { name: /Kích hoạt Course 2/i }).click()
    await waiterPage.getByRole('button', { name: /Kích hoạt nấu/i }).click()
    await waiterPage.getByRole('button', { name: /Kích hoạt Course 3/i }).click()
    await waiterPage.getByRole('button', { name: /Kích hoạt nấu/i }).click()

    // Expediter serves all 3 courses of B05 on Quầy Pass
    const passPage = await context.newPage()
    await passPage.setViewportSize({ width: 1194, height: 834 })
    const passErrors = attachErrorGuard(passPage)
    await loginAs(passPage, 'quan.lm', /\/dieu-phoi$/)

    for (const course of ['Course1', 'Course2', 'Course3']) {
      const ticket = passPage.getByTestId(`pass-ticket-B05-${course}-cooking`)
      await expect(ticket).toBeVisible()
      await ticket.getByRole('button', { name: 'Xác nhận đi món' }).click()
      await expect(ticket).toHaveCount(0)
    }
    await passPage.close()

    await expect(
      waiterPage.getByText('Đã ra món').nth(2)
    ).toBeVisible()

    // Cashier logs in on desktop (1440x900) at C1 queue
    const cashierPage = await context.newPage()
    await cashierPage.addInitScript(() => {
      window.print = () => {
        ;(window as unknown as { __printCount?: number }).__printCount =
          ((window as unknown as { __printCount?: number }).__printCount ?? 0) +
          1
      }
    })
    await cashierPage.setViewportSize({ width: 1440, height: 900 })
    const cashierErrors = attachErrorGuard(cashierPage)
    await loginAs(cashierPage, 'ha.pt', /\/thu-ngan$/)
    await expect(cashierPage.getByTestId('queue-row-B04')).toBeVisible()

    // Toggle bell mute on/off to verify persistence across reload
    const bellBtn = cashierPage.getByRole('button', { name: /Chuông báo:/i })
    await bellBtn.click()
    await expect(
      cashierPage.getByRole('button', { name: /Chuông báo: Tắt/i })
    ).toBeVisible()
    await bellBtn.click()
    await expect(
      cashierPage.getByRole('button', { name: /Chuông báo: Bật/i })
    ).toBeVisible()

    // Tab 1 (Waiter) requests checkout on B05 -> Tab 2 (Cashier) updates live without reload
    await waiterPage.getByRole('button', { name: 'Yêu cầu tính tiền' }).click()
    await waiterPage
      .getByRole('dialog')
      .getByRole('button', { name: 'Gửi yêu cầu' })
      .click()

    await expect(cashierPage.getByTestId('checkout-alert-banner')).toContainText(
      'Bàn B05 vừa yêu cầu tính tiền'
    )
    const b05Row = cashierPage.getByTestId('queue-row-B05')
    await expect(b05Row).toBeVisible()
    await expect(b05Row).toContainText('6.156.000 ₫')
    await saveShot(cashierPage, 'cashier-queue.png')

    // C2: Open B05 preview
    await b05Row.getByRole('link', { name: /Xem tạm tính/i }).click()
    await expect(cashierPage).toHaveURL(/\/thu-ngan\/tam-tinh\/tbl-b05$/)
    await expect(cashierPage.getByText(/Set Menu Thượng Hạng × 4/i)).toBeVisible()
    await expect(cashierPage.getByText('7.200.000 ₫').first()).toBeVisible()
    await expect(cashierPage.getByText('360.000 ₫')).toBeVisible()
    await expect(cashierPage.getByText('756.000 ₫')).toBeVisible()
    await expect(cashierPage.getByText('8.316.000 ₫')).toBeVisible()
    await expect(cashierPage.getByText('−2.160.000 ₫')).toBeVisible()
    await expect(cashierPage.getByTestId('amount-due-box')).toContainText(
      '6.156.000 ₫'
    )
    await saveShot(cashierPage, 'invoice-preview.png')

    // C2p: Print preview 80mm slip + capture under print media emulation
    await cashierPage
      .getByRole('button', { name: /In phiếu tạm tính \(80mm\)/i })
      .click()
    const slip = cashierPage.getByTestId('receipt-slip-80mm')
    await expect(slip).toContainText('PHIẾU TẠM TÍNH')
    await expect(slip).toContainText('Quét mã để thanh toán')
    await expect(slip.locator('img')).toHaveAttribute('src', /^data:image\/png;base64,/)
    await cashierPage.emulateMedia({ media: 'print' })
    await saveShot(cashierPage, 'print-preview-slip.png')
    await cashierPage.emulateMedia({ media: 'screen' })

    // C3: Continue to payment method selection
    await cashierPage
      .getByRole('button', { name: /Đã in → Tiếp tục thanh toán/i })
      .click()
    await expect(
      cashierPage.getByRole('heading', { name: /Xác nhận thanh toán/i })
    ).toBeVisible()
    await saveShot(cashierPage, 'invoice-payment-methods.png')

    // Settle via VietQR -> C3b
    await cashierPage.getByRole('radio', { name: /VietQR/i }).click()
    await cashierPage
      .getByRole('button', { name: /Xác nhận hoàn tất thanh toán/i })
      .click()
    await expect(
      cashierPage.getByText(/Đã thanh toán Bàn B05 · 6\.156\.000 ₫ · VietQR/i)
    ).toBeVisible()
    const officialSlip = cashierPage.getByTestId('receipt-slip-80mm')
    await expect(officialSlip).toContainText('HÓA ĐƠN')
    await expect(officialSlip).toContainText('Quét mã để đánh giá')
    await expect(officialSlip.locator('img')).toHaveAttribute(
      'src',
      /^data:image\/png;base64,/
    )
    await saveShot(cashierPage, 'invoice-settled.png')

    // C1b: Return to queue -> B05 is gone live, only B04 remains
    await cashierPage
      .getByRole('link', { name: /Về hàng chờ thanh toán/i })
      .click()
    await expect(cashierPage).toHaveURL(/\/thu-ngan$/)
    await expect(cashierPage.getByTestId('queue-row-B04')).toBeVisible()
    await expect(cashierPage.getByTestId('queue-row-B05')).toHaveCount(0)
    await saveShot(cashierPage, 'cashier-queue-after-settle.png')

    // Waiter W1 shows B05 as Đang dọn live (navigate via bottom nav without full reload)
    await waiterPage.getByRole('link', { name: 'Sơ đồ bàn' }).click()
    await expect(waiterPage.getByTestId('waitstaff-table-B05')).toContainText(
      'Đang dọn'
    )
    await saveShot(waiterPage, 'waitstaff-cleaning-after-settle.png')

    // C2x: B04 below-deposit bill = 0 ₫ + minimum-spend note
    await cashierPage
      .getByTestId('queue-row-B04')
      .getByRole('link', { name: /Xem tạm tính/i })
      .click()
    await expect(cashierPage.getByTestId('amount-due-box')).toContainText('0 ₫')
    await expect(cashierPage.getByTestId('minimum-spend-note')).toContainText(
      'Tiền cọc là mức chi tiêu tối thiểu, không hoàn lại phần chênh lệch.'
    )
    await saveShot(cashierPage, 'invoice-b04-zero-due.png')

    // Hóa đơn hôm nay: verify newly settled B05 invoice + reprint modal
    await cashierPage.getByRole('link', { name: 'Hóa đơn hôm nay' }).click()
    await expect(
      cashierPage.getByRole('heading', { name: 'Hóa đơn hôm nay' })
    ).toBeVisible()
    await expect(cashierPage.getByText('6.156.000 ₫').first()).toBeVisible()
    await saveShot(cashierPage, 'cashier-invoices-today.png')

    // Light mode verification shot
    await cashierPage
      .getByRole('button', { name: /Chuyển sang Giao diện sáng/i })
      .click()
    await expect(cashierPage.locator('html')).toHaveAttribute(
      'data-theme',
      'light'
    )
    await cashierPage.waitForTimeout(250)
    await saveShot(cashierPage, 'cashier-light.png')

    expect(waiterErrors).toEqual([])
    expect(passErrors).toEqual([])
    expect(cashierErrors).toEqual([])
  })

  test('5. C4 Check-in khách: reservation lookup by phone + walk-in seating on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors = attachErrorGuard(page)
    await loginAs(page, 'ha.pt', /\/thu-ngan$/)

    await page.getByRole('link', { name: 'Check-in khách' }).click()
    await expect(page).toHaveURL(/\/thu-ngan\/check-in$/)

    // Look up VD-7K3Q by phone number
    await page
      .getByRole('textbox', { name: /Mã đặt bàn hoặc số điện thoại/i })
      .fill('0901 234 567')
    await page.getByRole('button', { name: 'Tìm' }).click()
    await expect(page.getByText(/Nguyễn Văn An/i)).toBeVisible()
    await expect(page.getByText(/Set Menu Thượng Hạng × 4/i)).toBeVisible()

    await page
      .getByRole('button', { name: /Check-in khách vào bàn B05/i })
      .click()
    await expect(page.getByTestId('cashier-checkin-success')).toContainText(
      'Đã check-in Bàn B05'
    )
    await saveShot(page, 'cashier-checkin.png')

    // Also verify Walk-in check-in on Available table B06
    await page.getByRole('tab', { name: 'Khách vãng lai' }).click()
    await page.getByTestId('checkin-table-B06').click()
    await page.getByRole('button', { name: 'Check-in vãng lai' }).click()
    await expect(page.getByTestId('cashier-checkin-success')).toContainText(
      'Đã check-in Bàn B06'
    )

    expect(errors).toEqual([])
  })
})
