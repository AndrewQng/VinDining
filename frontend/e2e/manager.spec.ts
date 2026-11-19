import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const SHOTS_DIR =
  '/home/life/Documents/AGY-Proxy/Response/vindining_web_p1.txt/shots-p5b'

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

test.describe('Phase 5b: Quản lý (/quan-ly/*, M1–M5)', () => {
  test('1. M1 live SoldOut -> Waitstaff W3 locked without reload & duplicate dish M1ax', async ({
    context,
  }) => {
    const waiterPage = await context.newPage()
    await waiterPage.setViewportSize({ width: 390, height: 844 })
    const waiterErrors = attachErrorGuard(waiterPage)
    await loginAs(waiterPage, 'mai.tt', /\/phuc-vu$/)
    await waiterPage.getByTestId('waitstaff-table-B06').click()
    await waiterPage.getByRole('button', { name: /Check-in vãng lai/i }).click()
    await expect(waiterPage).toHaveURL(/\/phuc-vu\/ban\/tbl-b06$|\/phuc-vu\/tao-order\/tbl-b06$/)
    if (!waiterPage.url().includes('/tao-order/')) {
      await waiterPage.getByRole('link', { name: /Tạo Order/i }).click()
    }
    await waiterPage.getByRole('tab', { name: 'Món lẻ' }).click()
    await expect(
      waiterPage.getByRole('button', {
        name: 'Tăng Gỏi tôm hùm sốt chanh leo',
      })
    ).toBeEnabled()

    const mgrPage = await context.newPage()
    await mgrPage.setViewportSize({ width: 1440, height: 900 })
    const mgrErrors = attachErrorGuard(mgrPage)
    await loginAs(mgrPage, 'long.dh', /\/quan-ly$/)
    await expect(
      mgrPage.getByRole('heading', { name: 'Quản lý thực đơn' })
    ).toBeVisible()
    await saveShot(mgrPage, 'm1-dark.png')

    // Toggle Gỏi tôm hùm sốt chanh leo -> Tạm hết
    const lobsterSwitch = mgrPage.getByRole('switch', {
      name: /Trạng thái Gỏi tôm hùm sốt chanh leo/i,
    })
    await lobsterSwitch.click()
    await expect(lobsterSwitch).toHaveText(/Tạm hết/)

    // Waiter's W3 locks that item live without reload
    await expect(
      waiterPage.getByRole('button', {
        name: 'Gỏi tôm hùm sốt chanh leo tạm hết',
      })
    ).toBeVisible()

    // Toggle back to Còn món
    await lobsterSwitch.click()
    await expect(lobsterSwitch).toHaveText(/Còn món/)
    await expect(
      waiterPage.getByRole('button', {
        name: 'Tăng Gỏi tôm hùm sốt chanh leo',
      })
    ).toBeEnabled()

    // Light mode M1 shot
    await mgrPage
      .getByRole('button', { name: /Chuyển sang Giao diện sáng/i })
      .click()
    await expect(mgrPage.locator('html')).toHaveAttribute('data-theme', 'light')
    await mgrPage.waitForTimeout(250)
    await saveShot(mgrPage, 'm1-light.png')
    await mgrPage
      .getByRole('button', { name: /Chuyển sang Giao diện tối/i })
      .click()
    await mgrPage.waitForTimeout(200)

    // M1a dialog & M1ax duplicate dish error
    await mgrPage.getByRole('button', { name: /Thêm món mới/i }).click()
    await mgrPage.getByLabel('Tên món').fill('Món Demo Đặc Biệt')
    await mgrPage.getByLabel(/Đơn giá/i).fill('550000')
    await saveShot(mgrPage, 'm1a-dark.png')

    await mgrPage.getByLabel('Tên món').fill('Súp bào ngư thượng hạng')
    await mgrPage.getByRole('button', { name: /Lưu món mới/i }).click()
    await expect(
      mgrPage.getByText(/Tên món ăn đã tồn tại trong thực đơn/i)
    ).toBeVisible()
    await saveShot(mgrPage, 'm1ax-dark.png')

    expect(waiterErrors).toEqual([])
    expect(mgrErrors).toEqual([])
  })

  test('2. M1s creates new Set Menu -> appears live on Guest HomePage Set Menu section', async ({
    context,
  }) => {
    const guestPage = await context.newPage()
    await guestPage.setViewportSize({ width: 1440, height: 900 })
    const guestErrors = attachErrorGuard(guestPage)
    await guestPage.goto('/')
    await expect(
      guestPage.getByRole('heading', { name: /Set Menu Thượng Hạng/i }).first()
    ).toBeVisible()

    const mgrPage = await context.newPage()
    await mgrPage.setViewportSize({ width: 1440, height: 900 })
    const mgrErrors = attachErrorGuard(mgrPage)
    await loginAs(mgrPage, 'long.dh', /\/quan-ly$/)
    await mgrPage.getByRole('tab', { name: /Set Menu/i }).click()
    await expect(
      mgrPage.getByTestId('set-menu-card-set-thuong-hang')
    ).toBeVisible()

    await mgrPage.getByRole('button', { name: /Tạo Set Menu/i }).click()
    await mgrPage.getByLabel('Tên Set Menu').fill('Set Menu Tinh Hoa')
    await mgrPage.getByLabel(/Giá trọn gói/i).fill('1480000')
    await mgrPage
      .getByRole('dialog')
      .getByRole('button', { name: /Tạo Set Menu/i })
      .click()

    await expect(mgrPage.getByText('Set Menu Tinh Hoa')).toBeVisible()
    await saveShot(mgrPage, 'm1s-dark.png')

    await expect(
      guestPage.getByText('Set Menu Tinh Hoa').first()
    ).toBeVisible()

    expect(guestErrors).toEqual([])
    expect(mgrErrors).toEqual([])
  })

  test('3. M2 add B09, move & save -> Waiter W1 live; M2x Occupied delete refused; B09 QR -> G3 error', async ({
    context,
  }) => {
    const waiterPage = await context.newPage()
    await waiterPage.setViewportSize({ width: 390, height: 844 })
    const waiterErrors = attachErrorGuard(waiterPage)
    await loginAs(waiterPage, 'mai.tt', /\/phuc-vu$/)

    const mgrPage = await context.newPage()
    await mgrPage.setViewportSize({ width: 1440, height: 900 })
    const mgrErrors = attachErrorGuard(mgrPage)
    await loginAs(mgrPage, 'long.dh', /\/quan-ly$/)
    await mgrPage.getByRole('link', { name: 'Sơ đồ bàn', exact: true }).click()
    await expect(mgrPage).toHaveURL(/\/quan-ly\/so-do-ban$/)

    // Add B09 (4 ghế, Sảnh chính)
    await mgrPage.getByRole('button', { name: 'Thêm bàn' }).click()
    await mgrPage.getByLabel('Số hiệu bàn').fill('B09')
    await mgrPage.getByRole('button', { name: /Tạo bàn & sinh QR/i }).click()
    const nodeB09 = mgrPage.getByTestId('floor-node-B09')
    await expect(nodeB09).toBeVisible()

    // Move B09 via keyboard arrow & drag/save -> Waiter W1 picks it up live
    await nodeB09.focus()
    await mgrPage.keyboard.press('ArrowRight')
    await mgrPage.getByRole('button', { name: 'Lưu sơ đồ' }).click()
    await expect(mgrPage.getByText(/Đã lưu cấu hình sơ đồ bàn/i)).toBeVisible()
    await saveShot(mgrPage, 'm2-dark.png')

    await expect(waiterPage.getByTestId('waitstaff-table-B09')).toBeVisible()

    // Show B09 QR & open /menu/VD-QR-B09
    await mgrPage.getByRole('button', { name: /Xem \/ In mã QR/i }).click()
    const qrDialog = mgrPage.getByTestId('m2-qr-preview')
    await expect(qrDialog).toContainText('Bàn B09')
    await expect(qrDialog.locator('img')).toHaveAttribute(
      'src',
      /^data:image\/png;base64,/
    )
    await saveShot(mgrPage, 'm2-qr-dark.png')
    await mgrPage.keyboard.press('Escape')

    const guestPage = await context.newPage()
    await guestPage.setViewportSize({ width: 390, height: 844 })
    await guestPage.goto('/menu/VD-QR-B09')
    await expect(
      guestPage.getByText(/Mã QR không hợp lệ hoặc bàn chưa được nhận/i)
    ).toBeVisible()
    await guestPage.close()

    // Try deleting Occupied table B03 -> M2x refusal
    await mgrPage.getByTestId('floor-node-B03').click()
    await mgrPage.getByRole('button', { name: 'Xóa bàn B03' }).click()
    await mgrPage
      .getByRole('dialog')
      .getByRole('button', { name: 'Xác nhận xóa' })
      .click()
    await expect(mgrPage.getByTestId('m2x-delete-error')).toContainText(
      'chuyển khách trước khi xóa'
    )
    await saveShot(mgrPage, 'm2x-dark.png')

    expect(waiterErrors).toEqual([])
    expect(mgrErrors).toEqual([])
  })

  test('4. M3 approve one refund with reason and reject another', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors = attachErrorGuard(page)
    await loginAs(page, 'long.dh', /\/quan-ly$/)

    await page.getByRole('link', { name: 'Duyệt hoàn cọc' }).click()
    await expect(page).toHaveURL(/\/quan-ly\/hoan-coc$/)
    await expect(page.getByTestId('refund-row-VD-2C8N')).toBeVisible()
    await expect(page.getByTestId('refund-row-VD-8P4K')).toBeVisible()
    await saveShot(page, 'm3-dark.png')

    // Approve VD-2C8N -> Refunded
    await page
      .getByTestId('refund-row-VD-2C8N')
      .getByRole('button', { name: 'Xem' })
      .click()
    await expect(
      page.getByRole('dialog').getByText(/1\.500\.000 ₫/)
    ).toBeVisible()
    await saveShot(page, 'm3d-dark.png')

    await page
      .getByLabel(/Lý do xử lý của Quản lý/i)
      .fill('Chấp thuận hoàn cọc ngoại lệ do công tác đột xuất')
    await page.getByRole('button', { name: /Chấp thuận hoàn cọc/i }).click()
    await expect(page.getByTestId('refund-decision-status')).toContainText(
      'Đã hoàn tiền cọc qua VNPAY'
    )
    await page.getByRole('button', { name: 'Đóng hộp thoại' }).click()

    // Reject VD-8P4K -> RefundRejected
    await page
      .getByTestId('refund-row-VD-8P4K')
      .getByRole('button', { name: 'Xem' })
      .click()
    await page
      .getByLabel(/Lý do xử lý của Quản lý/i)
      .fill('Hủy dưới 4 tiếng không đủ điều kiện ngoại lệ')
    await page.getByRole('button', { name: /Từ chối hoàn cọc/i }).click()
    await expect(page.getByTestId('refund-decision-status')).toContainText(
      'Đã từ chối hoàn cọc'
    )
    await page.getByRole('button', { name: 'Đóng hộp thoại' }).click()

    await page.getByRole('tab', { name: /Tất cả/i }).click()
    await expect(page.getByTestId('refund-row-VD-2C8N')).toContainText('Đã hủy')

    expect(errors).toEqual([])
  })

  test('5. M4 create Thu ngân account -> login -> lock -> refused -> unlock', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors = attachErrorGuard(page)
    await loginAs(page, 'long.dh', /\/quan-ly$/)

    await page.getByRole('link', { name: 'Tài khoản nhân viên' }).click()
    await expect(page).toHaveURL(/\/quan-ly\/tai-khoan$/)
    await expect(page.getByTestId('staff-row-long.dh')).toBeVisible()
    await saveShot(page, 'm4-dark.png')

    // Create Cashier account
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
    await expect(
      page.getByRole('heading', { name: 'Tạo tài khoản nhân viên' })
    ).toBeVisible()
    await saveShot(page, 'm4a-dark.png')

    await page.getByLabel('Họ và tên').fill('Nguyễn Minh Tâm')
    await page.getByLabel('Tên đăng nhập').fill('tam.nm')
    await page.getByLabel('Email').fill('tam.nm@vindining.vn')
    await page.getByLabel('Số điện thoại').fill('0909888777')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Tạo tài khoản' })
      .click()

    await expect(page.getByTestId('staff-credential-banner')).toContainText(
      'tam.nm@vindining.vn'
    )
    const tempPass = await page.getByTestId('mock-temp-password').textContent()
    expect(tempPass).toBeTruthy()

    // Log in with new Cashier account -> /thu-ngan
    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await expect(page).toHaveURL(/\/dang-nhap$/)
    await page.getByRole('textbox', { name: /Tên đăng nhập/i }).fill('tam.nm')
    await page.getByRole('textbox', { name: 'Mật khẩu' }).fill(tempPass!.trim())
    await page.getByRole('button', { name: /Đăng nhập/i }).click()
    await expect(page).toHaveURL(/\/thu-ngan$/)

    // Manager locks tam.nm -> login refused -> unlocks
    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await loginAs(page, 'long.dh', /\/quan-ly$/)
    await page.getByRole('link', { name: 'Tài khoản nhân viên' }).click()
    await page
      .getByTestId('staff-row-tam.nm')
      .getByRole('button', { name: 'Khóa' })
      .click()
    await expect(page.getByTestId('staff-row-tam.nm')).toContainText('Đã khóa')

    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await page.getByRole('textbox', { name: /Tên đăng nhập/i }).fill('tam.nm')
    await page.getByRole('textbox', { name: 'Mật khẩu' }).fill(tempPass!.trim())
    await page.getByRole('button', { name: /Đăng nhập/i }).click()
    await expect(
      page.getByText(/Tài khoản đã bị khóa bởi quản lý/i)
    ).toBeVisible()

    // Unlock back
    await loginAs(page, 'long.dh', /\/quan-ly$/)
    await page.getByRole('link', { name: 'Tài khoản nhân viên' }).click()
    await page
      .getByTestId('staff-row-tam.nm')
      .getByRole('button', { name: 'Mở khóa' })
      .click()
    await expect(page.getByTestId('staff-row-tam.nm')).toContainText(
      'Hoạt động'
    )

    expect(errors).toEqual([])
  })

  test('6. M5 period & zone filters, M5x empty period, Excel (.xlsx) download, print PDF & light mode', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors = attachErrorGuard(page)
    await loginAs(page, 'long.dh', /\/quan-ly$/)

    await page.getByRole('link', { name: 'Báo cáo' }).click()
    await expect(page).toHaveURL(/\/quan-ly\/bao-cao$/)
    await expect(page.getByTestId('kpi-total-revenue')).not.toHaveText(/^0 ₫$/)
    await saveShot(page, 'm5-month-dark.png', true)

    // Excel export triggers a real .xlsx file download
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Xuất Excel' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i)

    // Print emulation screenshot for PDF layout
    await page.emulateMedia({ media: 'print' })
    await saveShot(page, 'm5-print.png')
    await page.emulateMedia({ media: 'screen' })

    // Switch to Quarter + Light mode + filter VIP zone -> KPIs change
    const allMonthRev = await page.getByTestId('kpi-total-revenue').textContent()
    await page.getByRole('tab', { name: 'Quý' }).click()
    await expect(page.getByTestId('report-period-label')).toContainText('Quý')
    await page
      .getByRole('button', { name: /Chuyển sang Giao diện sáng/i })
      .click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.waitForTimeout(250)
    await saveShot(page, 'm5-quarter-light.png', true)

    await page
      .getByRole('button', { name: /Chuyển sang Giao diện tối/i })
      .click()
    await page.waitForTimeout(200)
    await page.getByLabel('Lọc theo khu vực').selectOption('VIP')
    await expect(page.getByTestId('kpi-total-revenue')).not.toHaveText(
      allMonthRev ?? ''
    )

    // Future quarter -> M5x empty state
    await page.getByRole('button', { name: 'Kỳ sau' }).click()
    await expect(page.getByTestId('m5x-empty-report')).toContainText(
      'Không có số liệu trong khoảng thời gian này'
    )
    await saveShot(page, 'm5x-dark.png')

    expect(errors).toEqual([])
  })
})
