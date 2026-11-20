import { expect, test, type Locator, type Page } from '@playwright/test'

/** Box in page coordinates, so a scroll Playwright makes to reach an element does not count as movement. */
async function box(locator: Locator) {
  const b = await locator.boundingBox()
  expect(b).not.toBeNull()
  const scroll = await locator.page().evaluate(() => ({ x: window.scrollX, y: window.scrollY }))
  return { ...b!, x: b!.x + scroll.x, y: b!.y + scroll.y }
}

/** Box relative to the viewport, for "is it on screen" checks. */
async function viewportBox(locator: Locator) {
  const b = await locator.boundingBox()
  expect(b).not.toBeNull()
  return b!
}

async function expectSameBox(locator: Locator, before: Awaited<ReturnType<typeof box>>, label: string) {
  const after = await box(locator)
  for (const k of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(after[k] - before[k]), `${label} ${k}`).toBeLessThanOrEqual(0.5)
  }
}

async function openTableStep(page: Page) {
  await page.goto('/dat-ban')
  await page.evaluate(() => sessionStorage.clear())
  await page.goto('/dat-ban')
  await expect(page.getByTestId('booking-step-time-zone')).toBeVisible()
  await page.getByTestId('booking-nav-next').click()
  await expect(page.getByTestId('guest-room')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
}

test.describe('G1.2 floor plan picker', () => {
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ]) {
    test(`every table of every zone is on screen without scrolling at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await openTableStep(page)
      const frame = page.getByTestId('guest-plan-frame')
      const legend = page.getByRole('list', { name: 'Chú thích' })
      const frameBox = await box(frame)
      const legendBox = await box(legend)

      for (const zone of ['MainHall', 'VIP', 'Balcony']) {
        await page.getByTestId(`table-zone-${zone}`).click()
        await page.evaluate(() => window.scrollTo(0, 0))
        const nodes = page.locator('[data-testid^="guest-floor-node-"]')
        const count = await nodes.count()
        expect(count, zone).toBeGreaterThan(0)
        for (let i = 0; i < count; i += 1) {
          const b = await viewportBox(nodes.nth(i))
          expect(b.x, `${zone} #${i} left`).toBeGreaterThanOrEqual(0)
          expect(b.y, `${zone} #${i} top`).toBeGreaterThanOrEqual(0)
          expect(b.x + b.width, `${zone} #${i} right`).toBeLessThanOrEqual(vp.width)
          expect(b.y + b.height, `${zone} #${i} bottom`).toBeLessThanOrEqual(vp.height)
        }
        // Switching zone keeps the plan frame and the legend where they were.
        await expectSameBox(frame, frameBox, `${zone} frame`)
        await expectSameBox(legend, legendBox, `${zone} legend`)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width)
    })
  }

  test('the plan turns to portrait on a phone and stays landscape on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openTableStep(page)
    await expect(page.getByTestId('guest-room')).toHaveAttribute('data-orientation', 'landscape')
    await page.setViewportSize({ width: 390, height: 844 })
    await openTableStep(page)
    await expect(page.getByTestId('guest-room')).toHaveAttribute('data-orientation', 'portrait')
  })

  test('arrow keys move between free tables and Enter selects without moving anything', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openTableStep(page)
    const frame = page.getByTestId('guest-plan-frame')
    const next = page.getByTestId('booking-nav-next')
    const summary = page.getByTestId('booking-summary-card')
    const before = { frame: await box(frame), next: await box(next), summary: await box(summary) }

    const first = page.locator('[data-testid^="guest-floor-node-"][tabindex="0"]')
    await expect(first).toHaveCount(1)
    await first.focus()
    const startId = await first.getAttribute('data-testid')
    await page.keyboard.press('ArrowRight')
    const movedId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(movedId).toMatch(/^guest-floor-node-/)
    expect(movedId).not.toBe(startId)

    await page.keyboard.press('Enter')
    const chosen = page.getByTestId(movedId!)
    await expect(chosen).toHaveAttribute('aria-checked', 'true')
    await expect(next).toBeEnabled()
    await expect(summary).toContainText(`Bàn ${movedId!.slice(-3)}`)

    await expectSameBox(frame, before.frame, 'frame')
    await expectSameBox(next, before.next, 'next button')
    await expectSameBox(summary, before.summary, 'summary')
  })

  test('taken and too-small tables are shown but cannot be chosen', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openTableStep(page)
    const blocked = page.locator(
      '[data-testid^="guest-floor-node-"][data-state="taken"], [data-testid^="guest-floor-node-"][data-state="tooSmall"]'
    )
    expect(await blocked.count()).toBeGreaterThan(0)
    await expect(blocked.first()).toBeDisabled()
  })
})

test.describe('G1.1 time and zone step', () => {
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`choosing day, time, party size and zone moves nothing at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await page.goto('/dat-ban')
      await page.evaluate(() => sessionStorage.clear())
      await page.goto('/dat-ban')
      const step = page.getByTestId('booking-step-time-zone')
      await expect(step).toBeVisible()
      const timeTile = page.getByTestId('tz-time-20:00')
      await expect(timeTile).toContainText(/bàn|Hết bàn/)

      const watched = [
        step,
        page.getByTestId('tz-day-other'),
        page.getByTestId('tz-time-18:00'),
        page.getByTestId('tz-party-10'),
        page.getByTestId('tz-zone-Balcony'),
        page.getByTestId('booking-summary-card'),
      ]
      const before = await Promise.all(watched.map(box))

      const days = page.locator('[data-testid^="tz-day-2"]:enabled')
      await days.nth(2).click()
      await expect(days.nth(2)).toHaveAttribute('aria-pressed', 'true')
      await page.getByTestId('tz-party-2').click()
      await page.getByTestId('tz-time-20:00').click()
      await page.getByTestId('tz-zone-VIP').click()
      await expect(page.getByTestId('tz-zone-VIP')).toHaveAttribute('aria-pressed', 'true')

      for (const [i, loc] of watched.entries()) {
        await expectSameBox(loc, before[i], `watched #${i}`)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width)
    })
  }
})
