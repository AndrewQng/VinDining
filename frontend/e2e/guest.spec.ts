import { expect, test, type Page } from '@playwright/test'

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

test.describe('VinDining Guest Website (G0–G4)', () => {
  test('1. Home -> Set Menu Thượng Hạng -> 4 guests -> free table -> hold 2.160.000 ₫ -> VNPAY -> confirmed', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await page.goto('/')
    await expect(
      page.getByRole('heading', {
        name: /Một bữa tối trọn vẹn, từng Course một/i,
      })
    ).toBeVisible()

    // Click "Đặt bàn với set này" on Set Menu Thượng Hạng (first set card)
    await page
      .getByRole('link', { name: /Đặt bàn với set này/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/dat-ban\?set=set-thuong-hang/)

    // Step 1: 4 khách (default) -> Xem bàn trống; stepper has no numbered circles
    const stepper = page.getByRole('navigation', { name: 'Tiến trình đặt bàn' })
    await expect(stepper.getByText(/^[1-6]$/)).toHaveCount(0)
    await expect(page.getByTestId('guest-photo-bg')).toBeVisible()
    await page.getByTestId('booking-nav-next').click()

    // Step 2: Guest floor plan must NOT display internal statuses and must center fitted tables
    await expect(page.getByText(/Đang dọn/i)).toHaveCount(0)
    await expect(page.getByText(/Chờ thanh toán/i)).toHaveCount(0)
    await expect(page.getByText(/Đang phục vụ/i)).toHaveCount(0)

    const floorBalance = await page
      .getByRole('radiogroup', { name: /Chọn bàn tại Sảnh chính/i })
      .evaluate((canvas) => {
        const cb = canvas.getBoundingClientRect()
        const nodes = Array.from(canvas.querySelectorAll('[role="radio"]'))
        const minL = Math.min(...nodes.map((n) => n.getBoundingClientRect().left))
        const maxR = Math.max(...nodes.map((n) => n.getBoundingClientRect().right))
        return { leftGap: minL - cb.left, rightGap: cb.right - maxR }
      })
    expect(Math.abs(floorBalance.leftGap - floorBalance.rightGap)).toBeLessThanOrEqual(6)

    // Keyboard arrow + Enter selection on floor plan
    const b03Radio = page.getByRole('radio', { name: /B03/i })
    await b03Radio.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')

    // Pick free table B06 (6 ghế, Còn trống) -> booked tomorrow -> B03 is also free tomorrow
    await page.getByRole('radio', { name: /B06/i }).click()
    await page.getByTestId('booking-nav-next').click()

    // Step 3: Set Menu Thượng Hạng pre-selected; background stays constant across selection
    const initialBgSrc = await page
      .getByTestId('guest-photo-bg')
      .locator('img')
      .evaluate((img: HTMLImageElement) => img.currentSrc)
    await page.getByRole('button', { name: /Gọi món tại nhà hàng/i }).click()
    await expect
      .poll(() =>
        page
          .getByTestId('guest-photo-bg')
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.currentSrc)
      )
      .toBe(initialBgSrc)
    await page.getByRole('button', { name: /Set Menu Thượng Hạng/i }).click()

    // Clickable completed stepper dot goes back to Step 2 and preserves selection
    await page
      .getByRole('button', { name: /Quay lại bước 2: Chọn bàn/i })
      .click()
    await expect(page.getByRole('radio', { name: /B06/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    await page.getByTestId('booking-nav-next').click()

    // Step 3: shows 7.200.000 & 2.160.000
    await expect(page.getByText(/7\.200\.000 ₫/)).toBeVisible()
    await expect(page.getByText(/2\.160\.000 ₫/).first()).toBeVisible()
    await page.getByTestId('booking-nav-next').click()

    // Step 4: Contact info
    await page.getByLabel(/Họ và tên/i).fill('Nguyễn Văn An')
    await page.getByLabel(/Số điện thoại/i).fill('0901 234 567')
    await page.getByLabel(/Email/i).fill('an.nguyen@email.com')
    await page.getByTestId('booking-nav-next').click()

    // Step 5: Hold shows 2.160.000 ₫
    await expect(page.getByText(/Thời gian giữ chỗ còn lại/i)).toBeVisible()
    await expect(page.getByText(/2\.160\.000 ₫/).first()).toBeVisible()
    await page.getByTestId('booking-nav-next').click()

    // Step 6: VNPAY mock
    await expect(page).toHaveURL(/\/thanh-toan\/vnpay\/VD-/)
    await expect(
      page.getByRole('heading', { name: /Cổng thanh toán VNPAY \(mô phỏng\)/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /Xác nhận thanh toán/i }).click()

    // Step 7: Confirmation shows reservation code
    await expect(
      page.getByRole('heading', { name: /Đặt bàn thành công!/i })
    ).toBeVisible()
    await expect(page.getByText(/MÃ ĐẶT BÀN: VD-/i)).toBeVisible()

    // Verify slot availability: B06 for tomorrow 19:00 is now taken and not selectable
    await page.getByRole('button', { name: /Đặt bàn mới/i }).click()
    await page.getByTestId('booking-nav-next').click()
    await expect(page.getByRole('radio', { name: /B06/i })).toBeDisabled()

    expect(errors).toEqual([])
  })

  test('2. /tra-cuu cancels >= 4h fresh booking (refunded) and < 4h VD-7K3Q booking (forfeited)', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)

    // Create a fresh >= 4h booking first via G1
    await page.goto('/dat-ban?zone=VIP')
    await page.getByTestId('booking-nav-next').click()
    await page.getByRole('radio', { name: /V01/i }).click()
    await page.getByTestId('booking-nav-next').click()
    await page.getByTestId('booking-nav-next').click()
    await page.getByLabel(/Họ và tên/i).fill('Nguyễn Văn An')
    await page.getByLabel(/Số điện thoại/i).fill('0901 234 567')
    await page.getByLabel(/Email/i).fill('an.nguyen@email.com')
    await page.getByTestId('booking-nav-next').click()
    await page.getByTestId('booking-nav-next').click()
    await page.getByRole('button', { name: /Xác nhận thanh toán/i }).click()

    const codeText = await page.getByText(/MÃ ĐẶT BÀN: VD-/i).textContent()
    const freshCode = codeText!.replace(/MÃ ĐẶT BÀN:\s*/i, '').trim()

    // Cancel >= 4h fresh booking -> refunded
    await page.goto('/tra-cuu')
    await expect(page.getByTestId('guest-photo-bg')).toBeVisible()
    await page.getByLabel(/Mã đặt bàn/i).fill(freshCode)
    await page.getByLabel(/Số điện thoại/i).fill('0901 234 567')
    await page.getByRole('button', { name: /Tra cứu đặt bàn/i }).click()

    await expect(page.getByRole('heading', { name: freshCode })).toBeVisible()
    await page.getByRole('button', { name: /Hủy đặt bàn này/i }).click()
    await expect(
      page.getByText(/Xác nhận hủy đặt bàn & hoàn cọc 100%/i)
    ).toBeVisible()
    await page.getByLabel(/Lý do hủy/i).fill('Đổi ngày dùng bữa')
    await page
      .getByRole('button', { name: /Xác nhận hủy & hoàn cọc/i })
      .click()
    await expect(page.getByText(/Đã hủy · đã hoàn cọc/i)).toBeVisible()

    // Cancel < 4h seeded VD-7K3Q -> warning -> forfeited
    await page.getByLabel(/Mã đặt bàn/i).fill('VD-7K3Q')
    await page.getByLabel(/Số điện thoại/i).fill('0901 234 567')
    await page.getByRole('button', { name: /Tra cứu đặt bàn/i }).click()

    await expect(page.getByRole('heading', { name: 'VD-7K3Q' })).toBeVisible()
    await page.getByRole('button', { name: /Hủy đặt bàn này/i }).click()
    await expect(page.getByText(/Cảnh báo chính sách hủy/i)).toBeVisible()
    await page.getByLabel(/Lý do hủy/i).fill('Kẹt lịch gấp')
    await page
      .getByRole('button', { name: /Đồng ý hủy \(không hoàn cọc\)/i })
      .click()
    await expect(page.getByText(/Đã hủy · không hoàn cọc/i)).toBeVisible()

    expect(errors).toEqual([])
  })

  test('3. /menu/<qr> sends Châm nước and invalid QR shows error', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await page.goto('/menu/VD-QR-B03')

    await expect(
      page.getByRole('heading', { name: /VinDining · Bàn B03/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /Châm nước/i }).click()
    await expect(
      page.getByText(/Đã gửi yêu cầu: Châm nước/i)
    ).toBeVisible()

    // Invalid QR -> G3.1x error
    await page.goto('/menu/INVALID-QR')
    await expect(
      page.getByRole('heading', { name: /Không thể mở thực đơn/i })
    ).toBeVisible()
    await expect(
      page.getByText(/Mã QR không hợp lệ hoặc bàn chưa được nhận/i)
    ).toBeVisible()

    expect(errors.filter((e) => !e.includes('404'))).toEqual([])
  })

  test('4. /danh-gia/<token> submits 3 ratings + comment and shows thank-you', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)
    await page.goto('/danh-gia/survey-demo-b01')

    await expect(
      page.getByRole('heading', { name: /Đánh giá dịch vụ/i })
    ).toBeVisible()
    await page.getByRole('radio', { name: /Món ăn: 5 sao/i }).click()
    await page.getByRole('radio', { name: /Không gian: 4 sao/i }).click()
    await page.getByRole('radio', { name: /Thái độ phục vụ: 5 sao/i }).click()
    await page
      .getByLabel(/Ý kiến đóng góp/i)
      .fill('Trải nghiệm bữa tối rất hài lòng.')
    await page.getByRole('button', { name: /Gửi đánh giá/i }).click()

    await expect(
      page.getByRole('heading', { name: /Cảm ơn quý khách!/i })
    ).toBeVisible()
    expect(errors).toEqual([])
  })

  test('5. Theme toggle persists across reload on guest pages with zero console errors', async ({
    page,
  }) => {
    const errors = attachErrorGuard(page)

    for (const path of [
      '/',
      '/dat-ban',
      '/tra-cuu',
      '/menu/VD-QR-B03',
      '/danh-gia/survey-demo-b01',
    ]) {
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(page.locator('html')).toHaveAttribute('data-area', 'guest')
      await page
        .getByRole('button', { name: /Chuyển sang giao diện sáng/i })
        .click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await expect(page.locator('html')).toHaveAttribute('data-area', 'guest')
      const primaryToken = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase()
      )
      expect(primaryToken).toBe('#c68e27')
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await expect(page.locator('html')).toHaveAttribute('data-area', 'guest')
      // Toggle back to dark for next iteration
      await page
        .getByRole('button', { name: /Chuyển sang giao diện tối/i })
        .click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    }

    expect(errors).toEqual([])
  })
})
