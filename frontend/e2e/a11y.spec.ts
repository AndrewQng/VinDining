import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

type Theme = 'dark' | 'light'

interface AxeFailureRecord {
  label: string
  theme: Theme
  id: string
  impact: string | null | undefined
  help: string
  nodes: Array<{ target: unknown; summary?: string }>
}

async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t)
    document.documentElement.style.colorScheme = t
    localStorage.setItem('vd-theme', t)
  }, theme)
  await page.waitForTimeout(220)
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

async function scanAxe(
  page: Page,
  label: string,
  theme: Theme,
  collected: AxeFailureRecord[]
) {
  await setTheme(page, theme)
  const results = await new AxeBuilder({ page }).analyze()
  const bad = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  )
  for (const v of bad) {
    collected.push({
      label,
      theme,
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })
  }
  console.log(`[AXE][${label}][${theme}] serious/critical=${bad.length}`)
}

function assertZeroViolations(collected: AxeFailureRecord[]) {
  if (collected.length > 0) {
    console.log('AXE VIOLATIONS DETAIL:', JSON.stringify(collected, null, 2))
  }
  expect(collected).toEqual([])
}

test.describe('Phase 6 Item 3: Accessibility audit (dark + light)', () => {
  test('Public & Guest pages (/, /dat-ban step 2, /tra-cuu details, /menu/VD-QR-B03, /danh-gia, /dang-nhap)', async ({
    page,
  }) => {
    const collected: AxeFailureRecord[] = []
    await page.setViewportSize({ width: 1280, height: 900 })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await scanAxe(page, '/', 'dark', collected)
    await scanAxe(page, '/', 'light', collected)

    await page.goto('/dat-ban')
    await page.getByRole('button', { name: /Tìm bàn trống/i }).click()
    await expect(page.getByRole('radio').first()).toBeVisible()
    await scanAxe(page, '/dat-ban step 2', 'dark', collected)
    await scanAxe(page, '/dat-ban step 2', 'light', collected)

    await page.goto('/tra-cuu')
    await page.getByLabel(/Mã đặt bàn/i).fill('VD-7K3Q')
    await page.getByLabel(/Số điện thoại/i).fill('0901 234 567')
    await page.getByRole('button', { name: /Tra cứu đặt bàn/i }).click()
    await expect(page.getByRole('heading', { name: 'VD-7K3Q' })).toBeVisible()
    await scanAxe(page, '/tra-cuu details', 'dark', collected)
    await scanAxe(page, '/tra-cuu details', 'light', collected)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/menu/VD-QR-B03')
    await expect(page.getByText(/Bàn B03/i).first()).toBeVisible()
    await scanAxe(page, '/menu/VD-QR-B03', 'dark', collected)
    await scanAxe(page, '/menu/VD-QR-B03', 'light', collected)

    await page.goto('/danh-gia/survey-demo-b01')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await scanAxe(page, '/danh-gia/survey-demo-b01', 'dark', collected)
    await scanAxe(page, '/danh-gia/survey-demo-b01', 'light', collected)

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/dang-nhap')
    await expect(page.getByRole('textbox', { name: /Tên đăng nhập/i })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-area', 'staff')
    await scanAxe(page, '/dang-nhap', 'dark', collected)
    await scanAxe(page, '/dang-nhap', 'light', collected)
    const staffPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase()
    )
    expect(staffPrimary).toBe('#1f5fbf')

    assertZeroViolations(collected)
  })

  test('Waitstaff W1 & W5, Expediter E1, and KDS (/kds)', async ({ page }) => {
    const collected: AxeFailureRecord[] = []

    await page.setViewportSize({ width: 390, height: 844 })
    await loginAs(page, 'mai.tt', /\/phuc-vu$/)
    await expect(page.getByTestId('waitstaff-table-B03')).toBeVisible()
    await scanAxe(page, 'W1', 'dark', collected)
    await scanAxe(page, 'W1', 'light', collected)

    await page.goto('/phuc-vu/order/tbl-b03')
    await expect(page.getByText(/B03/i).first()).toBeVisible()
    await scanAxe(page, 'W5 (B03)', 'dark', collected)
    await scanAxe(page, 'W5 (B03)', 'light', collected)

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/kds')
    await expect(page.getByRole('heading', { name: /KDS BẾP/i })).toBeVisible()
    await scanAxe(page, '/kds', 'dark', collected)
    await scanAxe(page, '/kds', 'light', collected)

    await page.setViewportSize({ width: 1024, height: 768 })
    await page.evaluate(() => localStorage.clear())
    await loginAs(page, 'quan.lm', /\/dieu-phoi$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await scanAxe(page, 'E1', 'dark', collected)
    await scanAxe(page, 'E1', 'light', collected)
    await page.getByRole('tab', { name: /Lịch sử/i }).click()
    await expect(page.getByTestId('pass-history-B03-Course1')).toBeVisible()
    await scanAxe(page, 'E2', 'dark', collected)
    await scanAxe(page, 'E2', 'light', collected)

    assertZeroViolations(collected)
  })

  test('Cashier C1 & C2 (B05) and Manager M1, M2, M5', async ({ page }) => {
    const collected: AxeFailureRecord[] = []
    await page.setViewportSize({ width: 1280, height: 900 })

    await loginAs(page, 'mai.tt', /\/phuc-vu$/)
    await page.getByTestId('waitstaff-table-B05').click()
    await page.getByRole('button', { name: /Check-in khách vào bàn B05/i }).click()
    await expect(page).toHaveURL(/\/phuc-vu\/ban\/tbl-b05$/)

    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await loginAs(page, 'ha.pt', /\/thu-ngan$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await scanAxe(page, 'C1', 'dark', collected)
    await scanAxe(page, 'C1', 'light', collected)

    await page.goto('/thu-ngan/tam-tinh/tbl-b05')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await scanAxe(page, 'C2 (B05)', 'dark', collected)
    await scanAxe(page, 'C2 (B05)', 'light', collected)

    await page.getByRole('button', { name: 'Đăng xuất' }).first().click()
    await loginAs(page, 'long.dh', /\/quan-ly$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await scanAxe(page, 'M1', 'dark', collected)
    await scanAxe(page, 'M1', 'light', collected)

    await page.getByRole('link', { name: 'Sơ đồ bàn', exact: true }).click()
    await expect(page).toHaveURL(/\/quan-ly\/so-do-ban$/)
    await expect(page.getByTestId('floor-node-B03')).toBeVisible()
    await scanAxe(page, 'M2', 'dark', collected)
    await scanAxe(page, 'M2', 'light', collected)

    await page.getByRole('link', { name: 'Hoàn cọc ngoại lệ', exact: true }).click()
    await expect(page).toHaveURL(/\/quan-ly\/hoan-coc$/)
    await expect(page.getByTestId('refund-row-VD-2C8N')).toBeVisible()
    await scanAxe(page, 'M3 pending', 'dark', collected)
    await scanAxe(page, 'M3 pending', 'light', collected)
    await page.getByRole('tab', { name: /Đã xử lý/i }).click()
    await expect(page.getByTestId('refund-row-VD-5E1M')).toBeVisible()
    await scanAxe(page, 'M3 processed', 'dark', collected)
    await scanAxe(page, 'M3 processed', 'light', collected)

    await page.getByRole('link', { name: 'Báo cáo', exact: true }).click()
    await expect(page).toHaveURL(/\/quan-ly\/bao-cao$/)
    await expect(page.getByTestId('kpi-total-revenue')).not.toHaveText(/^0 ₫$/)
    await scanAxe(page, 'M5', 'dark', collected)
    await scanAxe(page, 'M5', 'light', collected)

    assertZeroViolations(collected)
  })
})
