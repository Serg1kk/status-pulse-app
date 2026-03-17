import { expect, test } from "@playwright/test"

test.use({ storageState: { cookies: [], origins: [] } })

test("Status page shows StatusPulse branding", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("System Status")).toBeVisible()
})

test("Status page shows overall status indicator", async ({ page }) => {
  await page.goto("/")
  const allOperational = page.getByText("All Systems Operational")
  const degraded = page.getByText("Degraded Performance")
  const outage = page.getByText("Partial System Outage")

  const isOperational = await allOperational.isVisible().catch(() => false)
  const isDegraded = await degraded.isVisible().catch(() => false)
  const isOutage = await outage.isVisible().catch(() => false)

  expect(isOperational || isDegraded || isOutage).toBeTruthy()
})

test("Status page shows Admin Login link", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Admin Login")).toBeVisible()
})

test("Admin Login link navigates to login", async ({ page }) => {
  await page.goto("/")
  await page.getByText("Admin Login").click()
  await page.waitForURL(/\/(login|dashboard)/)
})

test("Status page is accessible without authentication", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL("/")
})
