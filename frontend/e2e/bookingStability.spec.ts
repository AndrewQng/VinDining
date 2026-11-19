import { expect, test, type Locator, type Page } from '@playwright/test'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

async function setTheme(page: Page, theme: 'dark' | 'light') {
  const current = await page.evaluate(
    () => document.documentElement.getAttribute('data-theme') ?? 'dark'
  )
  if (current !== theme) {
    const toggle = page
      .locator('button[aria-label^="Chuyển sang giao diện"]:visible')
      .first()
    await toggle.click()
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}

async function getBox(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

function expectBoxClose(actual: Box, expected: Box, label: string) {
  expect(Math.abs(actual.x - expected.x), `${label} x`).toBeLessThanOrEqual(0.5)
  expect(Math.abs(actual.y - expected.y), `${label} y`).toBeLessThanOrEqual(0.5)
  expect(Math.abs(actual.width - expected.width), `${label} w`).toBeLessThanOrEqual(0.5)
  expect(Math.abs(actual.height - expected.height), `${label} h`).toBeLessThanOrEqual(0.5)
}

test.describe('Booking stability & fixed background', () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const vp of [
      { width: 1440, height: 900, maxTop: 230 },
      { width: 390, height: 844, maxTop: 200 },
      { width: 360, height: 780, maxTop: 200 },
    ] as const) {
      test(`stability (${theme}, ${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.goto('/dat-ban')
        await setTheme(page, theme)

        const bg = page.getByTestId('guest-photo-bg')
        const bgImg = bg.locator('img')
        await expect(bg).toBeVisible()

        // (a) Background box equals viewport and currentSrc stays constant across steps & scroll
        const bgBoxInitial = await getBox(bg)
        expect(Math.abs(bgBoxInitial.x)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(bgBoxInitial.y)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(bgBoxInitial.width - vp.width)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(bgBoxInitial.height - vp.height)).toBeLessThanOrEqual(0.5)

        await expect
          .poll(() => bgImg.evaluate((el: HTMLImageElement) => el.currentSrc))
          .not.toBe('')
        const baseSrc = await bgImg.evaluate((el: HTMLImageElement) => el.currentSrc)

        // (d) Step-card top budget on step 1
        const stepCardTop = await getBox(page.getByTestId('booking-step-card'))
        expect(stepCardTop.y).toBeLessThanOrEqual(vp.maxTop)

        // (c) Summary height on step 1 (time-zone) & Summary/Nav order
        const summaryCard = page.getByTestId('booking-summary-card')
        const navBar = page.getByTestId('booking-nav')
        const summaryBoxTimeZone = await getBox(summaryCard)
        const navBoxTimeZone = await getBox(navBar)
        const summaryHeightTimeZone = summaryBoxTimeZone.height
        expect(navBoxTimeZone.y).toBeGreaterThanOrEqual(
          summaryBoxTimeZone.y + summaryBoxTimeZone.height - 1
        )
        if (vp.width < 1024) {
          expect(summaryBoxTimeZone.y).toBeGreaterThanOrEqual(
            stepCardTop.y + stepCardTop.height - 1
          )
        } else {
          expect(Math.abs(navBoxTimeZone.x - summaryBoxTimeZone.x)).toBeLessThanOrEqual(1)
        }

        // Step 1 -> Step 2 (table)
        await page.getByTestId('booking-nav-next').click()
        await expect(page.getByRole('radio', { name: /B06/i })).toBeVisible()
        expect(await bgImg.evaluate((el: HTMLImageElement) => el.currentSrc)).toBe(baseSrc)

        // Select B06 -> Step 3 (set-menu)
        await page.getByRole('radio', { name: /B06/i }).click()
        await page.getByTestId('booking-nav-next').click()
        await expect(page.getByTestId('booking-set-card')).toHaveCount(4)

        // Reset scroll to 0 and check (a) after scroll + (c) summary height on set-menu
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        const bgBoxScrolled = await getBox(bg)
        expectBoxClose(bgBoxScrolled, bgBoxInitial, 'bg after scroll')
        expect(await bgImg.evaluate((el: HTMLImageElement) => el.currentSrc)).toBe(baseSrc)

        await page.evaluate(() => window.scrollTo(0, 0))
        const summaryHeightSetMenu = (await getBox(summaryCard)).height
        expect(Math.abs(summaryHeightSetMenu - summaryHeightTimeZone)).toBeLessThanOrEqual(0.5)

        // (b) Record boxes on Set Menu step before clicking sets
        const setCards = page.getByTestId('booking-set-card')
        const noSetOption = page.getByTestId('booking-no-set-option')
        const summaryPhoto = page.getByTestId('booking-summary-photo')
        const navBack = page.getByTestId('booking-nav-back')
        const navNext = page.getByTestId('booking-nav-next')

        const baselineSetBoxes: Box[] = []
        for (let i = 0; i < 4; i++) {
          baselineSetBoxes.push(await getBox(setCards.nth(i)))
        }
        const baselineNoSet = await getBox(noSetOption)
        const baselineSummary = await getBox(summaryCard)
        const baselinePhoto = await getBox(summaryPhoto)
        const baselineBack = await getBox(navBack)
        const baselineNext = await getBox(navNext)

        for (const clickTarget of [
          setCards.nth(0),
          setCards.nth(1),
          setCards.nth(2),
          setCards.nth(3),
          noSetOption,
        ]) {
          await clickTarget.click()
          await page.evaluate(() => window.scrollTo(0, 0))
          expect(await bgImg.evaluate((el: HTMLImageElement) => el.currentSrc)).toBe(baseSrc)
          for (let i = 0; i < 4; i++) {
            expectBoxClose(await getBox(setCards.nth(i)), baselineSetBoxes[i], `setCard[${i}]`)
          }
          expectBoxClose(await getBox(noSetOption), baselineNoSet, 'noSetOption')
          expectBoxClose(await getBox(summaryCard), baselineSummary, 'summaryCard')
          expectBoxClose(await getBox(summaryPhoto), baselinePhoto, 'summaryPhoto')
          expectBoxClose(await getBox(navBack), baselineBack, 'navBack')
          expectBoxClose(await getBox(navNext), baselineNext, 'navNext')
        }

        // Step 3 -> Step 4 (contact) -> check summary height + bg + no horizontal scroll
        await navNext.click()
        await expect(page.getByLabel(/Họ và tên/i)).toBeVisible()
        await page.evaluate(() => window.scrollTo(0, 0))
        const summaryHeightContact = (await getBox(summaryCard)).height
        expect(Math.abs(summaryHeightContact - summaryHeightTimeZone)).toBeLessThanOrEqual(0.5)
        expect(await bgImg.evaluate((el: HTMLImageElement) => el.currentSrc)).toBe(baseSrc)

        const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
        const clientW = await page.evaluate(() => document.documentElement.clientWidth)
        expect(scrollW).toBeLessThanOrEqual(clientW)
      })
    }
  }
})
