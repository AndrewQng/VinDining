import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const SHOTS_P6_DIR =
  '/home/life/Documents/AGY-Proxy/Response/vindining_web_p1.txt/shots-p6'

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t)
    document.documentElement.style.colorScheme = t
    localStorage.setItem('vd-theme', t)
  }, theme)
  await page.waitForTimeout(240)
}

async function saveShot(page: Page, filename: string, fullPage = false) {
  fs.mkdirSync(SHOTS_P6_DIR, { recursive: true })
  await page.screenshot({
    path: path.join(SHOTS_P6_DIR, filename),
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

async function assertNoHorizontalOverflow(page: Page, label: string, width: number) {
  await page.setViewportSize({ width, height: 844 })
  await page.waitForTimeout(100)
  const dims = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  console.log(`[RESPONSIVE][${label}][${width}px] scroll=${dims.scrollWidth} client=${dims.clientWidth}`)
  expect(
    dims.scrollWidth,
    `${label} overflows horizontally at ${width}px (scrollWidth=${dims.scrollWidth} > clientWidth=${dims.clientWidth})`
  ).toBeLessThanOrEqual(dims.clientWidth)
}

test.describe('Phase 6 Item 4: Responsive sweep & shots-p6', () => {
  test('Public & Guest routes at 360, 390, 768, 1280, 1440', async ({ page }) => {
    const publicWidths = [360, 390, 768, 1280, 1440]

    // 1. /
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const w of publicWidths) {
      await assertNoHorizontalOverflow(page, '/', w)
      if (w === 360) {
        await setTheme(page, 'dark')
        await saveShot(page, 'home-360-dark.png', true)
      }
      if (w === 1440) {
        await setTheme(page, 'light')
        await saveShot(page, 'home-1440-light.png', true)
        await setTheme(page, 'dark')
      }
    }

    // 2. /dat-ban step 2
    await page.goto('/dat-ban')
    await page.getByRole('button', { name: /Tìm bàn trống/i }).click()
    await expect(page.getByRole('radio').first()).toBeVisible()
    for (const w of publicWidths) {
      await assertNoHorizontalOverflow(page, '/dat-ban step 2', w)
      if (w === 360) {
        await setTheme(page, 'light')
        await saveShot(page, 'booking-360-light.png')
        await setTheme(page, 'dark')
      }
    }

    // 3. /tra-cuu details
    await page.goto('/tra-cuu')
    await page.getByLabel(/Mã đặt bàn/i).fill('VD-7K3Q')
    await page.getByLabel(/Số điện thoại/i).fill('0901 234 567')
    await page.getByRole('button', { name: /Tra cứu đặt bàn/i }).click()
    await expect(page.getByRole('heading', { name: 'VD-7K3Q' })).toBeVisible()
    for (const w of publicWidths) {
      await assertNoHorizontalOverflow(page, '/tra-cuu details', w)
    }

    // 4. /menu/VD-QR-B03
    await page.goto('/menu/VD-QR-B03')
    await expect(page.getByText(/Bàn B03/i).first()).toBeVisible()
    for (const w of publicWidths) {
      await assertNoHorizontalOverflow(page, '/menu/VD-QR-B03', w)
    }

    // 5. /danh-gia/survey-demo-b01
    await page.goto('/danh-gia/survey-demo-b01')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const w of publicWidths) {
      await assertNoHorizontalOverflow(page, '/danh-gia/survey-demo-b01', w)
    }

    // 6. /dang-nhap
    await page.goto('/dang-nhap')
    await expect(page.getByRole('textbox', { name: /Tên đăng nhập/i })).toBeVisible()
    for (const w of publicWidths) {
      await assertNoHorizontalOverflow(page, '/dang-nhap', w)
    }
  })

  test('Waitstaff W1/W5 (360-768), Pass E1 (1024-1440), KDS (1280/1920)', async ({ page }) => {
    // Waitstaff
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAs(page, 'mai.tt', /\/phuc-vu$/)
    await expect(page.getByTestId('waitstaff-table-B05')).toBeVisible()
    for (const w of [360, 390, 768]) {
      await assertNoHorizontalOverflow(page, 'W1', w)
      if (w === 360) {
        await setTheme(page, 'dark')
        await saveShot(page, 'w1-360-dark.png')
      }
    }

    // Check in B05 for C2 (B05) later too, then verify W5
    await page.getByTestId('waitstaff-table-B05').click()
    await page.getByRole('button', { name: /Check-in khách vào bàn B05/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/ban\/tbl-b05$/)

    await page.goto('/phuc-vu/order/tbl-b03')
    await expect(page.getByText(/B03/i).first()).toBeVisible()
    for (const w of [360, 390, 768]) {
      await assertNoHorizontalOverflow(page, 'W5 (B03)', w)
    }

    // KDS
    await page.goto('/kds')
    await expect(page.getByRole('heading', { name: /KDS BẾP/i })).toBeVisible()
    for (const w of [1280, 1920]) {
      await assertNoHorizontalOverflow(page, '/kds', w)
    }

    // Expediter E1
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.evaluate(() => localStorage.removeItem('vd-auth'))
    await loginAs(page, 'quan.lm', /\/dieu-phoi$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const w of [1024, 1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'E1', w)
      if (w === 1024) {
        await setTheme(page, 'dark')
        await saveShot(page, 'e1-1024-dark.png')
      }
    }
  })

  test('Cashier C1/C2 (1280-1440) and Manager M1/M2/M3/M5 (1280-1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })

    // Seed B05 check-in if needed
    await loginAs(page, 'mai.tt', /\/phuc-vu$/)
    await page.getByTestId('waitstaff-table-B05').click()
    await page.getByRole('button', { name: /Check-in khách vào bàn B05/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/ban\/tbl-b05$/)
    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()

    // Cashier
    await loginAs(page, 'ha.pt', /\/thu-ngan$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const w of [1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'C1', w)
    }

    await page.goto('/thu-ngan/tam-tinh/tbl-b05')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const w of [1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'C2 (B05)', w)
      if (w === 1280) {
        await setTheme(page, 'light')
        await saveShot(page, 'c2-1280-light.png')
        await setTheme(page, 'dark')
      }
    }

    // Manager
    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await loginAs(page, 'long.dh', /\/quan-ly$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const w of [1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'M1', w)
    }

    await page.getByRole('link', { name: 'Sơ đồ bàn', exact: true }).click()
    await expect(page).toHaveURL(/\/quan-ly\/so-do-ban$/)
    await expect(page.getByTestId('floor-node-B03')).toBeVisible()
    for (const w of [1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'M2', w)
      if (w === 1280) {
        await setTheme(page, 'dark')
        await saveShot(page, 'm2-1280-dark.png')
      }
    }

    await page.getByRole('link', { name: 'Duyệt hoàn cọc', exact: true }).click()
    await expect(page).toHaveURL(/\/quan-ly\/hoan-coc$/)
    await expect(page.getByTestId('refund-row-VD-2C8N')).toBeVisible()
    for (const w of [1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'M3', w)
      if (w === 1280) {
        await setTheme(page, 'dark')
        await saveShot(page, 'm3-dark.png')
      }
    }

    await page.getByRole('link', { name: 'Báo cáo', exact: true }).click()
    await expect(page).toHaveURL(/\/quan-ly\/bao-cao$/)
    await expect(page.getByTestId('kpi-total-revenue')).not.toHaveText(/^0 ₫$/)
    for (const w of [1280, 1440]) {
      await assertNoHorizontalOverflow(page, 'M5', w)
      if (w === 1440) {
        await setTheme(page, 'dark')
        await saveShot(page, 'm5-month-dark.png', true)
        await page.getByRole('tab', { name: 'Quý' }).click()
        await expect(page.getByTestId('report-period-label')).toContainText('Quý')
        await setTheme(page, 'light')
        await saveShot(page, 'm5-quarter-light.png', true)
        await setTheme(page, 'dark')
      }
    }
  })
})
