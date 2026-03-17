import { expect, test } from "@playwright/test"
import { randomServiceName, randomServiceUrl } from "./utils/random"

test("Services page is accessible and shows correct title", async ({
  page,
}) => {
  await page.goto("/services")
  await expect(
    page.getByRole("heading", { name: "Services" }),
  ).toBeVisible()
  await expect(
    page.getByText("Manage monitored services"),
  ).toBeVisible()
})

test("Add Service button is visible", async ({ page }) => {
  await page.goto("/services")
  await expect(
    page.getByRole("button", { name: "Add Service" }),
  ).toBeVisible()
})

test.describe("Services management", () => {
  test("Create a new service successfully", async ({ page }) => {
    await page.goto("/services")

    const name = randomServiceName()
    const url = randomServiceUrl()

    await page.getByRole("button", { name: "Add Service" }).click()
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("URL").fill(url)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(
      page.getByText("Service created successfully"),
    ).toBeVisible()
    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page.getByText(name)).toBeVisible()
  })

  test("Create service with custom category and interval", async ({
    page,
  }) => {
    await page.goto("/services")

    const name = randomServiceName()

    await page.getByRole("button", { name: "Add Service" }).click()
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("URL").fill("https://example.com/health")
    await page.getByLabel("Category").fill("Payments")
    await page.getByLabel("Check Interval").fill("30")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(
      page.getByText("Service created successfully"),
    ).toBeVisible()
    await expect(page.getByText(name)).toBeVisible()
  })

  test("Cancel service creation", async ({ page }) => {
    await page.goto("/services")

    await page.getByRole("button", { name: "Add Service" }).click()
    await page.getByLabel("Name").fill("Test Service")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Name is required", async ({ page }) => {
    await page.goto("/services")

    await page.getByRole("button", { name: "Add Service" }).click()
    await page.getByLabel("Name").fill("")
    await page.getByLabel("Name").blur()

    await expect(page.getByText("Name is required")).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    let serviceName: string

    test.beforeEach(async ({ page }) => {
      serviceName = randomServiceName()

      await page.goto("/services")
      await page.getByRole("button", { name: "Add Service" }).click()
      await page.getByLabel("Name").fill(serviceName)
      await page.getByLabel("URL").fill("https://example.com/health")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(
        page.getByText("Service created successfully"),
      ).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit a service successfully", async ({ page }) => {
      const serviceRow = page
        .getByRole("row")
        .filter({ hasText: serviceName })
      await serviceRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Edit Service" }).click()

      const updatedName = randomServiceName()
      await page.getByLabel("Name").fill(updatedName)
      await page.getByRole("button", { name: "Save" }).click()

      await expect(
        page.getByText("Service updated successfully"),
      ).toBeVisible()
      await expect(page.getByText(updatedName)).toBeVisible()
    })

    test("Delete a service successfully", async ({ page }) => {
      const serviceRow = page
        .getByRole("row")
        .filter({ hasText: serviceName })
      await serviceRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Service" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("Service deleted successfully"),
      ).toBeVisible()
      await expect(page.getByText(serviceName)).not.toBeVisible()
    })
  })
})
